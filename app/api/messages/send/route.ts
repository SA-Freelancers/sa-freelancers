import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type SafetyResult = {
  blocked: boolean;
  eventType:
    | "email"
    | "phone"
    | "whatsapp"
    | "telegram"
    | "social_media"
    | "external_payment"
    | "bank_details"
    | "suspicious_link"
    | "other"
    | null;

  riskLevel:
    | "low"
    | "medium"
    | "high"
    | "critical";

  matchedValue:
    string | null;

  reason:
    string | null;
};

// --------------------------------------------------
// MESSAGE SAFETY CHECK
// --------------------------------------------------

function checkMessageSafety(
  content: string
): SafetyResult {
  const text =
    content.trim();

  const lower =
    text.toLowerCase();

  // --------------------------------------------------
  // EMAIL ADDRESS
  // --------------------------------------------------

  const emailRegex =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

  const emailMatch =
    text.match(
      emailRegex
    );

  if (emailMatch) {
    return {
      blocked: true,
      eventType:
        "email",
      riskLevel:
        "high",
      matchedValue:
        emailMatch[0],
      reason:
        "Email addresses cannot be shared before work is secured on the platform.",
    };
  }

  // --------------------------------------------------
  // WHATSAPP
  // --------------------------------------------------

  const whatsappTerms = [
    "whatsapp",
    "what's app",
    "whats app",
    "wa me",
    "message me on wa",
    "chat on whatsapp",
  ];

  const whatsappMatch =
    whatsappTerms.find(
      (term) =>
        lower.includes(
          term
        )
    );

  if (whatsappMatch) {
    return {
      blocked: true,
      eventType:
        "whatsapp",
      riskLevel:
        "high",
      matchedValue:
        whatsappMatch,
      reason:
        "WhatsApp contact sharing is not allowed.",
    };
  }

  // --------------------------------------------------
  // PHONE NUMBERS
  //
  // Looks for SA/international-style phone numbers,
  // while trying not to block ordinary dimensions.
  // --------------------------------------------------

  const phoneRegex =
    /(?<![\d.])(?:\+?27[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|0\d{2}[\s.-]?\d{3}[\s.-]?\d{4})(?!\d)/;

  const phoneMatch =
    text.match(
      phoneRegex
    );

  if (phoneMatch) {
    return {
      blocked: true,
      eventType:
        "phone",
      riskLevel:
        "high",
      matchedValue:
        phoneMatch[0],
      reason:
        "Phone numbers cannot be shared in platform messages.",
    };
  }

  // --------------------------------------------------
  // TELEGRAM
  // --------------------------------------------------

  const telegramTerms = [
    "telegram",
    "t.me/",
  ];

  const telegramMatch =
    telegramTerms.find(
      (term) =>
        lower.includes(
          term
        )
    );

  if (telegramMatch) {
    return {
      blocked: true,
      eventType:
        "telegram",
      riskLevel:
        "high",
      matchedValue:
        telegramMatch,
      reason:
        "Telegram contact sharing is not allowed.",
    };
  }

  // --------------------------------------------------
  // SOCIAL MEDIA
  // --------------------------------------------------

  const socialTerms = [
    "instagram.com/",
    "facebook.com/",
    "fb.me/",
    "linkedin.com/in/",
    "snapchat",
    "discord.gg/",
  ];

  const socialMatch =
    socialTerms.find(
      (term) =>
        lower.includes(
          term
        )
    );

  if (socialMatch) {
    return {
      blocked: true,
      eventType:
        "social_media",
      riskLevel:
        "medium",
      matchedValue:
        socialMatch,
      reason:
        "External social-media contact details cannot be shared here.",
    };
  }

  // --------------------------------------------------
  // OFF-PLATFORM PAYMENT
  // --------------------------------------------------

  const paymentTerms = [
    "pay me directly",
    "pay direct",
    "pay outside the platform",
    "pay outside freelance hub",
    "avoid the platform fee",
    "avoid platform fees",
    "skip the platform fee",
    "send me the money directly",
    "eft me",
    "direct eft",
    "bank transfer me",
    "pay into my account",
    "pay into my bank",
  ];

  const paymentMatch =
    paymentTerms.find(
      (term) =>
        lower.includes(
          term
        )
    );

  if (paymentMatch) {
    return {
      blocked: true,
      eventType:
        "external_payment",
      riskLevel:
        "critical",
      matchedValue:
        paymentMatch,
      reason:
        "Off-platform payment arrangements are not allowed.",
    };
  }

  // --------------------------------------------------
  // BANK DETAILS
  // --------------------------------------------------

  const bankTerms = [
    "my account number",
    "bank account number",
    "my banking details",
    "banking details are",
    "branch code",
    "swift code",
    "iban",
  ];

  const bankMatch =
    bankTerms.find(
      (term) =>
        lower.includes(
          term
        )
    );

  if (bankMatch) {
    return {
      blocked: true,
      eventType:
        "bank_details",
      riskLevel:
        "high",
      matchedValue:
        bankMatch,
      reason:
        "Banking details must not be shared in chat.",
    };
  }

  // --------------------------------------------------
  // GENERIC CONTACT REQUESTS
  // --------------------------------------------------

  const contactTerms = [
    "call me",
    "phone me",
    "send me your number",
    "give me your number",
    "send your email",
    "email me",
    "contact me privately",
    "message me privately",
  ];

  const contactMatch =
    contactTerms.find(
      (term) =>
        lower.includes(
          term
        )
    );

  if (contactMatch) {
    return {
      blocked: true,
      eventType:
        "other",
      riskLevel:
        "medium",
      matchedValue:
        contactMatch,
      reason:
        "Requests to move communication outside the platform are not allowed.",
    };
  }

  return {
    blocked: false,
    eventType:
      null,
    riskLevel:
      "low",
    matchedValue:
      null,
    reason:
      null,
  };
}

export async function POST(
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

    const user =
      userData.user;

    // --------------------------------------------------
    // BODY
    // --------------------------------------------------

    let body: {
      applicationId?: string;
      content?: string;
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

    const applicationId =
      String(
        body.applicationId ||
          ""
      ).trim();

    const content =
      String(
        body.content ||
          ""
      ).trim();

    if (
      !applicationId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Application ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Message cannot be empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      content.length >
      5000
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

    // --------------------------------------------------
    // VERIFY USER BELONGS TO APPLICATION
    // --------------------------------------------------

    const {
      data: application,
      error:
        applicationError,
    } = await admin
      .from(
        "applications"
      )
      .select(
        `
        id,
        freelancer_id,
        job_id
        `
      )
      .eq(
        "id",
        applicationId
      )
      .maybeSingle();

    if (
      applicationError
    ) {
      console.error(
        "Message application lookup error:",
        applicationError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify conversation.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !application
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Application not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // LOAD JOB OWNER
    // --------------------------------------------------

    const {
      data: job,
      error: jobError,
    } = await admin
      .from("jobs")
      .select(
        `
        id,
        client_id
        `
      )
      .eq(
        "id",
        application.job_id
      )
      .maybeSingle();

    if (
      jobError
    ) {
      console.error(
        "Message job lookup error:",
        jobError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify conversation participants.",
        },
        {
          status: 500,
        }
      );
    }

    const freelancerId =
      application.freelancer_id;

    const clientId =
      job?.client_id;

    const belongs =
      user.id ===
        freelancerId ||
      user.id ===
        clientId;

    if (
      !belongs
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have access to this conversation.",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------------------------
    // SAFETY CHECK
    // --------------------------------------------------

    const safety =
      checkMessageSafety(
        content
      );

    if (
      safety.blocked
    ) {
      // ------------------------------------------------
      // LOG SAFETY EVENT
      // ------------------------------------------------

      const {
        error:
          safetyLogError,
      } = await admin
        .from(
          "message_safety_events"
        )
        .insert({
          application_id:
            applicationId,

          sender_id:
            user.id,

          event_type:
            safety.eventType,

          risk_level:
            safety.riskLevel,

          matched_value:
            safety.matchedValue,

          attempted_content:
            content,

          status:
            "pending",
        });

      if (
        safetyLogError
      ) {
        console.error(
          "Message safety event logging error:",
          safetyLogError
        );
      }

      return NextResponse.json(
        {
          success: false,

          blocked:
            true,

          eventType:
            safety.eventType,

          riskLevel:
            safety.riskLevel,

          error:
            safety.reason ||
            "This message contains restricted contact or payment information.",
        },
        {
          status: 422,
        }
      );
    }

    // --------------------------------------------------
    // INSERT MESSAGE
    // --------------------------------------------------

    const {
      data: message,
      error: messageError,
    } = await admin
      .from("messages")
      .insert({
        application_id:
          applicationId,

        sender_id:
          user.id,

        content,
      })
      .select(
        `
        id,
        application_id,
        sender_id,
        content,
        created_at
        `
      )
      .single();

    if (
      messageError
    ) {
      console.error(
        "Message insert error:",
        messageError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to send message.",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.json(
      {
        success:
          true,

        message,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected send-message API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to send message.",
      },
      {
        status: 500,
      }
    );
  }
}