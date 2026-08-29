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
        { status: 500 }
      );
    }

    // ==================================================
    // AUTHENTICATION
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
    // ADMIN CHECK
    // ==================================================

    const {
      data: adminProfile,
      error: adminError,
    } = await admin
      .from("profiles")
      .select(
        "id, full_name, is_admin"
      )
      .eq(
        "id",
        userData.user.id
      )
      .maybeSingle();

    if (adminError) {
      console.error(
        "Admin profile error:",
        adminError
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

    if (
      !adminProfile?.is_admin
    ) {
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
    } = await context.params;

    if (!applicationId) {
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
    // APPLICATION
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
        applicationId
      )
      .maybeSingle();

    if (applicationError) {
      console.error(
        "Application loading error:",
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
    // JOB
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
        "Job loading error:",
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

    // ==================================================
    // PARTICIPANT PROFILES
    // ==================================================

    const participantIds = [
      application.freelancer_id,
      job?.client_id,
    ].filter(
      (id): id is string =>
        Boolean(id)
    );

    const {
      data: profiles,
      error: profileError,
    } = participantIds.length
      ? await admin
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
          )
      : {
          data: [],
          error: null,
        };

    if (profileError) {
      console.error(
        "Participant profile error:",
        profileError
      );
    }

    const profileMap =
      new Map(
        (profiles || []).map(
          (profile) => [
            profile.id,
            profile,
          ]
        )
      );

    const freelancer =
      profileMap.get(
        application.freelancer_id
      );

    const client =
      job?.client_id
        ? profileMap.get(
            job.client_id
          )
        : null;

    // ==================================================
    // SUCCESSFUL MESSAGES
    // ==================================================

    const {
      data: messages,
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
        applicationId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (messageError) {
      console.error(
        "Conversation messages error:",
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
    // SAFETY EVENTS
    // ==================================================

    const {
      data: safetyEvents,
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
        applicationId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (safetyError) {
      console.error(
        "Safety event loading error:",
        safetyError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load safety events.",
        },
        { status: 500 }
      );
    }

    // ==================================================
    // ADD SENDER INFORMATION
    // ==================================================

    const messagesWithSender =
      (messages || []).map(
        (message) => {
          const sender =
            profileMap.get(
              message.sender_id
            );

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

    const safetyWithSender =
      (
        safetyEvents || []
      ).map(
        (event) => {
          const sender =
            profileMap.get(
              event.sender_id
            );

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
    // TIMELINE
    //
    // Combines real messages and blocked attempts
    // chronologically for admin review.
    // ==================================================

    const timeline = [
      ...messagesWithSender.map(
        (message) => ({
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
      ),

      ...safetyWithSender.map(
        (event) => ({
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
      ),
    ].sort(
      (a, b) =>
        new Date(
          a.created_at
        ).getTime() -
        new Date(
          b.created_at
        ).getTime()
    );

    // ==================================================
    // SUMMARY
    // ==================================================

    const pendingSafetyEvents =
      safetyWithSender.filter(
        (event) =>
          event.status ===
          "pending"
      ).length;

    const highRiskEvents =
      safetyWithSender.filter(
        (event) =>
          event.risk_level ===
            "high" ||
          event.risk_level ===
            "critical"
      ).length;

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        conversation: {
          application_id:
            application.id,

          application_status:
            application.status,

          jjob: {
  id:
    job?.id ||
    application.job_id,

  title:
    job?.title ||
    "Job",

  status: null,
},

          client: {
            id:
              job?.client_id ||
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
          },

          timeline,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Admin conversation detail error:",
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