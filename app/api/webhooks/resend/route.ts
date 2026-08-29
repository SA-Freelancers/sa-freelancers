import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  Resend,
} from "resend";

export const runtime = "nodejs";

const resend =
  new Resend(
    process.env.RESEND_API_KEY
  );

export async function POST(
  request: NextRequest
) {
  try {
    // ==================================================
    // ENVIRONMENT
    // ==================================================

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    const webhookSecret =
      process.env
        .RESEND_WEBHOOK_SECRET;

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !webhookSecret
    ) {
      console.error(
        "Webhook configuration is incomplete."
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

    // ==================================================
    // RAW BODY
    // IMPORTANT: DO NOT USE request.json() HERE
    // ==================================================

    const payload =
      await request.text();

    const svixId =
      request.headers.get(
        "svix-id"
      );

    const svixTimestamp =
      request.headers.get(
        "svix-timestamp"
      );

    const svixSignature =
      request.headers.get(
        "svix-signature"
      );

    if (
      !svixId ||
      !svixTimestamp ||
      !svixSignature
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing webhook signature headers.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // VERIFY RESEND WEBHOOK
    // ==================================================

    let event: any;

    try {
      event =
        resend.webhooks.verify({
          payload,

          headers: {
            id: svixId,
            timestamp:
              svixTimestamp,
            signature:
              svixSignature,
          },

          webhookSecret,
        });
    } catch (error) {
      console.error(
        "Invalid Resend webhook:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid webhook signature.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // EVENT DETAILS
    // ==================================================

    const eventType =
      String(
        event?.type || ""
      );

    const providerEventId =
      String(
        event?.id ||
        svixId ||
        ""
      );

    const providerMessageId =
      String(
        event?.data?.email_id ||
        ""
      );

    if (!providerMessageId) {
      return NextResponse.json(
        {
          success: true,
          ignored: true,
          reason:
            "Webhook does not contain an email ID.",
        },
        {
          status: 200,
        }
      );
    }

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
    // PREPARE UPDATE
    // ==================================================

    const now =
      new Date().toISOString();

    const updateData: {
      status?: string;
      delivered_at?: string | null;
      bounced_at?: string | null;
      failed_at?: string | null;
      provider_event?: string;
      provider_event_id?: string | null;
      error_message?: string | null;
    } = {
      provider_event:
        eventType,

      provider_event_id:
        providerEventId || null,
    };

    // ==================================================
    // DELIVERY EVENT
    // ==================================================

    if (
      eventType ===
      "email.delivered"
    ) {
      updateData.status =
        "delivered";

      updateData.delivered_at =
        now;

      updateData.error_message =
        null;
    }

    // ==================================================
    // BOUNCE EVENT
    // ==================================================

    else if (
      eventType ===
      "email.bounced"
    ) {
      updateData.status =
        "bounced";

      updateData.bounced_at =
        now;

      updateData.error_message =
        event?.data?.bounce?.message ||
        "Email bounced.";
    }

    // ==================================================
    // FAILED EVENT
    // ==================================================

    else if (
      eventType ===
      "email.failed"
    ) {
      updateData.status =
        "failed";

      updateData.failed_at =
        now;

      updateData.error_message =
        event?.data?.failed?.reason ||
        event?.data?.error?.message ||
        "Email delivery failed.";
    }

    // ==================================================
    // IGNORE EVENTS WE DO NOT CURRENTLY TRACK
    // ==================================================

    else {
      return NextResponse.json(
        {
          success: true,
          ignored: true,
          eventType,
        },
        {
          status: 200,
        }
      );
    }

    // ==================================================
    // UPDATE EMAIL LOG
    // ==================================================

    const {
      data: updatedEmail,
      error: updateError,
    } =
      await admin
        .from(
          "admin_email_logs"
        )
        .update(
          updateData
        )
        .eq(
          "provider_message_id",
          providerMessageId
        )
        .select(
          `
          id,
          provider_message_id,
          status
          `
        )
        .maybeSingle();

    if (updateError) {
      console.error(
        "Unable to update admin email log:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to update email delivery status.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // EMAIL MAY NOT BELONG TO ADMIN EMAIL SYSTEM
    // ==================================================

    if (!updatedEmail) {
      return NextResponse.json(
        {
          success: true,
          ignored: true,
          reason:
            "Email log not found.",
          providerMessageId,
        },
        {
          status: 200,
        }
      );
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        eventType,

        providerMessageId,

        status:
          updatedEmail.status,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected Resend webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}