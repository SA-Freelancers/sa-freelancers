import {
  NextRequest,
  NextResponse,
} from "next/server";

import crypto from "crypto";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

/*
 * =========================================================
 * ENVIRONMENT
 * =========================================================
 */

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const payfastPassphrase =
  process.env.PAYFAST_PASSPHRASE || "";

const isSandbox =
  process.env.PAYFAST_SANDBOX === "true";

/*
 * =========================================================
 * SUPABASE SERVER CLIENT
 * =========================================================
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
 * =========================================================
 * TYPES
 * =========================================================
 */

type PaymentType =
  | "milestone"
  | "direct_hire";

/*
 * =========================================================
 * PAYFAST PHP-STYLE URL ENCODING
 * =========================================================
 */

function payfastEncode(
  value: string
) {
  return encodeURIComponent(value)
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
 * BUILD PAYFAST ITN PARAMETER STRING
 * =========================================================
 *
 * IMPORTANT:
 *
 * Preserve:
 *
 * 1. PayFast field order
 * 2. Empty fields
 * 3. Every field before signature
 *
 * Signature itself is excluded.
 * =========================================================
 */

function buildPayfastParamString(
  params: URLSearchParams
) {
  const parts: string[] = [];

  for (
    const [key, value]
    of params.entries()
  ) {
    if (key === "signature") {
      break;
    }

    parts.push(
      `${key}=${payfastEncode(
        value
      )}`
    );
  }

  return parts.join("&");
}

/*
 * =========================================================
 * GENERATE ITN SIGNATURE
 * =========================================================
 */

function generateItnSignature(
  parameterString: string,
  passphrase?: string
) {
  let signatureString =
    parameterString;

  if (passphrase) {
    signatureString +=
      `&passphrase=${payfastEncode(
        passphrase.trim()
      )}`;
  }

  return crypto
    .createHash("md5")
    .update(signatureString)
    .digest("hex");
}

/*
 * =========================================================
 * PAYFAST ITN
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
      console.error(
        "PayFast ITN server configuration is incomplete."
      );

      return new NextResponse(
        "Server configuration error",
        {
          status: 500,
        }
      );
    }

    /*
     * =====================================================
     * READ ORIGINAL PAYFAST POST BODY
     * =====================================================
     */

    const rawBody =
      await request.text();

    const params =
      new URLSearchParams(
        rawBody
      );

    const data:
      Record<string, string> = {};

    params.forEach(
      (value, key) => {
        data[key] = value;
      }
    );

    /*
     * =====================================================
     * IDENTIFIERS
     * =====================================================
     *
     * custom_str1 = project ID
     * custom_str2 = milestone ID
     * custom_str3 = contract ID
     * custom_str4 = payment type
     * =====================================================
     */

    const receivedSignature =
      data.signature || "";

    const paymentStatus =
      data.payment_status || "";

    const projectId =
      data.custom_str1 || "";

    const milestoneId =
      data.custom_str2 || "";

    const contractId =
      data.custom_str3 || "";

    const rawPaymentType =
      String(
        data.custom_str4 || ""
      )
        .trim()
        .toLowerCase();

    /*
     * Backward compatibility:
     *
     * Old PayFast transactions did not contain
     * custom_str4.
     *
     * If a milestone ID exists, treat the ITN
     * as a milestone payment.
     */

    const paymentType:
      PaymentType =
      rawPaymentType ===
      "direct_hire"
        ? "direct_hire"
        : "milestone";

    const grossAmount =
      Number(
        data.amount_gross || 0
      );

    console.log(
      "PayFast ITN received:",
      {
        m_payment_id:
          data.m_payment_id,

        pf_payment_id:
          data.pf_payment_id,

        payment_status:
          paymentStatus,

        amount_gross:
          data.amount_gross,

        merchant_id:
          data.merchant_id,

        projectId,

        milestoneId:
          milestoneId || null,

        contractId:
          contractId || null,

        paymentType,
      }
    );

    /*
     * =====================================================
     * REQUIRED VALUES
     * =====================================================
     */

    if (
      !receivedSignature ||
      !projectId
    ) {
      console.error(
        "PayFast ITN missing required values."
      );

      return new NextResponse(
        "Missing required values",
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
      console.error(
        "Milestone payment ITN is missing milestone ID."
      );

      return new NextResponse(
        "Milestone ID missing",
        {
          status: 400,
        }
      );
    }

    if (
      paymentType ===
        "direct_hire" &&
      !contractId
    ) {
      console.error(
        "Direct-hire ITN is missing contract ID."
      );

      return new NextResponse(
        "Contract ID missing",
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        grossAmount
      ) ||
      grossAmount <= 0
    ) {
      console.error(
        "Invalid PayFast gross amount:",
        data.amount_gross
      );

      return new NextResponse(
        "Invalid payment amount",
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * BUILD ORIGINAL PAYFAST PARAMETER STRING
     * =====================================================
     */

    const pfParamString =
      buildPayfastParamString(
        params
      );

    /*
     * =====================================================
     * VERIFY PAYFAST SIGNATURE
     * =====================================================
     */

    const calculatedSignature =
      generateItnSignature(
        pfParamString,
        payfastPassphrase ||
          undefined
      );

    if (
      calculatedSignature !==
      receivedSignature
    ) {
      console.error(
        "Invalid PayFast signature.",
        {
          hasPassphrase:
            Boolean(
              payfastPassphrase
            ),
        }
      );

      return new NextResponse(
        "Invalid signature",
        {
          status: 400,
        }
      );
    }

    console.log(
      "PayFast signature verified."
    );

    /*
     * =====================================================
     * LOAD PAYMENT SOURCE
     * =====================================================
     *
     * expectedAmount comes ONLY from Supabase.
     * =====================================================
     */

    let expectedAmount = 0;

    let paymentTitle =
      "Freelance Project";

    let activityContractId:
      string | null =
      contractId || null;

    let milestoneStatus = "";

    /*
     * =====================================================
     * MILESTONE PAYMENT SOURCE
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
          amount,
          status
        `)
        .eq(
          "id",
          milestoneId
        )
        .eq(
          "project_id",
          projectId
        )
        .maybeSingle();

      if (
        milestoneError ||
        !milestone
      ) {
        console.error(
          "ITN milestone lookup failed:",
          milestoneError
        );

        return new NextResponse(
          "Milestone not found",
          {
            status: 404,
          }
        );
      }

      expectedAmount =
        Number(
          milestone.amount || 0
        );

      paymentTitle =
        milestone.title ||
        "Untitled Milestone";

      milestoneStatus =
        String(
          milestone.status || ""
        ).toLowerCase();

      activityContractId =
        milestone.contract_id ||
        contractId ||
        null;
    }

    /*
     * =====================================================
     * DIRECT-HIRE PAYMENT SOURCE
     * =====================================================
     */

    else {
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
          budget,
          status
        `)
        .eq(
          "id",
          contractId
        )
        .eq(
          "project_id",
          projectId
        )
        .maybeSingle();

      if (
        contractError ||
        !contract
      ) {
        console.error(
          "ITN direct-hire contract lookup failed:",
          contractError
        );

        return new NextResponse(
          "Direct-hire contract not found",
          {
            status: 404,
          }
        );
      }

      /*
       * Contract must still represent an
       * accepted direct hire.
       */

      const contractStatus =
        String(
          contract.status || ""
        ).toLowerCase();

      if (
        contractStatus !==
        "accepted"
      ) {
        console.error(
          "Direct-hire contract is not accepted:",
          {
            contractId,
            contractStatus,
          }
        );

        return new NextResponse(
          "Contract is not accepted",
          {
            status: 400,
          }
        );
      }

      expectedAmount =
        Number(
          contract.budget || 0
        );

      paymentTitle =
        contract.project_title ||
        "Direct Hire Project";

      activityContractId =
        contract.id;
    }

    /*
     * =====================================================
     * VERIFY EXPECTED AMOUNT
     * =====================================================
     */

    if (
      !Number.isFinite(
        expectedAmount
      ) ||
      expectedAmount <= 0
    ) {
      console.error(
        "Database payment amount is invalid:",
        {
          paymentType,
          expectedAmount,
        }
      );

      return new NextResponse(
        "Invalid database payment amount",
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * VERIFY PAYFAST AMOUNT
     * =====================================================
     */

    if (
      Math.abs(
        expectedAmount -
          grossAmount
      ) > 0.01
    ) {
      console.error(
        "PayFast amount mismatch.",
        {
          paymentType,
          expectedAmount,
          grossAmount,
        }
      );

      return new NextResponse(
        "Amount mismatch",
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * SERVER CONFIRMATION WITH PAYFAST
     * =====================================================
     */

    const validationUrl =
      isSandbox
        ? "https://sandbox.payfast.co.za/eng/query/validate"
        : "https://www.payfast.co.za/eng/query/validate";

    const validationResponse =
      await fetch(
        validationUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            pfParamString,
        }
      );

    const validationText =
      await validationResponse
        .text();

    if (
      validationText.trim() !==
      "VALID"
    ) {
      console.error(
        "PayFast server validation failed:",
        validationText
      );

      return new NextResponse(
        "Invalid PayFast validation",
        {
          status: 400,
        }
      );
    }

    console.log(
      "PayFast server validation passed."
    );

    /*
     * =====================================================
     * CHECK PAYMENT STATUS
     * =====================================================
     */

    if (
      paymentStatus !==
      "COMPLETE"
    ) {
      console.log(
        "ITN received but payment is not COMPLETE:",
        paymentStatus
      );

      return new NextResponse(
        "Payment not complete",
        {
          status: 200,
        }
      );
    }

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
        "ITN project lookup error:",
        projectError
      );

      return new NextResponse(
        "Project not found",
        {
          status: 404,
        }
      );
    }

    /*
     * =====================================================
     * PROJECT PARTICIPANTS
     * =====================================================
     */

    if (
      !project.client_id ||
      !project.freelancer_id
    ) {
      console.error(
        "Project is missing client or freelancer.",
        {
          projectId,

          clientId:
            project.client_id,

          freelancerId:
            project.freelancer_id,
        }
      );

      return new NextResponse(
        "Project participants missing",
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * DIRECT-HIRE RELATIONSHIP CHECK
     * =====================================================
     *
     * Re-read the contract participants and make
     * sure they match the project participants.
     * =====================================================
     */

    if (
      paymentType ===
      "direct_hire"
    ) {
      const {
        data: directHireContract,
        error:
          directHireContractError,
      } = await supabase
        .from("contracts")
        .select(`
          id,
          client_id,
          freelancer_id
        `)
        .eq(
          "id",
          contractId
        )
        .eq(
          "project_id",
          projectId
        )
        .maybeSingle();

      if (
        directHireContractError ||
        !directHireContract
      ) {
        console.error(
          "Direct-hire relationship lookup failed:",
          directHireContractError
        );

        return new NextResponse(
          "Contract relationship could not be verified",
          {
            status: 400,
          }
        );
      }

      if (
        directHireContract.client_id !==
          project.client_id ||
        directHireContract.freelancer_id !==
          project.freelancer_id
      ) {
        console.error(
          "Direct-hire contract/project participant mismatch.",
          {
            contractId,
            projectId,
          }
        );

        return new NextResponse(
          "Contract/project mismatch",
          {
            status: 400,
          }
        );
      }
    }

    /*
     * =====================================================
     * PAYOUT CALCULATION
     * =====================================================
     *
     * Current platform fee = 10%
     * =====================================================
     */

    const platformFeePercent =
      10;

    const platformFee =
      Number(
        (
          grossAmount *
          (
            platformFeePercent /
            100
          )
        ).toFixed(2)
      );

    const freelancerAmount =
      Number(
        (
          grossAmount -
          platformFee
        ).toFixed(2)
      );

    const paidAt =
      new Date().toISOString();

    /*
     * =====================================================
     * CREATE FREELANCER PAYOUT
     * =====================================================
     *
     * MILESTONE:
     *
     * milestone_id = milestone UUID
     * payment_type = milestone
     *
     * DIRECT HIRE:
     *
     * milestone_id = NULL
     * payment_type = direct_hire
     *
     * Database partial unique indexes provide
     * duplicate protection.
     * =====================================================
     */

    let payoutError:
      { message?: string } |
      null =
      null;

    if (
      paymentType ===
      "milestone"
    ) {
      const {
        error,
      } = await supabase
        .from(
          "freelancer_payouts"
        )
        .upsert(
          {
            milestone_id:
              milestoneId,

            project_id:
              projectId,

            contract_id:
              activityContractId,

            freelancer_id:
              project.freelancer_id,

            client_id:
              project.client_id,

            gross_amount:
              grossAmount,

            platform_fee:
              platformFee,

            freelancer_amount:
              freelancerAmount,

            platform_fee_percent:
              platformFeePercent,

            payment_type:
              "milestone",

            status:
              "held",

            payment_received_at:
              paidAt,

            updated_at:
              paidAt,
          },
          {
            onConflict:
              "milestone_id",

            ignoreDuplicates:
              true,
          }
        );

      payoutError =
        error;
    } else {
      /*
       * Partial unique indexes cannot reliably be
       * targeted through PostgREST's onConflict
       * parameter in the same way as a normal
       * UNIQUE constraint.
       *
       * Therefore:
       *
       * 1. Check for existing direct-hire payout.
       * 2. Insert only when none exists.
       * 3. Database partial unique index remains
       *    the final concurrency protection.
       */

      const {
        data: existingPayout,
        error:
          existingPayoutError,
      } = await supabase
        .from(
          "freelancer_payouts"
        )
        .select("id")
        .eq(
          "project_id",
          projectId
        )
        .eq(
          "payment_type",
          "direct_hire"
        )
        .maybeSingle();

      if (
        existingPayoutError
      ) {
        console.error(
          "Direct-hire payout lookup failed:",
          existingPayoutError
        );

        return new NextResponse(
          "Payout lookup failed",
          {
            status: 500,
          }
        );
      }

      if (!existingPayout) {
        const {
          error,
        } = await supabase
          .from(
            "freelancer_payouts"
          )
          .insert({
            milestone_id:
              null,

            project_id:
              projectId,

            contract_id:
              activityContractId,

            freelancer_id:
              project.freelancer_id,

            client_id:
              project.client_id,

            gross_amount:
              grossAmount,

            platform_fee:
              platformFee,

            freelancer_amount:
              freelancerAmount,

            platform_fee_percent:
              platformFeePercent,

            payment_type:
              "direct_hire",

            status:
              "held",

            payment_received_at:
              paidAt,

            updated_at:
              paidAt,
          });

        /*
         * PostgreSQL code 23505 means another
         * concurrent ITN already created the
         * same direct-hire payout.
         *
         * That is safe and should be treated
         * as an idempotent retry.
         */

        if (
          error &&
          error.code !== "23505"
        ) {
          payoutError =
            error;
        }
      }
    }

    if (payoutError) {
      console.error(
        "Freelancer payout creation failed:",
        payoutError
      );

      return new NextResponse(
        "Payout record creation failed",
        {
          status: 500,
        }
      );
    }

    console.log(
      "Freelancer payout record confirmed.",
      {
        paymentType,
        projectId,

        milestoneId:
          milestoneId || null,

        contractId:
          activityContractId,

        grossAmount,
        platformFee,
        freelancerAmount,

        status:
          "held",
      }
    );

    /*
     * =====================================================
     * MILESTONE PROCESSING
     * =====================================================
     */

    if (
      paymentType ===
      "milestone"
    ) {
      /*
       * Existing milestone already processed.
       */

      if (
        milestoneStatus ===
          "paid" ||
        milestoneStatus ===
          "completed"
      ) {
        console.log(
          "Milestone already processed."
        );

        return new NextResponse(
          "OK",
          {
            status: 200,
          }
        );
      }

      /*
       * -----------------------------------------------
       * MARK MILESTONE PAID
       * -----------------------------------------------
       */

      const {
        error:
          milestoneUpdateError,
      } = await supabase
        .from("milestones")
        .update({
          status:
            "paid",
        })
        .eq(
          "id",
          milestoneId
        );

      if (
        milestoneUpdateError
      ) {
        console.error(
          "Milestone ITN update error:",
          milestoneUpdateError
        );

        return new NextResponse(
          "Milestone update failed",
          {
            status: 500,
          }
        );
      }
    }

    /*
     * =====================================================
     * PROJECT IDEMPOTENCY
     * =====================================================
     */

    const projectAlreadyPaid =
      String(
        project.payment_status ||
          ""
      ).toLowerCase() ===
        "paid" ||
      Boolean(
        project.paid_at
      );

    /*
     * =====================================================
     * UPDATE PROJECT
     * =====================================================
     *
     * Only PayFast COMPLETE ITN reaches here.
     *
     * pending -> active
     * unpaid  -> paid
     * paid_at -> timestamp
     * =====================================================
     */

    if (!projectAlreadyPaid) {
      const {
        error:
          projectUpdateError,
      } = await supabase
        .from("projects")
        .update({
          payment_status:
            "paid",

          paid_at:
            paidAt,

          status:
            project.status ===
            "pending"
              ? "active"
              : project.status,
        })
        .eq(
          "id",
          projectId
        );

      if (
        projectUpdateError
      ) {
        console.error(
          "Project ITN update error:",
          projectUpdateError
        );

        return new NextResponse(
          "Project update failed",
          {
            status: 500,
          }
        );
      }
    }

    /*
     * =====================================================
     * DON'T DUPLICATE ACTIVITY / NOTIFICATION
     * =====================================================
     *
     * PayFast can retry an ITN.
     *
     * The payout record can be safely checked/created
     * again, but we do not want repeated activity
     * messages and notifications.
     * =====================================================
     */

    if (projectAlreadyPaid) {
      console.log(
        "Project payment was already processed."
      );

      return new NextResponse(
        "OK",
        {
          status: 200,
        }
      );
    }

    /*
     * =====================================================
     * CONTRACT ACTIVITY
     * =====================================================
     */

    if (
      activityContractId
    ) {
      const action =
        paymentType ===
        "milestone"
          ? `Payment received for milestone "${paymentTitle}"`
          : `Project funding received for "${paymentTitle}"`;

      const {
        error:
          activityError,
      } = await supabase
        .from(
          "contract_activity"
        )
        .insert({
          contract_id:
            activityContractId,

          action,
        });

      if (
        activityError
      ) {
        console.error(
          "Contract activity insert error:",
          activityError
        );
      }
    }

    /*
     * =====================================================
     * NOTIFY FREELANCER
     * =====================================================
     */

    const notificationTitle =
      paymentType ===
      "milestone"
        ? "Payment Received"
        : "Project Funded";

    const notificationBody =
      paymentType ===
      "milestone"
        ? `Payment received for milestone "${paymentTitle}".`
        : `The client has funded "${paymentTitle}". You can now begin work.`;

    const notificationLink =
      paymentType ===
        "milestone" &&
      activityContractId
        ? `/dashboard/contracts/${activityContractId}/milestones`
        : activityContractId
          ? `/dashboard/contracts/${activityContractId}`
          : "/dashboard/projects";

    const {
      error:
        notificationError,
    } = await supabase
      .from("notifications")
      .insert({
        user_id:
          project.freelancer_id,

        title:
          notificationTitle,

        body:
          notificationBody,

        link:
          notificationLink,

        is_read:
          false,
      });

    if (
      notificationError
    ) {
      console.error(
        "Freelancer notification error:",
        notificationError
      );
    }

    /*
     * =====================================================
     * SUCCESS
     * =====================================================
     */

    console.log(
      "PayFast ITN processed successfully.",
      {
        paymentType,

        projectId,

        milestoneId:
          milestoneId || null,

        contractId:
          activityContractId,

        grossAmount,
        platformFee,
        freelancerAmount,

        payoutStatus:
          "held",
      }
    );

    return new NextResponse(
      "OK",
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected PayFast ITN error:",
      error
    );

    return new NextResponse(
      "Internal server error",
      {
        status: 500,
      }
    );
  }
}