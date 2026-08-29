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
    // ==========================================
    // ENVIRONMENT
    // ==========================================

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

    // ==========================================
    // AUTHORIZATION
    // ==========================================

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

    // ==========================================
    // VERIFY USER
    // ==========================================

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

    // ==========================================
    // VERIFY ADMIN
    // ==========================================

    const {
      data: adminProfile,
      error: adminProfileError,
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

    if (
      adminProfileError ||
      !adminProfile?.is_admin
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

    // ==========================================
    // QUERY PARAMS
    // ==========================================

    const searchParams =
      request.nextUrl.searchParams;

    const search =
      (
        searchParams.get(
          "search"
        ) || ""
      )
        .trim()
        .toLowerCase();

    const status =
      (
        searchParams.get(
          "status"
        ) || "all"
      )
        .trim()
        .toLowerCase();

    const limitParam =
      Number(
        searchParams.get(
          "limit"
        ) || "50"
      );

    const limit =
      Number.isFinite(
        limitParam
      )
        ? Math.min(
            Math.max(
              limitParam,
              1
            ),
            100
          )
        : 50;

    // ==========================================
    // LOAD EMAIL LOGS
    // ==========================================

    let logsQuery =
      admin
        .from(
          "admin_email_logs"
        )
        .select(
          `
          id,
          recipient_user_id,
          recipient_email,
          recipient_name,
          sender_email,
          subject,
          message,
          sent_by,
          provider_message_id,
          status,
          error_message,
          created_at,
          delivered_at,
          bounced_at,
          failed_at,
          provider_event,
          provider_event_id
          `
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(limit);

    if (
      status !== "all"
    ) {
      logsQuery =
        logsQuery.eq(
          "status",
          status
        );
    }

    const {
      data: logs,
      error: logsError,
    } =
      await logsQuery;

    if (logsError) {
      console.error(
        "Admin email history error:",
        logsError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load email history.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // SEARCH FILTER
    // ==========================================

    const filteredLogs =
      (logs || [])
        .filter((log) => {
          if (!search) {
            return true;
          }

          const searchable =
            [
              log.recipient_name,
              log.recipient_email,
              log.sender_email,
              log.subject,
              log.status,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            search
          );
        });

    // ==========================================
    // LOAD ADMIN NAMES
    // ==========================================

    const sentByIds =
      [
        ...new Set(
          filteredLogs
            .map(
              (log) =>
                log.sent_by
            )
            .filter(Boolean)
        ),
      ];

    const adminNameMap =
      new Map<
        string,
        string
      >();

    if (
      sentByIds.length > 0
    ) {
      const {
        data:
          adminProfiles,
        error:
          adminProfilesError,
      } =
        await admin
          .from(
            "profiles"
          )
          .select(
            `
            id,
            full_name
            `
          )
          .in(
            "id",
            sentByIds
          );

      if (
        adminProfilesError
      ) {
        console.error(
          "Email history admin profile error:",
          adminProfilesError
        );
      } else {
        for (
          const profile of
          adminProfiles || []
        ) {
          adminNameMap.set(
            profile.id,
            profile.full_name ||
              "Administrator"
          );
        }
      }
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    const history =
      filteredLogs.map(
        (log) => ({
          id:
            log.id,

          recipientUserId:
            log.recipient_user_id,

          recipientEmail:
            log.recipient_email,

          recipientName:
            log.recipient_name,

          senderEmail:
            log.sender_email,

          subject:
            log.subject,

          message:
            log.message,

          sentBy:
            log.sent_by,

          sentByName:
            log.sent_by
              ? adminNameMap.get(
                  log.sent_by
                ) ||
                "Administrator"
              : "Administrator",

          providerMessageId:
            log.provider_message_id,

          status:
            log.status,

          errorMessage:
            log.error_message,

          createdAt:
            log.created_at,

          deliveredAt:
            log.delivered_at,

          bouncedAt:
            log.bounced_at,

          failedAt:
            log.failed_at,

          providerEvent:
            log.provider_event,

          providerEventId:
            log.provider_event_id,
        })
      );

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error(
      "Unexpected admin email history error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load email history.",
      },
      {
        status: 500,
      }
    );
  }
}