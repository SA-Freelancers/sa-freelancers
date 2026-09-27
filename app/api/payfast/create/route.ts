import {
  NextRequest,
  NextResponse,
} from "next/server";

import crypto from "crypto";

import {
  createClient,
} from "@supabase/supabase-js";

/*
 * =========================================================
 * SERVER ENVIRONMENT VARIABLES
 * =========================================================
 */

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL || "";

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY || "";

const merchantId =
  process.env
    .PAYFAST_MERCHANT_ID || "";

const merchantKey =
  process.env
    .PAYFAST_MERCHANT_KEY || "";

const passphrase =
  process.env
    .PAYFAST_PASSPHRASE || "";

const sandbox =
  process.env
    .PAYFAST_SANDBOX === "true";

/*
 * =========================================================
 * SUPABASE SERVER CLIENT
 * =========================================================
 */

const supabase =
  createClient(
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
 * =========================================================
 * TYPES
 * =========================================================
 */

type PaymentType =
  | "milestone"
  | "direct_hire";

type PaymentDetails = {
  paymentType: PaymentType;

  amount: number;

  paymentReference: string;

  itemName: string;

  itemDescription: string;

  milestoneId: string;

  contractId: string;
};

/*
 * =========================================================
 * PAYFAST ENCODING
 * =========================================================
 *
 * PayFast signature generation follows
 * PHP-style urlencode behaviour.
 *
 * spaces -> +
 * ! ' ( ) * ~ -> percent encoded
 * =========================================================
 */

function payfastEncode(
  value: string
) {
  return encodeURIComponent(
    value.trim()
  )
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");
}

/*
 * =========================================================
 * PAYFAST SIGNATURE
 * =========================================================
 *
 * IMPORTANT:
 *
 * Do not alphabetically sort fields.
 *
 * The insertion order of paymentData
 * is used when generating the signature.
 * =========================================================
 */

function generateSignature(
  data: Record<string, string>,
  saltPassphrase?: string
) {
  const parts: string[] = [];

  for (
    const [key, value]
    of Object.entries(data)
  ) {
    if (value !== "") {
      parts.push(
        `${key}=${payfastEncode(
          value
        )}`
      );
    }
  }

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
 * =========================================================
 * POST /api/payfast/create
 * =========================================================
 */

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * =====================================================
     * SERVER CONFIGURATION
     * =====================================================
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
     * =====================================================
     * READ REQUEST
     * =====================================================
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

    const requestedPaymentType =
      String(
        body.paymentType || ""
      )
        .trim()
        .toLowerCase();

    /*
     * Keep backward compatibility.
     *
     * Old milestone pages that do not send
     * paymentType will still work.
     */

    const paymentType:
      PaymentType =
      requestedPaymentType ===
      "direct_hire"
        ? "direct_hire"
        : "milestone";

    if (!projectId) {
      return NextResponse.json(
        {
          error:
            "Project ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      paymentType ===
        "milestone" &&
      !milestoneId
    ) {
      return NextResponse.json(
        {
          error:
            "Milestone ID is required for milestone payments.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * VERIFY CURRENT USER
     * =====================================================
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
    } =
      await supabase.auth.getUser(
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
     * =====================================================
     * LOAD PROJECT
     * =====================================================
     */

    const {
      data: project,
      error: projectError,
    } = await supabase
      .from("projects")
      .select(`
        id,
        client_id,
        freelancer_id,
        status,
        payment_status,
        paid_at
      `)
      .eq(
        "id",
        projectId
      )
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
     * =====================================================
     * SECURITY
     *
     * ONLY PROJECT CLIENT CAN PAY
     * =====================================================
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
     * =====================================================
     * PREPARE PAYMENT DETAILS
     * =====================================================
     */

    let paymentDetails:
      PaymentDetails;

    /*
     * =====================================================
     * MILESTONE PAYMENT
     * =====================================================
     */

    if (
      paymentType ===
      "milestone"
    ) {
      const {
        data: milestone,
        error: milestoneError,
      } = await supabase
        .from("milestones")
        .select(`
          id,
          project_id,
          contract_id,
          title,
          description,
          amount,
          status
        `)
        .eq(
          "id",
          milestoneId
        )
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
        milestoneStatus ===
          "paid" ||
        milestoneStatus ===
          "completed"
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
       * AMOUNT
       *
       * IMPORTANT:
       * Amount comes from Supabase.
       * -----------------------------------------------
       */

      const amount =
        Number(
          milestone.amount
        );

      if (
        !Number.isFinite(
          amount
        ) ||
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

      paymentDetails = {
        paymentType:
          "milestone",

        amount,

        paymentReference:
          milestone.id,

        itemName:
          String(
            milestone.title ||
              "Freelance Project Milestone"
          ).substring(
            0,
            100
          ),

        itemDescription:
          String(
            milestone.description ||
              `Payment for ${
                milestone.title ||
                "project milestone"
              }`
          ).substring(
            0,
            255
          ),

        milestoneId:
          milestone.id,

        contractId:
          milestone.contract_id ||
          "",
      };
    }

    /*
     * =====================================================
     * DIRECT-HIRE PAYMENT
     * =====================================================
     */

    else {
      /*
       * -----------------------------------------------
       * LOAD CONTRACT
       * -----------------------------------------------
       */

      const {
        data: contract,
        error: contractError,
      } = await supabase
        .from("contracts")
        .select(`
          id,
          project_id,
          client_id,
          freelancer_id,
          project_title,
          project_description,
          budget,
          status
        `)
        .eq(
          "project_id",
          projectId
        )
        .eq(
          "client_id",
          user.id
        )
        .maybeSingle();

      if (
        contractError ||
        !contract
      ) {
        console.error(
          "PayFast direct-hire contract error:",
          contractError
        );

        return NextResponse.json(
          {
            error:
              "The direct-hire contract could not be found.",
          },
          {
            status: 404,
          }
        );
      }

      /*
       * -----------------------------------------------
       * VERIFY RELATIONSHIPS
       * -----------------------------------------------
       */

      if (
        contract.client_id !==
        project.client_id ||
        contract.freelancer_id !==
        project.freelancer_id
      ) {
        return NextResponse.json(
          {
            error:
              "The contract does not match this project.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------
       * CONTRACT MUST BE ACCEPTED
       * -----------------------------------------------
       */

      const contractStatus =
        String(
          contract.status || ""
        ).toLowerCase();

      if (
        contractStatus !==
        "accepted"
      ) {
        return NextResponse.json(
          {
            error:
              "The freelancer must accept the contract before payment can be made.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------
       * PROJECT MUST STILL BE WAITING FOR PAYMENT
       * -----------------------------------------------
       */

      const projectStatus =
        String(
          project.status || ""
        ).toLowerCase();

      const projectPaymentStatus =
        String(
          project.payment_status ||
            "unpaid"
        ).toLowerCase();

      if (
        projectPaymentStatus ===
          "paid" ||
        project.paid_at
      ) {
        return NextResponse.json(
          {
            error:
              "This project has already been funded.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        projectStatus !==
        "pending"
      ) {
        return NextResponse.json(
          {
            error:
              "This project is not awaiting payment.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        projectPaymentStatus !==
        "unpaid"
      ) {
        return NextResponse.json(
          {
            error:
              "This project is not awaiting payment.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * -----------------------------------------------
       * DIRECT-HIRE AMOUNT
       *
       * IMPORTANT:
       *
       * Budget comes from the server-side
       * contract record.
       *
       * Never trust a browser-supplied amount.
       * -----------------------------------------------
       */

      const amount =
        Number(
          contract.budget
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "The contract has an invalid payment amount.",
          },
          {
            status: 400,
          }
        );
      }

      paymentDetails = {
        paymentType:
          "direct_hire",

        amount,

        /*
         * Contract ID is the unique PayFast
         * payment reference for direct hire.
         */

        paymentReference:
          contract.id,

        itemName:
          String(
            contract.project_title ||
              "Freelance Hub SA Direct Hire"
          ).substring(
            0,
            100
          ),

        itemDescription:
          String(
            contract.project_description ||
              `Direct hire payment for ${
                contract.project_title ||
                "freelance project"
              }`
          ).substring(
            0,
            255
          ),

        /*
         * No milestone exists for this
         * payment type.
         */

        milestoneId: "",

        contractId:
          contract.id,
      };
    }

    /*
     * =====================================================
     * SITE URLS
     * =====================================================
     */

    const siteUrl =
      (
        process.env
          .NEXT_PUBLIC_SITE_URL ||
        request.nextUrl.origin
      ).replace(
        /\/$/,
        ""
      );

    /*
     * Include paymentType so the success page
     * knows which workflow returned from PayFast.
     */

    const returnUrl =
      paymentDetails.paymentType ===
      "milestone"
        ? `${siteUrl}/dashboard/payment-success` +
          `?projectId=${encodeURIComponent(
            projectId
          )}` +
          `&milestoneId=${encodeURIComponent(
            paymentDetails.milestoneId
          )}` +
          `&paymentType=milestone`
        : `${siteUrl}/dashboard/payment-success` +
          `?projectId=${encodeURIComponent(
            projectId
          )}` +
          `&contractId=${encodeURIComponent(
            paymentDetails.contractId
          )}` +
          `&paymentType=direct_hire`;

    const cancelUrl =
      `${siteUrl}/dashboard/client-contracts`;

    const notifyUrl =
      `${siteUrl}/api/payfast/notify`;

    /*
     * =====================================================
     * PAYFAST PAYMENT DATA
     *
     * IMPORTANT:
     *
     * DO NOT CHANGE FIELD ORDER without reviewing
     * signature generation.
     * =====================================================
     */

    const paymentData:
      Record<string, string> = {
        /*
         * Merchant details
         */

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

        /*
         * Customer details
         */

        name_first:
          "Freelance Hub",

        name_last:
          "SA Client",

        email_address:
          user.email ||
          "client@example.com",

        /*
         * Transaction details
         */

        m_payment_id:
          paymentDetails
            .paymentReference,

        amount:
          paymentDetails.amount
            .toFixed(2),

        item_name:
          paymentDetails.itemName,

        item_description:
          paymentDetails
            .itemDescription,

        /*
         * =================================================
         * CUSTOM PAYFAST VALUES
         * =================================================
         *
         * custom_str1 = project ID
         * custom_str2 = milestone ID
         * custom_str3 = contract ID
         * custom_str4 = payment type
         *
         * This gives the ITN endpoint enough
         * information to distinguish workflows.
         * =================================================
         */

        custom_str1:
          projectId,

        custom_str2:
          paymentDetails
            .milestoneId,

        custom_str3:
          paymentDetails
            .contractId,

        custom_str4:
          paymentDetails
            .paymentType,
      };

    /*
     * =====================================================
     * SAFE DIAGNOSTICS
     *
     * NEVER log merchantKey or passphrase.
     * =====================================================
     */

    console.log(
      "PayFast checkout diagnostics:",
      {
        sandbox,

        paymentType:
          paymentDetails
            .paymentType,

        projectId,

        milestoneId:
          paymentDetails
            .milestoneId ||
          null,

        contractId:
          paymentDetails
            .contractId ||
          null,

        merchantIdLength:
          merchantId
            .trim()
            .length,

        merchantKeyLength:
          merchantKey
            .trim()
            .length,

        amount:
          paymentData.amount,

        itemName:
          paymentData.item_name,

        returnUrl:
          paymentData.return_url,

        notifyUrl:
          paymentData.notify_url,

        hasPassphrase:
          Boolean(
            passphrase
          ),
      }
    );

    /*
     * =====================================================
     * CREATE SIGNATURE
     * =====================================================
     */

    const signature =
      generateSignature(
        paymentData,
        passphrase ||
          undefined
      );

    paymentData.signature =
      signature;

    /*
     * =====================================================
     * PAYFAST ENDPOINT
     * =====================================================
     */

    const payfastUrl =
      sandbox
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process";

    /*
     * =====================================================
     * RETURN PAYMENT DATA
     * =====================================================
     */

    return NextResponse.json({
      success: true,

      paymentType:
        paymentDetails
          .paymentType,

      payfastUrl,

      fields:
        paymentData,
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