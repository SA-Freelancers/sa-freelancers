import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Server configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization.substring(7);

    const admin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken:
              false,

            persistSession:
              false,
          },
        }
      );

    // ---------------------------------------------
    // VERIFY USER
    // ---------------------------------------------

    const {
      data: userData,
      error: userError,
    } =
      await admin.auth.getUser(
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
        {
          status: 401,
        }
      );
    }

    const user =
      userData.user;

    // ---------------------------------------------
    // VERIFY FREELANCER ROLE
    // ---------------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(
        `
        id,
        role
        `
      )
      .eq(
        "id",
        user.id
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
            "Profile could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      profile.role !==
      "freelancer"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only freelancers can access earnings.",
        },
        {
          status: 403,
        }
      );
    }

    // ---------------------------------------------
    // LOAD PAYOUTS
    // ---------------------------------------------

    const {
      data: payouts,
      error: payoutError,
    } = await admin
      .from(
        "freelancer_payouts"
      )
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
        created_at
        `
      )
      .eq(
        "freelancer_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (payoutError) {
      console.error(
        "Payout earnings load error:",
        payoutError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load earnings.",
        },
        {
          status: 500,
        }
      );
    }

    const payoutRows =
      payouts || [];

    // ---------------------------------------------
    // LOAD MILESTONE TITLES
    // ---------------------------------------------

    const milestoneIds =
      payoutRows.map(
        (payout) =>
          payout.milestone_id
      );

    let milestoneMap:
      Record<
        string,
        {
          id: string;
          title?: string;
          status?: string;
        }
      > = {};

    if (
      milestoneIds.length >
      0
    ) {
      const {
        data: milestones,
        error:
          milestoneError,
      } = await admin
        .from("milestones")
        .select(
          `
          id,
          title,
          status
          `
        )
        .in(
          "id",
          milestoneIds
        );

      if (
        milestoneError
      ) {
        console.error(
          "Milestone earnings load error:",
          milestoneError
        );
      }

      if (milestones) {
        milestoneMap =
          milestones.reduce(
            (
              map,
              milestone
            ) => {
              map[
                milestone.id
              ] = milestone;

              return map;
            },
            {} as Record<
              string,
              {
                id: string;
                title?: string;
                status?: string;
              }
            >
          );
      }
    }

    // ---------------------------------------------
    // TOTALS
    // ---------------------------------------------

    let held = 0;
    let available = 0;
    let requested = 0;
    let processing = 0;
    let paidOut = 0;
    let platformFees = 0;
    let totalEarned = 0;

    for (
      const payout of
      payoutRows
    ) {
      const freelancerAmount =
        Number(
          payout.freelancer_amount ||
            0
        );

      const platformFee =
        Number(
          payout.platform_fee ||
            0
        );

      totalEarned +=
        freelancerAmount;

      platformFees +=
        platformFee;

      switch (
        payout.status
      ) {
        case "held":
          held +=
            freelancerAmount;
          break;

        case "ready_for_payout":
          available +=
            freelancerAmount;
          break;

        case "payout_requested":
          requested +=
            freelancerAmount;
          break;

        case "processing":
          processing +=
            freelancerAmount;
          break;

        case "paid_out":
          paidOut +=
            freelancerAmount;
          break;
      }
    }

    // ---------------------------------------------
    // RETURN SAFE DATA
    // ---------------------------------------------

    return NextResponse.json(
      {
        success: true,

        totals: {
          held,
          available,
          requested,
          processing,
          paidOut,
          platformFees,
          totalEarned,
        },

        payouts:
          payoutRows.map(
            (payout) => ({
              ...payout,

              milestone:
                milestoneMap[
                  payout.milestone_id
                ] || null,
            })
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected earnings API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected server error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}