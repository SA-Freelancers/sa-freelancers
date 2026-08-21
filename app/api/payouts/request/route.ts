import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // ENVIRONMENT VARIABLES
    // --------------------------------------------------

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Missing Supabase server environment variables."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // READ ACCESS TOKEN
    // --------------------------------------------------

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

    // --------------------------------------------------
    // ADMIN CLIENT
    // --------------------------------------------------

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
    // VERIFY LOGGED-IN USER
    // --------------------------------------------------

    const {
      data: userData,
      error: userError,
    } = await admin.auth.getUser(accessToken);

    if (userError || !userData.user) {
      console.error(
        "Payout request authentication error:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Your login session could not be verified.",
        },
        { status: 401 }
      );
    }

    const user = userData.user;

    // --------------------------------------------------
    // READ REQUEST BODY
    // --------------------------------------------------

    let body: {
      payoutId?: string;
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

    if (!payoutId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payout ID is required.",
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
          project_id,
          contract_id,
          freelancer_id,
          client_id,
          gross_amount,
          platform_fee,
          freelancer_amount,
          status,
          approved_for_payout_at,
          payout_requested_at,
          paid_out_at
        `
      )
      .eq("id", payoutId)
      .maybeSingle();

    if (payoutError) {
      console.error(
        "Payout lookup error:",
        payoutError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load payout.",
        },
        { status: 500 }
      );
    }

    if (!payout) {
      return NextResponse.json(
        {
          success: false,
          error: "Payout record not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // VERIFY OWNERSHIP
    // --------------------------------------------------

    if (payout.freelancer_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not authorised to request this payout.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // VERIFY PAYOUT STATUS
    // --------------------------------------------------

    if (payout.status !== "ready_for_payout") {
      return NextResponse.json(
        {
          success: false,
          error:
            payout.status === "payout_requested"
              ? "This payout has already been requested."
              : `This payout is not available for withdrawal. Current status: ${payout.status}.`,
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // EXTRA SAFETY:
    // APPROVAL TIMESTAMP MUST EXIST
    // --------------------------------------------------

    if (!payout.approved_for_payout_at) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This payout has not been approved for release.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // UPDATE PAYOUT
    //
    // IMPORTANT:
    // Match both ID and current status.
    // This prevents duplicate requests.
    // --------------------------------------------------

    const now =
      new Date().toISOString();

    const {
      data: updatedPayout,
      error: updateError,
    } = await admin
      .from("freelancer_payouts")
      .update({
        status: "payout_requested",
        payout_requested_at: now,
        updated_at: now,
      })
      .eq("id", payout.id)
      .eq("freelancer_id", user.id)
      .eq("status", "ready_for_payout")
      .select(
        `
          id,
          milestone_id,
          freelancer_amount,
          status,
          payout_requested_at
        `
      )
      .maybeSingle();

    if (updateError) {
      console.error(
        "Payout request update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to request payout.",
        },
        { status: 500 }
      );
    }

    if (!updatedPayout) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The payout is no longer available. Please refresh the page.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // CONTRACT ACTIVITY
    // --------------------------------------------------

    if (payout.contract_id) {
      const {
        error: activityError,
      } = await admin
        .from("contract_activity")
        .insert({
          contract_id: payout.contract_id,
          action:
            `Freelancer requested payout of ZAR ${Number(
              payout.freelancer_amount || 0
            ).toFixed(2)}`,
        });

      if (activityError) {
        // Do NOT fail the payout request just because
        // activity logging failed.
        console.error(
          "Payout request activity error:",
          activityError
        );
      }
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        payoutId: updatedPayout.id,
        milestoneId: updatedPayout.milestone_id,
        status: updatedPayout.status,
        freelancerAmount:
          updatedPayout.freelancer_amount,
        payoutRequestedAt:
          updatedPayout.payout_requested_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Unexpected payout request API error:",
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