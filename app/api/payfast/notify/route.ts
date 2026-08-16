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
 * PAYFAST SIGNATURE
 * --------------------------------------------------
 */

function generateSignature(
  data: Record<string, string>,
  passphrase?: string
) {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (
      key !== "signature" &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      parts.push(
        `${key}=${payfastEncode(
          String(value)
        )}`
      );
    }
  }

  let parameterString = parts.join("&");

  if (passphrase) {
    parameterString +=
      `&passphrase=${payfastEncode(
        passphrase
      )}`;
  }

  return crypto
    .createHash("md5")
    .update(parameterString)
    .digest("hex");
}

/*
 * --------------------------------------------------
 * POST - PAYFAST ITN
 * --------------------------------------------------
 */

export async function POST(
  request: NextRequest
) {
  try {
    const rawBody = await request.text();

    const params =
      new URLSearchParams(rawBody);

    const data: Record<string, string> = {};

    params.forEach((value, key) => {
      data[key] = value;
    });

    console.log(
      "PayFast ITN received:",
      data
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
      Number(data.amount_gross || 0);

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
     * VERIFY SIGNATURE
     * --------------------------------------------------
     */

    const calculatedSignature =
      generateSignature(
        data,
        payfastPassphrase || undefined
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
        }
      );

      return new NextResponse(
        "Invalid signature",
        {
          status: 400,
        }
      );
    }

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
      .eq("id", milestoneId)
      .eq("project_id", projectId)
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
      Number(milestone.amount || 0);

    if (
      Math.abs(
        expectedAmount - grossAmount
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
     * SERVER VALIDATION WITH PAYFAST
     * --------------------------------------------------
     */

    const validationUrl =
      isSandbox
        ? "https://sandbox.payfast.co.za/eng/query/validate"
        : "https://www.payfast.co.za/eng/query/validate";

    const validationResponse =
      await fetch(validationUrl, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: rawBody,
      });

    const validationText =
      await validationResponse.text();

    if (
      validationText.trim() !== "VALID"
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

    /*
     * --------------------------------------------------
     * CHECK PAYMENT STATUS
     * --------------------------------------------------
     */

    if (
      paymentStatus !== "COMPLETE"
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
     *
     * We need the client and freelancer before creating
     * the payout record.
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
     * CALCULATE PAYOUT
     * --------------------------------------------------
     *
     * Development fee:
     * 10% platform fee
     *
     * Example:
     * R1000 gross
     * R100 platform
     * R900 freelancer
     */

    const platformFeePercent = 10;

    const platformFee =
      Number(
        (
          grossAmount *
          (platformFeePercent / 100)
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
     * CREATE PAYOUT RECORD
     * --------------------------------------------------
     *
     * The unique milestone_id index prevents two
     * payout records for the same milestone.
     */

    const {
      error: payoutError,
    } = await supabase
      .from("freelancer_payouts")
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

    /*
     * --------------------------------------------------
     * IDEMPOTENCY
     * --------------------------------------------------
     *
     * IMPORTANT:
     *
     * Payout creation happens BEFORE this check.
     *
     * This means that if PayFast sends the ITN again,
     * the database can repair/create a missing payout
     * without processing the milestone twice.
     */

    if (
      milestone.status === "paid" ||
      milestone.status === "completed"
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
      error: milestoneUpdateError,
    } = await supabase
      .from("milestones")
      .update({
        status: "paid",
      })
      .eq("id", milestoneId);

    if (milestoneUpdateError) {
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
      error: projectUpdateError,
    } = await supabase
      .from("projects")
      .update({
        payment_status: "paid",
        paid_at: paidAt,

        status:
          project.status === "pending"
            ? "active"
            : project.status,
      })
      .eq("id", projectId);

    if (projectUpdateError) {
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

    if (activityContractId) {
      const {
        error: activityError,
      } = await supabase
        .from("contract_activity")
        .insert({
          contract_id:
            activityContractId,

          action:
            `Payment received for milestone "${milestone.title || "Untitled"}"`,
        });

      if (activityError) {
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
      error: notificationError,
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

    if (notificationError) {
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