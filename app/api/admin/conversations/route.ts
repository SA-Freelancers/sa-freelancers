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
    // ==================================================
    // ENVIRONMENT
    // ==================================================

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Server configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    // ==================================================
    // AUTHORIZATION HEADER
    // ==================================================

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

    // ==================================================
    // SERVICE ROLE CLIENT
    // ==================================================

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

    // ==================================================
    // VERIFY LOGGED-IN USER
    // ==================================================

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

    // ==================================================
    // VERIFY ADMIN
    // ==================================================

    const {
      data: adminProfile,
      error: adminProfileError,
    } = await admin
      .from("profiles")
      .select(
        `
        id,
        full_name,
        is_admin
        `
      )
      .eq(
        "id",
        userData.user.id
      )
      .maybeSingle();

    if (adminProfileError) {
      console.error(
        "Conversation admin verification error:",
        adminProfileError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify administrator access.",
        },
        { status: 500 }
      );
    }

    if (!adminProfile?.is_admin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administrator access required.",
        },
        { status: 403 }
      );
    }

    // ==================================================
    // LOAD SUCCESSFULLY SENT MESSAGES
    // ==================================================

    const {
      data: messageRows,
      error: messageError,
    } = await admin
      .from("messages")
      .select(
        `
        id,
        application_id,
        sender_id,
        content,
        created_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (messageError) {
      console.error(
        "Admin conversation message loading error:",
        messageError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load conversations.",
        },
        { status: 500 }
      );
    }

    // ==================================================
    // LOAD BLOCKED / FLAGGED SAFETY EVENTS
    // ==================================================

    const {
      data: safetyRows,
      error: safetyError,
    } = await admin
      .from("message_safety_events")
      .select(
        `
        id,
        application_id,
        sender_id,
        event_type,
        risk_level,
        matched_value,
        attempted_content,
        status,
        reviewed_by,
        reviewed_at,
        created_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (safetyError) {
      console.error(
        "Admin conversation safety loading error:",
        safetyError
      );
    }

    const messages =
      messageRows || [];

    const safetyEvents =
      safetyRows || [];

    // ==================================================
    // COLLECT APPLICATION IDS
    // ==================================================

    const applicationIds = [
      ...new Set(
        [
          ...messages.map(
            (message) =>
              message.application_id
          ),

          ...safetyEvents.map(
            (event) =>
              event.application_id
          ),
        ].filter(
          (
            id
          ): id is string =>
            Boolean(id)
        )
      ),
    ];

    // ==================================================
    // NO CONVERSATIONS
    // ==================================================

    if (
      applicationIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: true,

          conversations: [],

          summary: {
            conversations: 0,
            flaggedConversations: 0,
            pendingFlags: 0,
            totalMessages: 0,
            totalSafetyEvents: 0,
          },
        },
        { status: 200 }
      );
    }

    // ==================================================
    // LOAD APPLICATIONS
    // ==================================================

    const {
      data: applicationRows,
      error: applicationError,
    } = await admin
      .from("applications")
      .select(
        `
        id,
        job_id,
        freelancer_id,
        status,
        created_at
        `
      )
      .in(
        "id",
        applicationIds
      );

    if (applicationError) {
      console.error(
        "Admin conversation application loading error:",
        applicationError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load conversation applications.",
        },
        { status: 500 }
      );
    }

    const applications =
      applicationRows || [];

    // ==================================================
    // APPLICATION MAP
    // ==================================================

    const applicationMap:
      Record<
        string,
        {
          id: string;
          job_id: string;
          freelancer_id: string;
          status?: string | null;
          created_at?: string | null;
        }
      > = {};

    for (
      const application of applications
    ) {
      applicationMap[
        application.id
      ] = application;
    }

    // ==================================================
    // COLLECT JOB IDS
    // ==================================================

    const jobIds = [
      ...new Set(
        applications
          .map(
            (application) =>
              application.job_id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];

    // ==================================================
    // LOAD JOBS
    //
    // IMPORTANT:
    // Your jobs table does NOT have a "status" column.
    // ==================================================

    const jobMap:
      Record<
        string,
        {
          id: string;
          title?: string | null;
          client_id?: string | null;
        }
      > = {};

    if (jobIds.length > 0) {
      const {
        data: jobRows,
        error: jobError,
      } = await admin
        .from("jobs")
        .select(
          `
          id,
          title,
          client_id
          `
        )
        .in(
          "id",
          jobIds
        );

      if (jobError) {
        console.error(
          "Admin conversation job loading error:",
          jobError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to load conversation jobs.",
          },
          { status: 500 }
        );
      }

      for (
        const job of jobRows || []
      ) {
        jobMap[
          job.id
        ] = job;
      }
    }

    // ==================================================
    // COLLECT CLIENT + FREELANCER IDS
    // ==================================================

    const userIds = [
      ...new Set(
        applications
          .flatMap(
            (
              application
            ) => {
              const job =
                jobMap[
                  application.job_id
                ];

              return [
                application.freelancer_id,
                job?.client_id,
              ];
            }
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];

    // ==================================================
    // LOAD PROFILES
    // ==================================================

    const profileMap:
      Record<
        string,
        {
          id: string;
          full_name?: string | null;
          role?: string | null;
        }
      > = {};

    if (userIds.length > 0) {
      const {
        data: profileRows,
        error: profileError,
      } = await admin
        .from("profiles")
        .select(
          `
          id,
          full_name,
          role
          `
        )
        .in(
          "id",
          userIds
        );

      if (profileError) {
        console.error(
          "Admin conversation profile loading error:",
          profileError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to load conversation participants.",
          },
          { status: 500 }
        );
      }

      for (
        const profile of
          profileRows || []
      ) {
        profileMap[
          profile.id
        ] = profile;
      }
    }

    // ==================================================
    // BUILD CONVERSATIONS
    // ==================================================

    const conversations =
      applicationIds
        .map(
          (
            applicationId
          ) => {
            const application =
              applicationMap[
                applicationId
              ];

            if (!application) {
              return null;
            }

            const job =
              jobMap[
                application.job_id
              ];

            const freelancer =
              profileMap[
                application.freelancer_id
              ];

            const client =
              job?.client_id
                ? profileMap[
                    job.client_id
                  ]
                : null;

            // ------------------------------------------
            // MESSAGES FOR THIS APPLICATION
            // ------------------------------------------

            const conversationMessages =
              messages
                .filter(
                  (
                    message
                  ) =>
                    message.application_id ===
                    applicationId
                )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    new Date(
                      a.created_at
                    ).getTime() -
                    new Date(
                      b.created_at
                    ).getTime()
                );

            // ------------------------------------------
            // SAFETY EVENTS FOR THIS APPLICATION
            // ------------------------------------------

            const conversationSafety =
              safetyEvents
                .filter(
                  (
                    event
                  ) =>
                    event.application_id ===
                    applicationId
                )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    new Date(
                      b.created_at
                    ).getTime() -
                    new Date(
                      a.created_at
                    ).getTime()
                );

            // ------------------------------------------
            // SAFETY COUNTS
            // ------------------------------------------

            const pendingFlags =
              conversationSafety.filter(
                (
                  event
                ) =>
                  event.status ===
                  "pending"
              ).length;

            const highRiskFlags =
              conversationSafety.filter(
                (
                  event
                ) =>
                  event.risk_level ===
                    "high" ||
                  event.risk_level ===
                    "critical"
              ).length;

            // ------------------------------------------
            // LAST MESSAGE
            // ------------------------------------------

            const lastMessage =
              conversationMessages.length >
              0
                ? conversationMessages[
                    conversationMessages.length -
                      1
                  ]
                : null;

            // ------------------------------------------
            // LAST SAFETY EVENT
            // ------------------------------------------

            const lastSafetyEvent =
              conversationSafety.length >
              0
                ? conversationSafety[0]
                : null;

            // ------------------------------------------
            // LAST ACTIVITY
            // ------------------------------------------

            const activityDates = [
              lastMessage?.created_at,
              lastSafetyEvent?.created_at,
              application.created_at,
            ].filter(
              (
                value
              ): value is string =>
                Boolean(value)
            );

            const lastActivityAt =
              activityDates.length > 0
                ? activityDates.sort(
                    (
                      a,
                      b
                    ) =>
                      new Date(
                        b
                      ).getTime() -
                      new Date(
                        a
                      ).getTime()
                  )[0]
                : null;

            // ------------------------------------------
            // CONVERSATION
            // ------------------------------------------

            return {
              application_id:
                applicationId,

              application_status:
                application.status ||
                null,

              job_id:
                application.job_id,

              job_title:
                job?.title ||
                "Job",

              // Jobs table currently has no status column.
              job_status: null,

              client_id:
                job?.client_id ||
                null,

              client_name:
                client?.full_name ||
                "Client",

              freelancer_id:
                application.freelancer_id,

              freelancer_name:
                freelancer?.full_name ||
                "Freelancer",

              message_count:
                conversationMessages.length,

              safety_event_count:
                conversationSafety.length,

              pending_flag_count:
                pendingFlags,

              high_risk_flag_count:
                highRiskFlags,

              flagged:
                conversationSafety.length >
                0,

              last_message:
                lastMessage?.content ||
                null,

              last_message_at:
                lastMessage?.created_at ||
                null,

              last_activity_at:
                lastActivityAt,
            };
          }
        )
        .filter(
          (
            conversation
          ): conversation is NonNullable<
            typeof conversation
          > =>
            Boolean(conversation)
        )
        .sort(
          (
            a,
            b
          ) =>
            new Date(
              b.last_activity_at ||
                0
            ).getTime() -
            new Date(
              a.last_activity_at ||
                0
            ).getTime()
        );

    // ==================================================
    // SUMMARY
    // ==================================================

    const flaggedConversations =
      conversations.filter(
        (
          conversation
        ) =>
          conversation.flagged
      ).length;

    const pendingFlags =
      conversations.reduce(
        (
          total,
          conversation
        ) =>
          total +
          conversation.pending_flag_count,
        0
      );

    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        conversations,

        summary: {
          conversations:
            conversations.length,

          flaggedConversations,

          pendingFlags,

          totalMessages:
            messages.length,

          totalSafetyEvents:
            safetyEvents.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Unexpected admin conversations error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load conversation monitoring.",
      },
      { status: 500 }
    );
  }
}