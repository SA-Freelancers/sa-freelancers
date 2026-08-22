import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

// --------------------------------------------------
// MASK BANK ACCOUNT NUMBER
// --------------------------------------------------

function maskAccountNumber(
  accountNumber?: string | null
) {
  if (!accountNumber) {
    return null;
  }

  const clean =
    String(accountNumber)
      .replace(/\s+/g, "")
      .trim();

  if (!clean) {
    return null;
  }

  if (clean.length <= 4) {
    return clean;
  }

  return `•••• ${clean.slice(-4)}`;
}

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
      console.error(
        "Admin payout user verification error:",
        userError
      );

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
        "Admin profile lookup error:",
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

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin profile could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (!profile.is_admin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin access required.",
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
        processing_started_at,
        processing_started_by,
        processed_by,
        payout_reference,
        payout_notes,
        paid_out_at,
        paid_out_by,
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
          error:
            "Unable to load payouts.",
        },
        {
          status: 500,
        }
      );
    }

    const payoutRows =
      payouts || [];

    // --------------------------------------------------
    // LOAD MILESTONES
    // --------------------------------------------------

    const milestoneIds = [
      ...new Set(
        payoutRows
          .map(
            (payout) =>
              payout.milestone_id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];

    let milestoneMap:
      Record<
        string,
        {
          id: string;
          title: string | null;
          status?: string | null;
        }
      > = {};

    if (
      milestoneIds.length >
      0
    ) {
      const {
        data: milestoneRows,
        error: milestoneError,
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

    // --------------------------------------------------
    // LOAD FREELANCER PROFILES
    // --------------------------------------------------

    const freelancerIds = [
      ...new Set(
        payoutRows
          .map(
            (payout) =>
              payout.freelancer_id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];

    let freelancerMap:
      Record<
        string,
        {
          id: string;
          full_name?:
            string | null;
        }
      > = {};

    if (
      freelancerIds.length >
      0
    ) {
      const {
        data: freelancerRows,
        error: freelancerError,
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
          freelancerIds
        );

      if (
        freelancerError
      ) {
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

    // --------------------------------------------------
    // LOAD ADMIN PROFILES FOR AUDIT TRAIL
    // --------------------------------------------------

    const adminIds = [
      ...new Set(
        payoutRows
          .flatMap(
            (payout) => [
              payout
                .processing_started_by,

              payout
                .paid_out_by,

              // Legacy fallback
              payout
                .processed_by,
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

    let adminMap:
      Record<
        string,
        {
          id: string;
          full_name?:
            string | null;
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

      if (
        adminError
      ) {
        console.error(
          "Admin audit profile loading error:",
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
    // LOAD PAYOUT METHODS
    // --------------------------------------------------

    let payoutMethodMap:
      Record<
        string,
        {
          id: string;
          freelancer_id:
            string;

          account_holder_name:
            string;

          bank_name:
            string;

          account_number:
            string;

          account_type:
            string;

          branch_code:
            string;

          status:
            string;

          verified_at?:
            string | null;

          updated_at?:
            string | null;
        }
      > = {};

    if (
      freelancerIds.length >
      0
    ) {
      const {
        data:
          payoutMethodRows,

        error:
          payoutMethodError,
      } = await admin
        .from(
          "freelancer_payout_methods"
        )
        .select(
          `
          id,
          freelancer_id,
          account_holder_name,
          bank_name,
          account_number,
          account_type,
          branch_code,
          status,
          verified_at,
          updated_at
          `
        )
        .in(
          "freelancer_id",
          freelancerIds
        );

      if (
        payoutMethodError
      ) {
        console.error(
          "Admin payout method loading error:",
          payoutMethodError
        );
      }

      for (
        const method of
        payoutMethodRows || []
      ) {
        payoutMethodMap[
          method.freelancer_id
        ] = method;
      }
    }

    // --------------------------------------------------
    // CALCULATE SUMMARY
    // --------------------------------------------------

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
          totalHeld +=
            amount;
          break;

        case "ready_for_payout":
          totalReady +=
            amount;
          break;

        case "payout_requested":
          totalRequested +=
            amount;
          break;

        case "processing":
          totalProcessing +=
            amount;
          break;

        case "paid_out":
          totalPaid +=
            amount;
          break;
      }
    }

    // --------------------------------------------------
    // SAFE ADMIN RESPONSE
    // --------------------------------------------------

    const safePayouts =
      payoutRows.map(
        (payout) => {
          const method =
            payoutMethodMap[
              payout.freelancer_id
            ];

          const processingAdminId =
            payout
              .processing_started_by ||
            payout
              .processed_by ||
            null;

          const paidOutAdminId =
            payout
              .paid_out_by ||
            (
              payout.status ===
                "paid_out"
                ? payout
                    .processed_by
                : null
            );

          return {
            ...payout,

            // ------------------------------------------
            // MILESTONE
            // ------------------------------------------

            milestone_title:
              milestoneMap[
                payout.milestone_id
              ]?.title ||
              "Project Milestone",

            milestone_status:
              milestoneMap[
                payout.milestone_id
              ]?.status ||
              null,

            // ------------------------------------------
            // FREELANCER
            // ------------------------------------------

            freelancer_name:
              freelancerMap[
                payout.freelancer_id
              ]?.full_name ||
              "Freelancer",

            // ------------------------------------------
            // ADMIN AUDIT
            // ------------------------------------------

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

            // ------------------------------------------
            // PAYOUT METHOD
            // ------------------------------------------

            payout_method_id:
              method?.id ||
              null,

            account_holder_name:
              method
                ?.account_holder_name ||
              null,

            bank_name:
              method
                ?.bank_name ||
              null,

            account_number_masked:
              maskAccountNumber(
                method
                  ?.account_number
              ),

            account_type:
              method
                ?.account_type ||
              null,

            branch_code:
              method
                ?.branch_code ||
              null,

            banking_status:
              method?.status ||
              "not_configured",

            banking_verified_at:
              method
                ?.verified_at ||
              null,

            banking_updated_at:
              method
                ?.updated_at ||
              null,
          };
        }
      );

    // --------------------------------------------------
    // RETURN RESPONSE
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        payouts:
          safePayouts,

        summary: {
          held:
            totalHeld,

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
      {
        status: 200,
      }
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
      {
        status: 500,
      }
    );
  }
}