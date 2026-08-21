import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest
) {
  try {
    // ---------------------------------------------
    // ENVIRONMENT
    // ---------------------------------------------

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

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

    // ---------------------------------------------
    // AUTHORIZATION
    // ---------------------------------------------

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
    // GET PAYOUT ID
    // ---------------------------------------------

    const payoutId =
      request.nextUrl.searchParams
        .get("payoutId")
        ?.trim();

    if (!payoutId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payout ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------
    // LOAD PAYOUT
    // ---------------------------------------------

    const {
      data: payout,
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
        paid_out_at,
        payout_reference,
        created_at
        `
      )
      .eq(
        "id",
        payoutId
      )
      .maybeSingle();

    if (payoutError) {
      console.error(
        "Receipt payout lookup error:",
        payoutError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load payout.",
        },
        {
          status: 500,
        }
      );
    }

    if (!payout) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payout record not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ---------------------------------------------
    // SECURITY
    //
    // A freelancer may only retrieve
    // their own payout receipt.
    // ---------------------------------------------

    if (
      payout.freelancer_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not authorised to access this payout.",
        },
        {
          status: 403,
        }
      );
    }

    // ---------------------------------------------
    // ONLY COMPLETED PAYOUTS
    // ---------------------------------------------

    if (
      payout.status !==
      "paid_out"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A receipt is only available after the payout has been completed.",
        },
        {
          status: 409,
        }
      );
    }

    // ---------------------------------------------
    // LOAD MILESTONE
    // ---------------------------------------------

    let milestoneTitle =
      "Project Milestone";

    if (
      payout.milestone_id
    ) {
      const {
        data: milestone,
        error:
          milestoneError,
      } = await admin
        .from("milestones")
        .select(
          "id, title"
        )
        .eq(
          "id",
          payout.milestone_id
        )
        .maybeSingle();

      if (
        milestoneError
      ) {
        console.error(
          "Receipt milestone lookup error:",
          milestoneError
        );
      }

      if (
        milestone?.title
      ) {
        milestoneTitle =
          milestone.title;
      }
    }

    // ---------------------------------------------
    // LOAD FREELANCER PROFILE
    // ---------------------------------------------

    let freelancerName =
      "Freelancer";

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(
        "id, full_name"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

    if (
      profileError
    ) {
      console.error(
        "Receipt profile lookup error:",
        profileError
      );
    }

    if (
      profile?.full_name
    ) {
      freelancerName =
        profile.full_name;
    }

    // ---------------------------------------------
    // LOAD MASKED PAYOUT METHOD
    // ---------------------------------------------

    let bankingDetails:
      {
        accountHolderName:
          string | null;

        bankName:
          string | null;

        accountNumberMasked:
          string | null;

        accountType:
          string | null;

        branchCode:
          string | null;
      } | null = null;

    const {
      data: payoutMethod,
      error:
        payoutMethodError,
    } = await admin
      .from(
        "freelancer_payout_methods"
      )
      .select(
  `
  account_holder_name,
  bank_name,
  account_number,
  account_type,
  branch_code
  `
)
      .eq(
        "freelancer_id",
        user.id
      )
      .maybeSingle();

    if (
      payoutMethodError
    ) {
      console.error(
        "Receipt payout method lookup error:",
        payoutMethodError
      );
    }

    if (payoutMethod) {
      bankingDetails = {
        accountHolderName:
          payoutMethod
            .account_holder_name,

        bankName:
          payoutMethod
            .bank_name,

        accountNumberMasked:
  payoutMethod.account_number
    ? `•••• ${String(
        payoutMethod.account_number
      ).slice(-4)}`
    : null,

        accountType:
          payoutMethod
            .account_type,

        branchCode:
          payoutMethod
            .branch_code,
      };
    }

    // ---------------------------------------------
    // SUCCESS
    // ---------------------------------------------

    return NextResponse.json(
      {
        success: true,

        receipt: {
          payoutId:
            payout.id,

          milestoneId:
            payout.milestone_id,

          milestoneTitle,

          projectId:
            payout.project_id,

          contractId:
            payout.contract_id,

          freelancerName,

          grossAmount:
            Number(
              payout.gross_amount ||
                0
            ),

          platformFee:
            Number(
              payout.platform_fee ||
                0
            ),

          freelancerAmount:
            Number(
              payout.freelancer_amount ||
                0
            ),

          platformFeePercent:
            Number(
              payout.platform_fee_percent ||
                0
            ),

          payoutReference:
            payout.payout_reference ||
            null,

          paymentReceivedAt:
            payout.payment_received_at,

          approvedForPayoutAt:
            payout.approved_for_payout_at,

          payoutRequestedAt:
            payout.payout_requested_at,

          processingStartedAt:
            payout.processing_started_at,

          paidOutAt:
            payout.paid_out_at,

          bankingDetails,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected payout receipt API error:",
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