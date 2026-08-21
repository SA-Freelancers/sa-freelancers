import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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

    // VERIFY USER

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
          error:
            "Unable to verify your login session.",
        },
        { status: 401 }
      );
    }

    // VERIFY ADMIN

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select("id, is_admin")
      .eq(
        "id",
        userData.user.id
      )
      .maybeSingle();

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin profile could not be found.",
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

    // LOAD PAYOUTS

    const {
      data: payouts,
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
        platform_fee_percent,
        status,
        payment_received_at,
        approved_for_payout_at,
        payout_requested_at,
        paid_out_at,
        created_at,
        updated_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (payoutError) {
      console.error(
        "Admin payout loading error:",
        payoutError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load payouts.",
        },
        { status: 500 }
      );
    }

    const payoutRows =
      payouts || [];

    // LOAD MILESTONES

    const milestoneIds = [
      ...new Set(
        payoutRows
          .map(
            (payout) =>
              payout.milestone_id
          )
          .filter(Boolean)
      ),
    ];

    let milestoneMap: Record<
      string,
      {
        id: string;
        title: string | null;
      }
    > = {};

    if (
      milestoneIds.length > 0
    ) {
      const {
        data: milestoneRows,
        error: milestoneError,
      } = await admin
        .from("milestones")
        .select("id, title")
        .in(
          "id",
          milestoneIds
        );

      if (milestoneError) {
        console.error(
          "Admin milestone loading error:",
          milestoneError
        );
      }

      for (
        const milestone of
        milestoneRows || []
      ) {
        milestoneMap[
          milestone.id
        ] = milestone;
      }
    }

    // LOAD FREELANCER PROFILES

    const freelancerIds = [
      ...new Set(
        payoutRows
          .map(
            (payout) =>
              payout.freelancer_id
          )
          .filter(Boolean)
      ),
    ];

    let freelancerMap: Record<
      string,
      {
        id: string;
        full_name?: string | null;
      }
    > = {};

    if (
      freelancerIds.length > 0
    ) {
      /*
       * We deliberately select only id and full_name here.
       * If your profiles table uses a different name column,
       * we'll adjust it after the first build/database test.
       */
      const {
        data: freelancerRows,
        error: freelancerError,
      } = await admin
        .from("profiles")
        .select("id, full_name")
        .in(
          "id",
          freelancerIds
        );

      if (freelancerError) {
        console.error(
          "Freelancer profile loading error:",
          freelancerError
        );
      }

      for (
        const freelancer of
        freelancerRows || []
      ) {
        freelancerMap[
          freelancer.id
        ] = freelancer;
      }
    }

    // CALCULATE SUMMARY

    let totalHeld = 0;
    let totalReady = 0;
    let totalRequested = 0;
    let totalProcessing = 0;
    let totalPaid = 0;

    for (
      const payout of
      payoutRows
    ) {
      const amount =
        Number(
          payout.freelancer_amount ||
            0
        );

      switch (
        payout.status
      ) {
        case "held":
          totalHeld += amount;
          break;

        case "ready_for_payout":
          totalReady += amount;
          break;

        case "payout_requested":
          totalRequested += amount;
          break;

        case "processing":
          totalProcessing += amount;
          break;

        case "paid_out":
          totalPaid += amount;
          break;
      }
    }

    const safePayouts =
      payoutRows.map(
        (payout) => ({
          ...payout,

          milestone_title:
            milestoneMap[
              payout.milestone_id
            ]?.title ||
            "Project Milestone",

          freelancer_name:
            freelancerMap[
              payout.freelancer_id
            ]?.full_name ||
            "Freelancer",
        })
      );

    return NextResponse.json(
      {
        success: true,

        payouts:
          safePayouts,

        summary: {
          held: totalHeld,
          ready:
            totalReady,
          requested:
            totalRequested,
          processing:
            totalProcessing,
          paid:
            totalPaid,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Unexpected admin payouts API error:",
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