import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type SenderType =
  | "support"
  | "billing"
  | "security";

const senderMap: Record<
  SenderType,
  {
    email: string;
    name: string;
  }
> = {
  support: {
    email:
      "support@freelancehubsa.co.za",

    name:
      "Freelance Hub SA Support",
  },

  billing: {
    email:
      "billing@freelancehubsa.co.za",

    name:
      "Freelance Hub SA Billing",
  },

  security: {
    email:
      "security@freelancehubsa.co.za",

    name:
      "Freelance Hub SA Security",
  },
};

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

    const resendApiKey =
      process.env
        .RESEND_API_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !resendApiKey
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

    // ==================================================
    // VERIFY USER
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
        {
          status: 401,
        }
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

    // ==================================================
    // BODY
    // ==================================================

    let body: {
      recipientUserId?: string;
      recipientEmail?: string;
      recipientName?: string;
      senderType?: SenderType;
      subject?: string;
      message?: string;
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

    const recipientUserId =
      String(
        body.recipientUserId ||
          ""
      ).trim();

    const recipientEmail =
      String(
        body.recipientEmail ||
          ""
      )
        .trim()
        .toLowerCase();

    const recipientName =
      String(
        body.recipientName ||
          ""
      ).trim();

    const senderType =
      body.senderType;

    const subject =
      String(
        body.subject ||
          ""
      ).trim();

    const message =
      String(
        body.message ||
          ""
      ).trim();

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !recipientEmail
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Recipient email is required.",
        },
        {
          status: 400,
        }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        recipientEmail
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Recipient email is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !senderType ||
      !senderMap[
        senderType
      ]
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid sender address.",
        },
        {
          status: 400,
        }
      );
    }

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Subject is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Message is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      subject.length >
      200
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Subject is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      message.length >
      20000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Message is too long.",
        },
        {
          status: 400,
        }
      );
    }

    const sender =
      senderMap[
        senderType
      ];

    // ==================================================
    // EMAIL HTML
    // ==================================================

    const escapedMessage =
      message
        .replaceAll(
          "&",
          "&amp;"
        )
        .replaceAll(
          "<",
          "&lt;"
        )
        .replaceAll(
          ">",
          "&gt;"
        )
        .replaceAll(
          '"',
          "&quot;"
        )
        .replaceAll(
          "'",
          "&#039;"
        )
        .replaceAll(
          "\n",
          "<br />"
        );

    const escapedName =
      recipientName
        .replaceAll(
          "&",
          "&amp;"
        )
        .replaceAll(
          "<",
          "&lt;"
        )
        .replaceAll(
          ">",
          "&gt;"
        );

    const greeting =
      escapedName
        ? `Hi ${escapedName},`
        : "Hello,";

    const html = `
      <div
        style="
          font-family: Arial, Helvetica, sans-serif;
          max-width: 680px;
          margin: 0 auto;
          padding: 24px;
          color: #111827;
          line-height: 1.6;
        "
      >
        <h2
          style="
            color: #16a34a;
            margin-bottom: 20px;
          "
        >
          Freelance Hub SA
        </h2>

        <p>
          ${greeting}
        </p>

        <div>
          ${escapedMessage}
        </div>

        <p
          style="
            margin-top: 30px;
          "
        >
          Regards,<br />
          ${sender.name}<br />
          Freelance Hub SA
        </p>

        <hr
          style="
            margin: 30px 0 16px;
            border: 0;
            border-top: 1px solid #e5e7eb;
          "
        />

        <p
          style="
            font-size: 12px;
            color: #6b7280;
          "
        >
          This email was sent by Freelance Hub SA.
          For your security, never send payments outside
          the Freelance Hub SA platform.
        </p>
      </div>
    `;

    // ==================================================
    // SEND VIA RESEND
    // ==================================================

    const resendResponse =
      await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${resendApiKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              from:
                `${sender.name} <${sender.email}>`,

              to: [
                recipientEmail,
              ],

              subject,

              html,

              reply_to:
                sender.email,
            }),
        }
      );

    const resendResult =
      await resendResponse.json();

    // ==================================================
    // FAILED DELIVERY
    // ==================================================

    if (
      !resendResponse.ok
    ) {
      console.error(
        "Resend admin email error:",
        resendResult
      );

      await admin
        .from(
          "admin_email_logs"
        )
        .insert({
          recipient_user_id:
            recipientUserId ||
            null,

          recipient_email:
            recipientEmail,

          recipient_name:
            recipientName ||
            null,

          sender_email:
            sender.email,

          subject,

          message,

          sent_by:
            userData.user.id,

          provider_message_id:
            null,

          status:
            "failed",

          error_message:
            resendResult?.message ||
            "Email provider rejected the request.",
        });

      return NextResponse.json(
        {
          success: false,
          error:
            resendResult?.message ||
            "Unable to send email.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // SUCCESS LOG
    // ==================================================

    const providerMessageId =
      resendResult?.id ||
      null;

    const {
      error: logError,
    } = await admin
      .from(
        "admin_email_logs"
      )
      .insert({
        recipient_user_id:
          recipientUserId ||
          null,

        recipient_email:
          recipientEmail,

        recipient_name:
          recipientName ||
          null,

        sender_email:
          sender.email,

        subject,

        message,

        sent_by:
          userData.user.id,

        provider_message_id:
          providerMessageId,

        status:
          "sent",

        error_message:
          null,
      });

    if (
      logError
    ) {
      console.error(
        "Admin email logging error:",
        logError
      );
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Email sent successfully.",

        emailId:
          providerMessageId,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected admin send email error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to send email.",
      },
      {
        status: 500,
      }
    );
  }
}