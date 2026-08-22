import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest
) {
  try {
    // --------------------------------------------------
    // ENVIRONMENT VARIABLES
    // --------------------------------------------------

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

    // --------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------

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

    // --------------------------------------------------
    // SUPABASE ADMIN CLIENT
    // --------------------------------------------------

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

    // --------------------------------------------------
    // VERIFY LOGGED-IN USER
    // --------------------------------------------------

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

    // --------------------------------------------------
    // VERIFY ADMIN
    // --------------------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(
        `
        id,
        is_admin
        `
      )
      .eq(
        "id",
        userData.user.id
      )
      .maybeSingle();

    if (profileError) {
      console.error(
        "Payout export admin profile error:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify administrator access.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !profile ||
      !profile.is_admin
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administrator access required.",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------------
    // LOAD PAYOUTS
    // --------------------------------------------------

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
        freelancer_id,
        gross_amount,
        platform_fee,
        freelancer_amount,
        status,
        payout_reference,
        payout_notes,
        payment_received_at,
        approved_for_payout_at,
        payout_requested_at,
        processing_started_at,
        processing_started_by,
        paid_out_at,
        paid_out_by,
        processed_by,
        created_at
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
        "Payout export loading error:",
        payoutError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load payout report.",
        },
        {
          status: 500,
        }
      );
    }

    const payoutRows =
      payouts || [];

    // --------------------------------------------------
    // COLLECT ADMIN IDS
    // --------------------------------------------------

    const adminIds = [
      ...new Set(
        payoutRows
          .flatMap(
            (payout) => [
              payout.processing_started_by,
              payout.paid_out_by,
              payout.processed_by,
            ]
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];

    // --------------------------------------------------
    // LOAD ADMIN NAMES
    // --------------------------------------------------

    let adminMap:
      Record<
        string,
        {
          id: string;
          full_name?: string | null;
        }
      > = {};

    if (
      adminIds.length >
      0
    ) {
      const {
        data: adminRows,
        error: adminError,
      } = await admin
        .from("profiles")
        .select(
          `
          id,
          full_name
          `
        )
        .in(
          "id",
          adminIds
        );

      if (adminError) {
        console.error(
          "Payout export admin-name loading error:",
          adminError
        );
      }

      for (
        const adminProfile of
        adminRows || []
      ) {
        adminMap[
          adminProfile.id
        ] =
          adminProfile;
      }
    }

    // --------------------------------------------------
    // BUILD SAFE EXPORT ROWS
    // --------------------------------------------------

    const safePayouts =
      payoutRows.map(
        (payout) => {
          const processingAdminId =
            payout.processing_started_by ||
            (
              payout.status ===
                "processing" ||
              payout.status ===
                "paid_out"
                ? payout.processed_by
                : null
            );

          const paidOutAdminId =
            payout.paid_out_by ||
            (
              payout.status ===
                "paid_out"
                ? payout.processed_by
                : null
            );

          return {
            ...payout,

            processing_started_by_name:
              processingAdminId
                ? adminMap[
                    processingAdminId
                  ]?.full_name ||
                  "Administrator"
                : null,

            paid_out_by_name:
              paidOutAdminId
                ? adminMap[
                    paidOutAdminId
                  ]?.full_name ||
                  "Administrator"
                : null,
          };
        }
      );

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        payouts:
          safePayouts,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Payout export error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to generate payout report.",
      },
      {
        status: 500,
      }
    );
  }
}