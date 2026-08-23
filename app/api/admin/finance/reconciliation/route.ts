import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type Period =
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "year"
  | "all";

function getStartDate(
  period: Period
) {
  const now =
    new Date();

  if (
    period === "all"
  ) {
    return null;
  }

  if (
    period === "today"
  ) {
    const start =
      new Date(now);

    start.setHours(
      0,
      0,
      0,
      0
    );

    return start;
  }

  if (
    period === "7d"
  ) {
    const start =
      new Date(now);

    start.setDate(
      start.getDate() -
        7
    );

    return start;
  }

  if (
    period === "30d"
  ) {
    const start =
      new Date(now);

    start.setDate(
      start.getDate() -
        30
    );

    return start;
  }

  if (
    period === "month"
  ) {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
  }

  return new Date(
    now.getFullYear(),
    0,
    1
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    // --------------------------------------------------
    // ENVIRONMENT
    // --------------------------------------------------

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
      authorization.substring(
        7
      );

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
    // VERIFY USER
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
      .from(
        "profiles"
      )
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

    if (
      profileError
    ) {
      console.error(
        "Reconciliation admin verification error:",
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
      !profile?.is_admin
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
    // REPORTING PERIOD
    // --------------------------------------------------

    const periodParam =
      request.nextUrl
        .searchParams
        .get(
          "period"
        ) ||
      "month";

    const allowedPeriods:
      Period[] = [
        "today",
        "7d",
        "30d",
        "month",
        "year",
        "all",
      ];

    const period:
      Period =
      allowedPeriods.includes(
        periodParam as Period
      )
        ? (
            periodParam as Period
          )
        : "month";

    const startDate =
      getStartDate(
        period
      );

    // --------------------------------------------------
    // LOAD PAYOUTS
    // --------------------------------------------------

    let query =
      admin
        .from(
          "freelancer_payouts"
        )
        .select(
          `
          id,
          gross_amount,
          platform_fee,
          freelancer_amount,
          status,
          payment_received_at,
          approved_for_payout_at,
          payout_requested_at,
          processing_started_at,
          paid_out_at,
          created_at
          `
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    if (
      startDate
    ) {
      query =
        query.gte(
          "created_at",
          startDate
            .toISOString()
        );
    }

    const {
      data: payouts,
      error: payoutError,
    } =
      await query;

    if (
      payoutError
    ) {
      console.error(
        "Reconciliation payout loading error:",
        payoutError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load reconciliation data.",
        },
        {
          status: 500,
        }
      );
    }

    const rows =
      payouts || [];

    // --------------------------------------------------
    // TOTALS
    // --------------------------------------------------

    let grossClientPayments =
      0;

    let platformFeesEarned =
      0;

    let freelancerNetAmount =
      0;

    let held =
      0;

    let ready =
      0;

    let requested =
      0;

    let processing =
      0;

    let paidOut =
      0;

    let paymentCount =
      0;

    let completedCount =
      0;

    let outstandingCount =
      0;

    for (
      const payout of rows
    ) {
      const gross =
        Number(
          payout.gross_amount ||
            0
        );

      const fee =
        Number(
          payout.platform_fee ||
            0
        );

      const freelancerAmount =
        Number(
          payout.freelancer_amount ||
            0
        );

      grossClientPayments +=
        gross;

      platformFeesEarned +=
        fee;

      freelancerNetAmount +=
        freelancerAmount;

      if (
        payout
          .payment_received_at
      ) {
        paymentCount +=
          1;
      }

      switch (
        payout.status
      ) {
        case "held":
          held +=
            freelancerAmount;

          outstandingCount +=
            1;

          break;

        case "ready_for_payout":
          ready +=
            freelancerAmount;

          outstandingCount +=
            1;

          break;

        case "payout_requested":
          requested +=
            freelancerAmount;

          outstandingCount +=
            1;

          break;

        case "processing":
          processing +=
            freelancerAmount;

          outstandingCount +=
            1;

          break;

        case "paid_out":
          paidOut +=
            freelancerAmount;

          completedCount +=
            1;

          break;
      }
    }

    // --------------------------------------------------
    // ACCOUNTING CHECK
    // --------------------------------------------------

    const expectedGross =
      platformFeesEarned +
      freelancerNetAmount;

    const accountingDifference =
      grossClientPayments -
      expectedGross;

    const accountingBalanced =
      Math.abs(
        accountingDifference
      ) <
      0.01;

    // --------------------------------------------------
    // MONTHLY FINANCIAL DATA
    // --------------------------------------------------

    const monthlyMap:
      Record<
        string,
        {
          gross: number;
          fees: number;
          freelancer: number;
        }
      > = {};

    for (
      const payout of rows
    ) {
      const sourceDate =
        payout.payment_received_at ||
        payout.created_at;

      if (
        !sourceDate
      ) {
        continue;
      }

      const date =
        new Date(
          sourceDate
        );

      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() +
            1
        ).padStart(
          2,
          "0"
        )}`;

      if (
        !monthlyMap[
          key
        ]
      ) {
        monthlyMap[
          key
        ] = {
          gross:
            0,

          fees:
            0,

          freelancer:
            0,
        };
      }

      monthlyMap[
        key
      ].gross +=
        Number(
          payout.gross_amount ||
            0
        );

      monthlyMap[
        key
      ].fees +=
        Number(
          payout.platform_fee ||
            0
        );

      monthlyMap[
        key
      ].freelancer +=
        Number(
          payout.freelancer_amount ||
            0
        );
    }

    const monthly =
      Object.entries(
        monthlyMap
      )
        .sort(
          (
            [a],
            [b]
          ) =>
            a.localeCompare(
              b
            )
        )
        .map(
          (
            [
              month,
              values,
            ]
          ) => ({
            month,
            gross:
              values.gross,

            fees:
              values.fees,

            freelancer:
              values.freelancer,
          })
        );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json(
      {
        success:
          true,

        period,

        range: {
          from:
            startDate
              ? startDate
                  .toISOString()
              : null,

          to:
            new Date()
              .toISOString(),
        },

        totals: {
          grossClientPayments,

          platformFeesEarned,

          freelancerNetAmount,

          held,

          ready,

          requested,

          processing,

          paidOut,
        },

        counts: {
          paymentsReceived:
            paymentCount,

          payoutsCompleted:
            completedCount,

          outstandingPayouts:
            outstandingCount,

          totalRecords:
            rows.length,
        },

        accounting: {
          expectedGross,

          difference:
            accountingDifference,

          balanced:
            accountingBalanced,
        },

        // This was missing from your current response.
        monthly,
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Unexpected reconciliation API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Unable to generate reconciliation data.",
      },
      {
        status: 500,
      }
    );
  }
}