import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

const payfastPassphrase =
  process.env.PAYFAST_PASSPHRASE || "";

const isSandbox =
  process.env.PAYFAST_SANDBOX === "true";

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
 * PAYFAST PHP-STYLE URL ENCODING
 * --------------------------------------------------
 */

function payfastEncode(value: string) {
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
 * --------------------------------------------------
 * BUILD PAYFAST ITN PARAMETER STRING
 * --------------------------------------------------
 *
 * IMPORTANT:
 *
 * For an incoming ITN we preserve:
 *
 * 1. PayFast's original field order.
 * 2. Empty posted fields.
 * 3. Every field before "signature".
 *
 * The signature itself is NOT included.
 * --------------------------------------------------
 */

function buildPayfastParamString(
  params: URLSearchParams
) {
  const parts: string[] = [];

  for (const [key, value] of params.entries()) {
    if (key === "signature") {
      break;
    }

    parts.push(
      `${key}=${payfastEncode(value)}`
    );
  }

  return parts.join("&");
}

/*
 * --------------------------------------------------
 * GENERATE ITN SIGNATURE
 * --------------------------------------------------
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
 * --------------------------------------------------
 * PAYFAST ITN
 * --------------------------------------------------
 */

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * --------------------------------------------------
     * READ ORIGINAL PAYFAST POST BODY
     * --------------------------------------------------
     */

    const rawBody =
      await request.text();

    const params =
      new URLSearchParams(rawBody);

    const data:
      Record<string, string> = {};

    params.forEach(
      (value, key) => {
        data[key] = value;
      }
    );

    console.log(
      "PayFast ITN received:",
      {
        m_payment_id:
          data.m_payment_id,

        pf_payment_id:
          data.pf_payment_id,

        payment_status:
          data.payment_status,

        amount_gross:
          data.amount_gross,

        merchant_id:
          data.merchant_id,

        custom_str1:
          data.custom_str1,

        custom_str2:
          data.custom_str2,

        custom_str3:
          data.custom_str3,
      }
    );

    /*
     * --------------------------------------------------
     * REQUIRED VALUES
     * --------------------------------------------------
     */

    const receivedSignature =
      data.signature;

    const paymentStatus =
      data.payment_status;

    const projectId =
      data.custom_str1;

    const milestoneId =
      data.custom_str2;

    const contractId =
      data.custom_str3;

    const grossAmount =
      Number(
        data.amount_gross || 0
      );

    if (
      !receivedSignature ||
      !projectId ||
      !milestoneId
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

    /*
     * --------------------------------------------------
     * BUILD ORIGINAL PAYFAST PARAMETER STRING
     * --------------------------------------------------
     *
     * Unlike the payment checkout signature,
     * incoming ITNs may contain empty fields.
     *
     * Those fields must remain in this string.
     * --------------------------------------------------
     */

    const pfParamString =
      buildPayfastParamString(
        params
      );

    /*
     * --------------------------------------------------
     * VERIFY PAYFAST SIGNATURE
     * --------------------------------------------------
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
          receivedSignature,
          calculatedSignature,

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
     * --------------------------------------------------
     * LOAD MILESTONE
     * --------------------------------------------------
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
        amount,
        status
        `
      )
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

    /*
     * --------------------------------------------------
     * VERIFY AMOUNT
     * --------------------------------------------------
     */

    const expectedAmount =
      Number(
        milestone.amount || 0
      );

    if (
      Math.abs(
        expectedAmount -
          grossAmount
      ) > 0.01
    ) {
      console.error(
        "PayFast amount mismatch.",
        {
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
     * --------------------------------------------------
     * SERVER CONFIRMATION WITH PAYFAST
     * --------------------------------------------------
     *
     * Send the PayFast parameter string,
     * excluding the signature field.
     * --------------------------------------------------
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
      await validationResponse.text();

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
     * --------------------------------------------------
     * CHECK PAYMENT STATUS
     * --------------------------------------------------
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
     * --------------------------------------------------
     * LOAD PROJECT
     * --------------------------------------------------
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
     * --------------------------------------------------
     * PROJECT PARTICIPANTS
     * --------------------------------------------------
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
     * --------------------------------------------------
     * PAYOUT CALCULATION
     * --------------------------------------------------
     *
     * Current development platform fee:
     *
     * 10%
     *
     * Example:
     *
     * Client pays R10
     * Platform fee R1
     * Freelancer balance R9
     * --------------------------------------------------
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

    const activityContractId =
      milestone.contract_id ||
      contractId ||
      null;

    /*
     * --------------------------------------------------
     * CREATE FREELANCER PAYOUT
     * --------------------------------------------------
     *
     * The unique milestone_id index prevents
     * duplicate payout records.
     * --------------------------------------------------
     */

    const {
      error: payoutError,
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
        milestoneId,
        grossAmount,
        platformFee,
        freelancerAmount,
        status:
          "held",
      }
    );

    /*
     * --------------------------------------------------
     * IDEMPOTENCY
     * --------------------------------------------------
     *
     * The payout check happens before this.
     *
     * Therefore a PayFast retry can repair a
     * missing payout record without sending
     * duplicate notifications or reprocessing
     * the milestone.
     * --------------------------------------------------
     */

    if (
      milestone.status ===
        "paid" ||
      milestone.status ===
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
     * --------------------------------------------------
     * MARK MILESTONE PAID
     * --------------------------------------------------
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

    /*
     * --------------------------------------------------
     * UPDATE PROJECT
     * --------------------------------------------------
     */

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

    /*
     * --------------------------------------------------
     * CONTRACT ACTIVITY
     * --------------------------------------------------
     */

    if (
      activityContractId
    ) {
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

          action:
            `Payment received for milestone "${milestone.title || "Untitled"}"`,
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
     * --------------------------------------------------
     * NOTIFY FREELANCER
     * --------------------------------------------------
     */

    const {
      error:
        notificationError,
    } = await supabase
      .from("notifications")
      .insert({
        user_id:
          project.freelancer_id,

        title:
          "Payment Received",

        body:
          `Payment received for milestone "${milestone.title || "Untitled Milestone"}".`,

        link:
          activityContractId
            ? `/dashboard/contracts/${activityContractId}/milestones`
            : "/dashboard/projects",

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
     * --------------------------------------------------
     * SUCCESS
     * --------------------------------------------------
     */

    console.log(
      "PayFast ITN processed successfully.",
      {
        projectId,
        milestoneId,
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