import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authorization.substring(7);

    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // --------------------------------------------------
    // VERIFY USER
    // --------------------------------------------------

    const {
      data: userData,
      error: userError,
    } = await admin.auth.getUser(
      accessToken
    );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify your login session.",
        },
        { status: 401 }
      );
    }

    const user =
      userData.user;

    // --------------------------------------------------
    // VERIFY ADMIN
    // --------------------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select("id, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin profile could not be found.",
        },
        { status: 404 }
      );
    }

    if (!profile.is_admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // READ BODY
    // --------------------------------------------------

    let body: {
      payoutId?: string;
      status?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const payoutId =
      body.payoutId?.trim();

    const nextStatus =
      body.status?.trim();

    if (
      !payoutId ||
      !nextStatus
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payout ID and status are required.",
        },
        { status: 400 }
      );
    }

    if (
      nextStatus !== "processing" &&
      nextStatus !== "paid_out"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid payout status.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // LOAD PAYOUT
    // --------------------------------------------------

    const {
      data: payout,
      error: payoutError,
    } = await admin
      .from("freelancer_payouts")
      .select(
        `
        id,
        milestone_id,
        contract_id,
        freelancer_id,
        freelancer_amount,
        status,
        payout_requested_at,
        paid_out_at
        `
      )
      .eq("id", payoutId)
      .maybeSingle();

    if (
      payoutError ||
      !payout
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payout record not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // VALID STATUS TRANSITIONS
    // --------------------------------------------------

    if (
      nextStatus === "processing" &&
      payout.status !== "payout_requested"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only requested payouts can be moved to processing.",
        },
        { status: 409 }
      );
    }

    if (
      nextStatus === "paid_out" &&
      payout.status !== "processing"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only processing payouts can be marked as paid out.",
        },
        { status: 409 }
      );
    }

    const now =
      new Date().toISOString();

    const updateData:
      Record<string, string | null> = {
        status: nextStatus,
        updated_at: now,
      };

    if (
      nextStatus === "paid_out"
    ) {
      updateData.paid_out_at =
        now;
    }

    // --------------------------------------------------
    // UPDATE PAYOUT
    // --------------------------------------------------

    const {
      data: updatedPayout,
      error: updateError,
    } = await admin
      .from("freelancer_payouts")
      .update(updateData)
      .eq("id", payout.id)
      .eq("status", payout.status)
      .select(
        `
        id,
        milestone_id,
        freelancer_id,
        freelancer_amount,
        status,
        paid_out_at
        `
      )
      .maybeSingle();

    if (updateError) {
      console.error(
        "Admin payout update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to update payout.",
        },
        { status: 500 }
      );
    }

    if (!updatedPayout) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payout status changed before this request completed. Refresh and try again.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // CONTRACT ACTIVITY
    // --------------------------------------------------

    if (payout.contract_id) {
      const activity =
        nextStatus === "processing"
          ? `Freelancer payout of ZAR ${Number(
              payout.freelancer_amount || 0
            ).toFixed(2)} moved to processing`
          : `Freelancer payout of ZAR ${Number(
              payout.freelancer_amount || 0
            ).toFixed(2)} marked as paid out`;

      await admin
        .from("contract_activity")
        .insert({
          contract_id:
            payout.contract_id,

          action: activity,
        });
    }

    // --------------------------------------------------
    // NOTIFY FREELANCER
    // --------------------------------------------------

    const notificationTitle =
      nextStatus === "processing"
        ? "Payout Processing"
        : "Payout Sent";

    const notificationBody =
      nextStatus === "processing"
        ? `Your payout of ZAR ${Number(
            payout.freelancer_amount || 0
          ).toFixed(2)} is being processed.`
        : `Your payout of ZAR ${Number(
            payout.freelancer_amount || 0
          ).toFixed(2)} has been marked as paid.`;

    await admin
      .from("notifications")
      .insert({
        user_id:
          payout.freelancer_id,

        title:
          notificationTitle,

        body:
          notificationBody,

        link:
          "/dashboard/freelancer/earnings",

        is_read:
          false,
      });

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        payout: updatedPayout,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Unexpected admin payout update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}