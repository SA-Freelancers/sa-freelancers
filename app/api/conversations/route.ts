import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
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
    // AUTHORIZATION
    // ==================================================

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
        { status: 401 }
      );
    }

    const accessToken =
      authorization.substring(7);

    // ==================================================
    // SUPABASE ADMIN CLIENT
    // ==================================================

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

    // ==================================================
    // VERIFY LOGGED-IN USER
    // ==================================================

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
        "Conversation detail admin verification error:",
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
    // APPLICATION ID
    // ==================================================

    const {
      applicationId,
    } =
      await context.params;

    const cleanApplicationId =
      String(
        applicationId || ""
      ).trim();

    if (!cleanApplicationId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Application ID is required.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // LOAD APPLICATION
    // ==================================================

    const {
      data: application,
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
      .eq(
        "id",
        cleanApplicationId
      )
      .maybeSingle();

    if (applicationError) {
      console.error(
        "Conversation detail application loading error:",
        applicationError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load application.",
        },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Conversation not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // LOAD JOB
    //
    // Your jobs table has:
    // id, client_id, title, ...
    //
    // It does NOT have a status column.
    // ==================================================

    const {
      data: job,
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
      .eq(
        "id",
        application.job_id
      )
      .maybeSingle();

    if (jobError) {
      console.error(
        "Conversation detail job loading error:",
        jobError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load job information.",
        },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The job connected to this conversation could not be found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // COLLECT PARTICIPANTS
    // ==================================================

    const participantIds = [
      application.freelancer_id,
      job.client_id,
    ].filter(
      (
        id
      ): id is string =>
        Boolean(id)
    );

    // ==================================================
    // LOAD PARTICIPANT PROFILES
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

    if (
      participantIds.length >
      0
    ) {
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
          participantIds
        );

      if (profileError) {
        console.error(
          "Conversation detail participant loading error:",
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

    const freelancer =
      profileMap[
        application.freelancer_id
      ];

    const client =
      job.client_id
        ? profileMap[
            job.client_id
          ]
        : null;

    // ==================================================
    // LOAD SUCCESSFUL MESSAGES
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
      .eq(
        "application_id",
        cleanApplicationId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (messageError) {
      console.error(
        "Conversation detail message loading error:",
        messageError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load conversation messages.",
        },
        { status: 500 }
      );
    }

    // ==================================================
    // LOAD SAFETY EVENTS
    // ==================================================

    const {
      data: safetyRows,
      error: safetyError,
    } = await admin
      .from(
        "message_safety_events"
      )
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
      .eq(
        "application_id",
        cleanApplicationId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (safetyError) {
      console.error(
        "Conversation detail safety loading error:",
        safetyError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load conversation safety events.",
        },
        { status: 500 }
      );
    }

    const messages =
      messageRows || [];

    const safetyEvents =
      safetyRows || [];

    // ==================================================
    // MESSAGE SENDER INFORMATION
    // ==================================================

    const messagesWithSender =
      messages.map(
        (
          message
        ) => {
          const sender =
            profileMap[
              message.sender_id
            ];

          return {
            ...message,

            sender_name:
              sender?.full_name ||
              "User",

            sender_role:
              sender?.role ||
              null,
          };
        }
      );

    // ==================================================
    // SAFETY EVENT SENDER INFORMATION
    // ==================================================

    const safetyWithSender =
      safetyEvents.map(
        (
          event
        ) => {
          const sender =
            profileMap[
              event.sender_id
            ];

          return {
            ...event,

            sender_name:
              sender?.full_name ||
              "User",

            sender_role:
              sender?.role ||
              null,
          };
        }
      );

    // ==================================================
    // BUILD COMPLETE TIMELINE
    // ==================================================

    const messageTimeline =
      messagesWithSender.map(
        (
          message
        ) => ({
          type:
            "message" as const,

          id:
            message.id,

          sender_id:
            message.sender_id,

          sender_name:
            message.sender_name,

          sender_role:
            message.sender_role,

          content:
            message.content,

          created_at:
            message.created_at,
        })
      );

    const safetyTimeline =
      safetyWithSender.map(
        (
          event
        ) => ({
          type:
            "safety_event" as const,

          id:
            event.id,

          sender_id:
            event.sender_id,

          sender_name:
            event.sender_name,

          sender_role:
            event.sender_role,

          content:
            event.attempted_content,

          event_type:
            event.event_type,

          risk_level:
            event.risk_level,

          matched_value:
            event.matched_value,

          status:
            event.status,

          reviewed_by:
            event.reviewed_by,

          reviewed_at:
            event.reviewed_at,

          created_at:
            event.created_at,
        })
      );

    const timeline = [
      ...messageTimeline,
      ...safetyTimeline,
    ].sort(
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

    // ==================================================
    // SAFETY SUMMARY
    // ==================================================

    const pendingSafetyEvents =
      safetyWithSender.filter(
        (
          event
        ) =>
          event.status ===
          "pending"
      ).length;

    const highRiskEvents =
      safetyWithSender.filter(
        (
          event
        ) =>
          event.risk_level ===
            "high" ||
          event.risk_level ===
            "critical"
      ).length;

    const criticalEvents =
      safetyWithSender.filter(
        (
          event
        ) =>
          event.risk_level ===
          "critical"
      ).length;

    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        conversation: {
          application_id:
            application.id,

          application_status:
            application.status ||
            null,

          job: {
            id:
              job.id,

            title:
              job.title ||
              "Job",

            // No jobs.status field exists.
            status:
              null,
          },

          client: {
            id:
              job.client_id ||
              null,

            name:
              client?.full_name ||
              "Client",
          },

          freelancer: {
            id:
              application.freelancer_id,

            name:
              freelancer?.full_name ||
              "Freelancer",
          },

          summary: {
            messages:
              messagesWithSender.length,

            safetyEvents:
              safetyWithSender.length,

            pendingSafetyEvents,

            highRiskEvents,

            criticalEvents,
          },

          timeline,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Unexpected admin conversation detail error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load conversation.",
      },
      { status: 500 }
    );
  }
}