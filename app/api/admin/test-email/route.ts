import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function GET() {
  try {
    const apiKey =
      process.env.RESEND_API_KEY;

    const fromEmail =
      process.env.RESEND_FROM_EMAIL;

    if (
      !apiKey ||
      !fromEmail
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing RESEND_API_KEY or RESEND_FROM_EMAIL.",
        },
        {
          status: 500,
        }
      );
    }

    const resend =
      new Resend(apiKey);

    const {
      data,
      error,
    } = await resend.emails.send({
      from:
        fromEmail,

      to: [
        "thabangkhosi1996@gmail.com",
      ],

      subject:
        "Freelance Hub SA Email Test",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
          "
        >
          <h1>
            Freelance Hub SA
          </h1>

          <h2>
            Email system is working ✅
          </h2>

          <p>
            This is a test email from the
            Freelance Hub SA payout notification system.
          </p>

          <p>
            If you received this email,
            Resend is configured correctly.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error(
        "Test email error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        emailId:
          data?.id,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected test email error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unexpected test email error.",
      },
      {
        status: 500,
      }
    );
  }
}