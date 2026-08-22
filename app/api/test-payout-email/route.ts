import { NextResponse } from "next/server";
import { sendPayoutEmail } from "@/app/lib/sendPayoutEmail";

export const runtime = "nodejs";

export async function GET() {
  try {
    const testEmail =
      "thabangkhosi1996@gmail.com";

    const testPayoutId =
      "00000000-0000-0000-0000-000000000001";

    const result =
      await sendPayoutEmail({
        to: testEmail,

        freelancerName:
          "Test Freelancer",

        amount: 9.0,

        paymentReference:
          "EMAIL-TEST-001",

        milestoneTitle:
          "Freelance Hub SA Test Milestone",

        paidOutAt:
          new Date().toISOString(),

        payoutId:
          testPayoutId,
      });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error ||
            "Test payout email could not be sent.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          "Test payout confirmation email sent successfully.",

        emailId:
          result.id,

        testData: {
          freelancer:
            "Test Freelancer",

          amount:
            "ZAR 9.00",

          paymentReference:
            "EMAIL-TEST-001",

          milestone:
            "Freelance Hub SA Test Milestone",

          note:
            "This is an email-only test. No payout record was changed.",
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected payout email test error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unexpected payout email test error.",
      },
      {
        status: 500,
      }
    );
  }
}