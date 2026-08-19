import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(
  request: NextRequest
) {
  try {
    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
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
      !authorization?.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
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

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to verify the current user.",
        },
        {
          status: 401,
        }
      );
    }

    const user =
      userData.user;

    const body =
      await request.json();

    const milestoneId =
      String(
        body.milestoneId || ""
      ).trim();

    const contractId =
      String(
        body.contractId || ""
      ).trim();

    if (
      !milestoneId ||
      !contractId
    ) {
      return NextResponse.json(
        {
          error:
            "Milestone ID and contract ID are required.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // LOAD CONTRACT
    // --------------------------------------------------

    const {
      data: contract,
      error: contractError,
    } = await supabase
      .from("contracts")
      .select(
        `
        id,
        client_id,
        freelancer_id,
        status
        `
      )
      .eq("id", contractId)
      .maybeSingle();

    if (
      contractError ||
      !contract
    ) {
      return NextResponse.json(
        {
          error:
            "Contract could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    // Only the actual client can approve work.

    if (
      contract.client_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You are not authorised to approve this work.",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------------
    // LOAD MILESTONE
    // --------------------------------------------------

    const {
      data: milestone,
      error: milestoneError,
    } = await supabase
      .from("milestones")
      .select(
        `
        id,
        contract_id,
        project_id,
        title,
        status
        `
      )
      .eq("id", milestoneId)
      .eq(
        "contract_id",
        contractId
      )
      .maybeSingle();

    if (
      milestoneError ||
      !milestone
    ) {
      return NextResponse.json(
        {
          error:
            "Milestone could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      milestone.status !==
      "submitted"
    ) {
      return NextResponse.json(
        {
          error:
            "Only submitted work can be approved.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // LOAD PAYOUT
    // --------------------------------------------------

    const {
      data: payout,
      error: payoutError,
    } = await supabase
      .from("freelancer_payouts")
      .select(
        `
        id,
        milestone_id,
        client_id,
        freelancer_id,
        status
        `
      )
      .eq(
        "milestone_id",
        milestoneId
      )
      .maybeSingle();

    if (
      payoutError ||
      !payout
    ) {
      console.error(
        "Payout lookup error:",
        payoutError
      );

      return NextResponse.json(
        {
          error:
            "Payout record could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      payout.client_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You are not authorised to approve this payout.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      payout.status ===
      "paid_out"
    ) {
      return NextResponse.json(
        {
          error:
            "This payout has already been completed.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      payout.status !==
        "held" &&
      payout.status !==
        "ready_for_payout"
    ) {
      return NextResponse.json(
        {
          error:
            `This payout cannot be approved while its status is "${payout.status}".`,
        },
        {
          status: 400,
        }
      );
    }

    const approvedAt =
      new Date().toISOString();

    // --------------------------------------------------
    // PAYOUT -> READY FOR PAYOUT
    // --------------------------------------------------

    if (
      payout.status ===
      "held"
    ) {
      const {
        error:
          payoutUpdateError,
      } = await supabase
        .from(
          "freelancer_payouts"
        )
        .update({
          status:
            "ready_for_payout",

          approved_for_payout_at:
            approvedAt,

          updated_at:
            approvedAt,
        })
        .eq(
          "id",
          payout.id
        )
        .eq(
          "status",
          "held"
        );

      if (
        payoutUpdateError
      ) {
        console.error(
          "Payout approval error:",
          payoutUpdateError
        );

        return NextResponse.json(
          {
            error:
              "Unable to approve the freelancer payout.",
          },
          {
            status: 500,
          }
        );
      }
    }

    // --------------------------------------------------
    // MILESTONE -> COMPLETED
    // --------------------------------------------------

    const {
      error:
        milestoneUpdateError,
    } = await supabase
      .from("milestones")
      .update({
        status:
          "completed",
      })
      .eq(
        "id",
        milestoneId
      )
      .eq(
        "status",
        "submitted"
      );

    if (
      milestoneUpdateError
    ) {
      console.error(
        "Milestone completion error:",
        milestoneUpdateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to complete the milestone.",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // ACTIVITY
    // --------------------------------------------------

    await supabase
      .from(
        "contract_activity"
      )
      .insert({
        contract_id:
          contractId,

        action:
          `Client approved work for milestone "${milestone.title || "Untitled"}". Freelancer payout is ready.`,
      });

    // --------------------------------------------------
    // NOTIFY FREELANCER
    // --------------------------------------------------

    if (
      contract.freelancer_id
    ) {
      await supabase
        .from("notifications")
        .insert({
          user_id:
            contract.freelancer_id,

          title:
            "Work Approved",

          body:
            `The client approved milestone "${milestone.title || "Untitled Milestone"}". Your payment is now ready for payout.`,

          link:
            `/dashboard/contracts/${contractId}/milestones`,

          is_read:
            false,
        });
    }

    return NextResponse.json({
      success: true,

      milestoneStatus:
        "completed",

      payoutStatus:
        "ready_for_payout",

      approvedAt,
    });
  } catch (error) {
    console.error(
      "Unexpected payout approval error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to approve the work.",
      },
      {
        status: 500,
      }
    );
  }
}