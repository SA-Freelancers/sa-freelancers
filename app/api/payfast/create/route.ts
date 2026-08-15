import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/*
 * --------------------------------------------------
 * SERVER ENVIRONMENT VARIABLES
 * --------------------------------------------------
 */

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const merchantId =
  process.env.PAYFAST_MERCHANT_ID || "";

const merchantKey =
  process.env.PAYFAST_MERCHANT_KEY || "";

const passphrase =
  process.env.PAYFAST_PASSPHRASE || "";

const sandbox =
  process.env.PAYFAST_SANDBOX === "true";

/*
 * --------------------------------------------------
 * SUPABASE SERVER CLIENT
 * --------------------------------------------------
 */

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

/*
 * --------------------------------------------------
 * PAYFAST ENCODING
 * --------------------------------------------------
 */

function payfastEncode(value: string) {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (char) =>
      `%${char
        .charCodeAt(0)
        .toString(16)
        .toUpperCase()}`
    );
}

/*
 * --------------------------------------------------
 * SIGNATURE
 *
 * IMPORTANT:
 * Object insertion order is preserved.
 *
 * PayFast requires the fields to remain in the
 * documented checkout-field order.
 * --------------------------------------------------
 */

function generateSignature(
  data: Record<string, string>,
  saltPassphrase?: string
) {
  const parts: string[] = [];

  Object.entries(data).forEach(
    ([key, value]) => {
      if (value !== "") {
        parts.push(
          `${key}=${payfastEncode(value)}`
        );
      }
    }
  );

  let parameterString =
    parts.join("&");

  if (saltPassphrase) {
    parameterString +=
      `&passphrase=${payfastEncode(
        saltPassphrase
      )}`;
  }

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex");
}

/*
 * --------------------------------------------------
 * POST /api/payfast/create
 * --------------------------------------------------
 */

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * -----------------------------------------------
     * CHECK SERVER CONFIGURATION
     * -----------------------------------------------
     */

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          error:
            "Server payment configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !merchantId ||
      !merchantKey
    ) {
      return NextResponse.json(
        {
          error:
            "PayFast server credentials are not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * -----------------------------------------------
     * READ REQUEST
     * -----------------------------------------------
     */

    const body =
      await request.json();

    const projectId =
      String(
        body.projectId || ""
      ).trim();

    const milestoneId =
      String(
        body.milestoneId || ""
      ).trim();

    if (
      !projectId ||
      !milestoneId
    ) {
      return NextResponse.json(
        {
          error:
            "Project ID and milestone ID are required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -----------------------------------------------
     * VERIFY LOGGED-IN USER
     *
     * The browser sends the Supabase access token
     * in the Authorization header.
     * -----------------------------------------------
     */

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
    } = await supabase.auth.getUser(
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

    /*
     * -----------------------------------------------
     * LOAD PROJECT
     * -----------------------------------------------
     */

    const {
      data: project,
      error: projectError,
    } = await supabase
      .from("projects")
      .select(
        `
        id,
        client_id,
        freelancer_id,
        status,
        payment_status
        `
      )
      .eq("id", projectId)
      .maybeSingle();

    if (
      projectError ||
      !project
    ) {
      console.error(
        "PayFast create project error:",
        projectError
      );

      return NextResponse.json(
        {
          error:
            "Project could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -----------------------------------------------
     * SECURITY:
     * ONLY PROJECT CLIENT MAY PAY
     * -----------------------------------------------
     */

    if (
      project.client_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You are not authorised to pay for this project.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -----------------------------------------------
     * LOAD MILESTONE
     * -----------------------------------------------
     */

    const {
      data: milestone,
      error: milestoneError,
    } = await supabase
      .from("milestones")
      .select(
        `
        id,
        project_id,
        contract_id,
        title,
        description,
        amount,
        status
        `
      )
      .eq("id", milestoneId)
      .maybeSingle();

    if (
      milestoneError ||
      !milestone
    ) {
      console.error(
        "PayFast create milestone error:",
        milestoneError
      );

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

    /*
     * -----------------------------------------------
     * VERIFY PROJECT LINK
     * -----------------------------------------------
     */

    if (
      milestone.project_id !==
      projectId
    ) {
      return NextResponse.json(
        {
          error:
            "This milestone does not belong to the selected project.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -----------------------------------------------
     * VERIFY MILESTONE STATUS
     * -----------------------------------------------
     */

    const milestoneStatus =
      String(
        milestone.status || ""
      ).toLowerCase();

    if (
      milestoneStatus === "paid" ||
      milestoneStatus === "completed"
    ) {
      return NextResponse.json(
        {
          error:
            "This milestone has already been paid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      milestoneStatus !==
      "approved"
    ) {
      return NextResponse.json(
        {
          error:
            "Only approved milestones can be paid.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -----------------------------------------------
     * VERIFY AMOUNT
     *
     * IMPORTANT:
     * Amount comes from Supabase, NOT the browser.
     * -----------------------------------------------
     */

    const amount =
      Number(milestone.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The milestone has an invalid payment amount.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -----------------------------------------------
     * CANONICAL SITE URL
     * -----------------------------------------------
     */

    const siteUrl =
      (
        process.env.NEXT_PUBLIC_SITE_URL ||
        request.nextUrl.origin
      ).replace(/\/$/, "");

    const returnUrl =
      `${siteUrl}/dashboard/payment-success` +
      `?projectId=${encodeURIComponent(
        projectId
      )}` +
      `&milestoneId=${encodeURIComponent(
        milestoneId
      )}`;

    const cancelUrl =
      `${siteUrl}/dashboard/client-contracts`;

    const notifyUrl =
      `${siteUrl}/api/payfast/notify`;

    /*
     * -----------------------------------------------
     * PAYFAST DATA
     *
     * DO NOT alphabetically sort these fields.
     * The insertion order is intentional.
     * -----------------------------------------------
     */

    const paymentData:
      Record<string, string> = {
        merchant_id:
          merchantId.trim(),

        merchant_key:
          merchantKey.trim(),

        return_url:
          returnUrl,

        cancel_url:
          cancelUrl,

        notify_url:
          notifyUrl,

        name_first:
          "Freelance Hub",

        name_last:
          "SA Client",

        email_address:
          user.email ||
          "client@example.com",

        m_payment_id:
          milestoneId,

        amount:
          amount.toFixed(2),

        item_name:
          String(
            milestone.title ||
              "Freelance Project Milestone"
          ).substring(0, 100),

        item_description:
          String(
            milestone.description ||
              `Payment for ${
                milestone.title ||
                "project milestone"
              }`
          ).substring(0, 255),

        custom_str1:
          projectId,

        custom_str2:
          milestoneId,

        custom_str3:
          milestone.contract_id ||
          "",

        custom_str4:
          "Freelance Hub SA",

        custom_str5:
          "Milestone Payment",
      };

    /*
     * -----------------------------------------------
     * CREATE SIGNATURE
     * -----------------------------------------------
     */

    const signature =
      generateSignature(
        paymentData,
        passphrase || undefined
      );

    paymentData.signature =
      signature;

    /*
     * -----------------------------------------------
     * PAYFAST ENDPOINT
     * -----------------------------------------------
     */

    const payfastUrl =
      sandbox
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process";

    /*
     * -----------------------------------------------
     * RETURN SIGNED DATA TO BROWSER
     * -----------------------------------------------
     */

    return NextResponse.json({
      success: true,
      payfastUrl,
      fields: paymentData,
    });
  } catch (error) {
    console.error(
      "Unexpected PayFast create error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to prepare the PayFast payment.",
      },
      {
        status: 500,
      }
    );
  }
}