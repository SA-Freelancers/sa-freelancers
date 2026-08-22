import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  sendPayoutEmail,
} from "@/app/lib/sendPayoutEmail";

export const runtime = "nodejs";

type NextPayoutStatus =
  | "processing"
  | "paid_out";

export async function POST(
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
      console.error(
        "Missing Supabase server environment variables."
      );

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
        "Admin payout authentication error:",
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

    const adminUser =
      userData.user;

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
        adminUser.id
      )
      .maybeSingle();

    if (profileError) {
      console.error(
        "Admin verification error:",
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
    // READ REQUEST BODY
    // --------------------------------------------------

    let body: {
      payoutId?: string;
      status?: NextPayoutStatus;
      payoutReference?: string;
      payoutNotes?: string;
    };

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const payoutId =
      String(
        body.payoutId || ""
      ).trim();

    const nextStatus =
      body.status;

    const payoutReference =
      String(
        body.payoutReference || ""
      ).trim();

    const payoutNotes =
      String(
        body.payoutNotes || ""
      ).trim();

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

    if (
      nextStatus !==
        "processing" &&
      nextStatus !==
        "paid_out"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid payout status.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // PAYMENT REFERENCE REQUIRED FOR PAID OUT
    // --------------------------------------------------

    if (
      nextStatus ===
        "paid_out" &&
      !payoutReference
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A payment reference is required before marking this payout as paid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      payoutReference.length >
      120
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment reference is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      payoutNotes.length >
      1000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payout notes are too long.",
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
        status,
        payout_requested_at,
        processing_started_at,
        processing_started_by,
        processed_by,
        payout_reference,
        payout_notes,
        paid_out_at,
        paid_out_by
        `
      )
      .eq(
        "id",
        payoutId
      )
      .maybeSingle();

    if (payoutError) {
      console.error(
        "Admin payout lookup error:",
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

    // --------------------------------------------------
    // LOAD FREELANCER PAYOUT METHOD
    // --------------------------------------------------

    const {
      data: payoutMethod,
      error: payoutMethodError,
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
        verified_at
        `
      )
      .eq(
        "freelancer_id",
        payout.freelancer_id
      )
      .maybeSingle();

    if (payoutMethodError) {
      console.error(
        "Payout method lookup error:",
        payoutMethodError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify freelancer banking details.",
        },
        {
          status: 500,
        }
      );
    }

    if (!payoutMethod) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The freelancer has not configured banking details.",
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------
    // BANKING DETAILS MUST BE COMPLETE
    // --------------------------------------------------

    if (
      !payoutMethod.account_holder_name ||
      !payoutMethod.bank_name ||
      !payoutMethod.account_number ||
      !payoutMethod.account_type ||
      !payoutMethod.branch_code
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The freelancer banking details are incomplete.",
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------
    // BANKING DETAILS MUST BE VERIFIED
    // --------------------------------------------------

    if (
      payoutMethod.status !==
      "verified"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The freelancer banking details must be verified before processing this payout.",
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------
    // VALID STATUS TRANSITIONS
    // --------------------------------------------------

    if (
      nextStatus ===
        "processing" &&
      payout.status !==
        "payout_requested"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only requested payouts can be moved to processing.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      nextStatus ===
        "paid_out" &&
      payout.status !==
        "processing"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only processing payouts can be marked as paid out.",
        },
        {
          status: 409,
        }
      );
    }

    const now =
      new Date().toISOString();

    // --------------------------------------------------
    // BUILD UPDATE DATA
    // --------------------------------------------------

    const updateData: {
      status: NextPayoutStatus;
      updated_at: string;

      processing_started_at?:
        string;

      processing_started_by?:
        string;

      processed_by?:
        string;

      paid_out_at?:
        string;

      paid_out_by?:
        string;

      payout_reference?:
        string;

      payout_notes?:
        string | null;
    } = {
      status:
        nextStatus,

      updated_at:
        now,
    };

    // --------------------------------------------------
    // START PROCESSING
    // --------------------------------------------------

    if (
      nextStatus ===
      "processing"
    ) {
      updateData.processing_started_at =
        now;

      updateData.processing_started_by =
        adminUser.id;

      // Legacy field retained for compatibility
      updateData.processed_by =
        adminUser.id;
    }

    // --------------------------------------------------
    // MARK PAID OUT
    // --------------------------------------------------

    if (
      nextStatus ===
      "paid_out"
    ) {
      updateData.paid_out_at =
        now;

      updateData.paid_out_by =
        adminUser.id;

      // Legacy field retained for compatibility
      updateData.processed_by =
        adminUser.id;

      updateData.payout_reference =
        payoutReference;

      updateData.payout_notes =
        payoutNotes || null;
    }

    // --------------------------------------------------
    // UPDATE PAYOUT
    //
    // We match the current status as well as the ID.
    // This helps prevent duplicate/concurrent transitions.
    // --------------------------------------------------

    const {
      data: updatedPayout,
      error: updateError,
    } = await admin
      .from(
        "freelancer_payouts"
      )
      .update(
        updateData
      )
      .eq(
        "id",
        payout.id
      )
      .eq(
        "status",
        payout.status
      )
      .select(
        `
        id,
        milestone_id,
        freelancer_id,
        freelancer_amount,
        status,
        payout_requested_at,
        processing_started_at,
        processing_started_by,
        processed_by,
        payout_reference,
        payout_notes,
        paid_out_at,
        paid_out_by,
        updated_at
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
          error:
            "Unable to update payout.",
        },
        {
          status: 500,
        }
      );
    }

    if (!updatedPayout) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The payout status changed before this request completed. Refresh and try again.",
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------
    // CONTRACT ACTIVITY
    // --------------------------------------------------

    if (
      payout.contract_id
    ) {
      const activity =
        nextStatus ===
        "processing"
          ? `Freelancer payout of ZAR ${Number(
              payout.freelancer_amount ||
                0
            ).toFixed(
              2
            )} moved to processing`
          : `Freelancer payout of ZAR ${Number(
              payout.freelancer_amount ||
                0
            ).toFixed(
              2
            )} marked as paid out with reference ${payoutReference}`;

      const {
        error: activityError,
      } = await admin
        .from(
          "contract_activity"
        )
        .insert({
          contract_id:
            payout.contract_id,

          action:
            activity,
        });

      if (
        activityError
      ) {
        console.error(
          "Payout activity logging error:",
          activityError
        );
      }
    }

    // --------------------------------------------------
    // NOTIFY FREELANCER
    // --------------------------------------------------

    const notificationTitle =
      nextStatus ===
      "processing"
        ? "Payout Processing"
        : "Payout Sent";

    const notificationBody =
      nextStatus ===
      "processing"
        ? `Your payout of ZAR ${Number(
            payout.freelancer_amount ||
              0
          ).toFixed(
            2
          )} is being processed.`
        : `Your payout of ZAR ${Number(
            payout.freelancer_amount ||
              0
          ).toFixed(
            2
          )} has been sent. Payment reference: ${payoutReference}.`;

    const {
      error:
        notificationError,
    } = await admin
      .from(
        "notifications"
      )
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

    if (
      notificationError
    ) {
      console.error(
        "Payout notification error:",
        notificationError
      );
    }

    // --------------------------------------------------
    // EMAIL FREELANCER AFTER SUCCESSFUL PAYOUT
    //
    // IMPORTANT:
    // Email failure must NEVER undo a successful payout.
    // --------------------------------------------------

    if (
      nextStatus ===
      "paid_out"
    ) {
      try {
        // ----------------------------------------------
        // GET FREELANCER EMAIL
        // ----------------------------------------------

        const {
          data:
            freelancerUserData,
          error:
            freelancerUserError,
        } =
          await admin.auth.admin.getUserById(
            payout.freelancer_id
          );

        if (
          freelancerUserError
        ) {
          console.error(
            "Unable to load freelancer email:",
            freelancerUserError
          );
        } else {
          const freelancerEmail =
            freelancerUserData
              .user
              ?.email;

          if (
            freelancerEmail
          ) {
            // ------------------------------------------
            // FREELANCER NAME
            // ------------------------------------------

            const {
              data:
                freelancerProfile,
              error:
                freelancerProfileError,
            } = await admin
              .from(
                "profiles"
              )
              .select(
                "full_name"
              )
              .eq(
                "id",
                payout.freelancer_id
              )
              .maybeSingle();

            if (
              freelancerProfileError
            ) {
              console.error(
                "Unable to load freelancer profile for payout email:",
                freelancerProfileError
              );
            }

            // ------------------------------------------
            // MILESTONE TITLE
            // ------------------------------------------

            let milestoneTitle =
              "Project Milestone";

            if (
              payout.milestone_id
            ) {
              const {
                data:
                  milestone,
                error:
                  milestoneError,
              } = await admin
                .from(
                  "milestones"
                )
                .select(
                  "title"
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
                  "Unable to load milestone for payout email:",
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

            // ------------------------------------------
            // SEND EMAIL
            // ------------------------------------------

            const emailResult =
              await sendPayoutEmail({
                to:
                  freelancerEmail,

                freelancerName:
                  freelancerProfile
                    ?.full_name ||
                  "Freelancer",

                amount:
                  Number(
                    payout.freelancer_amount ||
                      0
                  ),

                paymentReference:
                  payoutReference,

                milestoneTitle,

                paidOutAt:
                  updatedPayout
                    .paid_out_at ||
                  now,

                payoutId:
                  payout.id,
              });

            if (
              !emailResult.success
            ) {
              console.error(
                "Payout succeeded but email notification failed:",
                emailResult.error
              );
            }
          } else {
            console.error(
              "Payout email skipped because freelancer email was not found."
            );
          }
        }
      } catch (
        emailError
      ) {
        console.error(
          "Payout completed but email processing failed:",
          emailError
        );
      }
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.json(
      {
        success:
          true,

        payout:
          updatedPayout,
      },
      {
        status: 200,
      }
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
      {
        status: 500,
      }
    );
  }
}