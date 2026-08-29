import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type SafetyStatus =
  | "reviewed"
  | "dismissed"
  | "action_taken";

export async function POST(
  request: NextRequest
) {
  try {
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

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(
        "id, is_admin"
      )
      .eq(
        "id",
        userData.user.id
      )
      .maybeSingle();

    if (
      profileError ||
      !profile?.is_admin
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

    let body: {
      eventId?: string;
      status?: SafetyStatus;
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
        { status: 400 }
      );
    }

    const eventId =
      String(
        body.eventId || ""
      ).trim();

    const status =
      body.status;

    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Safety event ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      status !== "reviewed" &&
      status !== "dismissed" &&
      status !== "action_taken"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid safety event status.",
        },
        { status: 400 }
      );
    }

    const now =
      new Date().toISOString();

    const {
      data: updatedEvent,
      error: updateError,
    } = await admin
      .from(
        "message_safety_events"
      )
      .update({
        status,
        reviewed_by:
          userData.user.id,
        reviewed_at:
          now,
      })
      .eq(
        "id",
        eventId
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
      .maybeSingle();

    if (updateError) {
      console.error(
        "Safety event update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to update safety event.",
        },
        { status: 500 }
      );
    }

    if (!updatedEvent) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Safety event not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        event:
          updatedEvent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Unexpected safety event update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update safety event.",
      },
      { status: 500 }
    );
  }
}