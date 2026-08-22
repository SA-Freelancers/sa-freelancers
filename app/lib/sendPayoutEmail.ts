import { Resend } from "resend";

type SendPayoutEmailArgs = {
  to: string;

  freelancerName: string;

  amount: number;

  paymentReference: string;

  milestoneTitle: string;

  paidOutAt: string;

  payoutId: string;
};

export async function sendPayoutEmail({
  to,
  freelancerName,
  amount,
  paymentReference,
  milestoneTitle,
  paidOutAt,
  payoutId,
}: SendPayoutEmailArgs) {
  const apiKey =
    process.env.RESEND_API_KEY;

  const fromEmail =
    process.env.RESEND_FROM_EMAIL;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL;

  // --------------------------------------------------
  // DO NOT BREAK PAYOUT IF EMAIL IS NOT CONFIGURED
  // --------------------------------------------------

  if (
    !apiKey ||
    !fromEmail ||
    !siteUrl
  ) {
    console.error(
      "Payout email skipped: email environment variables are missing."
    );

    return {
      success: false,
      error:
        "Email service is not configured.",
    };
  }

  const resend =
    new Resend(apiKey);

  const receiptUrl =
    `${siteUrl.replace(
      /\/$/,
      ""
    )}/dashboard/freelancer/earnings/receipt/${encodeURIComponent(
      payoutId
    )}`;

  const formattedAmount =
    `ZAR ${Number(
      amount || 0
    ).toFixed(2)}`;

  const formattedDate =
    new Date(
      paidOutAt
    ).toLocaleString(
      "en-ZA",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    );

  const safeName =
    freelancerName ||
    "Freelancer";

  // --------------------------------------------------
  // SEND EMAIL
  // --------------------------------------------------

  try {
    const {
      data,
      error,
    } = await resend.emails.send({
      from:
        fromEmail,

      to: [to],

      subject:
        `Your Freelance Hub SA payout of ${formattedAmount} has been sent`,

      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <title>
              Freelance Hub SA Payout
            </title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background: #f3f4f6;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
            "
          >
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                background: #f3f4f6;
                padding: 30px 15px;
              "
            >
              <tr>
                <td align="center">

                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                      max-width: 640px;
                      background: #ffffff;
                      border-radius: 14px;
                      overflow: hidden;
                    "
                  >

                    <tr>
                      <td
                        style="
                          padding: 28px 32px;
                          border-bottom: 4px solid #22c55e;
                        "
                      >
                        <h1
                          style="
                            margin: 0;
                            font-size: 26px;
                            color: #111827;
                          "
                        >
                          Freelance Hub SA
                        </h1>

                        <p
                          style="
                            margin: 6px 0 0;
                            color: #6b7280;
                            font-size: 14px;
                          "
                        >
                          Trusted Work
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 32px;
                        "
                      >
                        <p
                          style="
                            margin: 0 0 18px;
                            font-size: 16px;
                          "
                        >
                          Hi ${escapeHtml(
                            safeName
                          )},
                        </p>

                        <h2
                          style="
                            margin: 0 0 12px;
                            font-size: 24px;
                            color: #16a34a;
                          "
                        >
                          Your payout has been sent
                        </h2>

                        <p
                          style="
                            margin: 0 0 24px;
                            color: #4b5563;
                            line-height: 1.6;
                          "
                        >
                          Your freelancer payout has been
                          processed and recorded as paid
                          by Freelance Hub SA.
                        </p>

                        <table
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                          style="
                            border: 1px solid #e5e7eb;
                            border-radius: 10px;
                            margin-bottom: 26px;
                          "
                        >

                          <tr>
                            <td
                              style="
                                padding: 13px 16px;
                                color: #6b7280;
                              "
                            >
                              Amount Paid
                            </td>

                            <td
                              align="right"
                              style="
                                padding: 13px 16px;
                                font-weight: bold;
                              "
                            >
                              ${escapeHtml(
                                formattedAmount
                              )}
                            </td>
                          </tr>

                          <tr>
                            <td
                              style="
                                padding: 13px 16px;
                                color: #6b7280;
                                border-top: 1px solid #e5e7eb;
                              "
                            >
                              Milestone
                            </td>

                            <td
                              align="right"
                              style="
                                padding: 13px 16px;
                                font-weight: bold;
                                border-top: 1px solid #e5e7eb;
                              "
                            >
                              ${escapeHtml(
                                milestoneTitle
                              )}
                            </td>
                          </tr>

                          <tr>
                            <td
                              style="
                                padding: 13px 16px;
                                color: #6b7280;
                                border-top: 1px solid #e5e7eb;
                              "
                            >
                              Payment Reference
                            </td>

                            <td
                              align="right"
                              style="
                                padding: 13px 16px;
                                font-weight: bold;
                                border-top: 1px solid #e5e7eb;
                              "
                            >
                              ${escapeHtml(
                                paymentReference
                              )}
                            </td>
                          </tr>

                          <tr>
                            <td
                              style="
                                padding: 13px 16px;
                                color: #6b7280;
                                border-top: 1px solid #e5e7eb;
                              "
                            >
                              Paid Date
                            </td>

                            <td
                              align="right"
                              style="
                                padding: 13px 16px;
                                font-weight: bold;
                                border-top: 1px solid #e5e7eb;
                              "
                            >
                              ${escapeHtml(
                                formattedDate
                              )}
                            </td>
                          </tr>
                        </table>

                        <table
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                        >
                          <tr>
                            <td
                              bgcolor="#16a34a"
                              style="
                                border-radius: 8px;
                              "
                            >
                              <a
                                href="${escapeHtml(
                                  receiptUrl
                                )}"
                                style="
                                  display: inline-block;
                                  padding: 13px 22px;
                                  color: #ffffff;
                                  text-decoration: none;
                                  font-weight: bold;
                                "
                              >
                                View Payout Receipt
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p
                          style="
                            margin: 28px 0 0;
                            color: #6b7280;
                            font-size: 13px;
                            line-height: 1.6;
                          "
                        >
                          Keep your payout receipt and
                          payment reference for your
                          records.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding: 20px 32px;
                          background: #f9fafb;
                          border-top: 1px solid #e5e7eb;
                        "
                      >
                        <p
                          style="
                            margin: 0;
                            color: #6b7280;
                            font-size: 12px;
                          "
                        >
                          Freelance Hub SA • Trusted Work
                        </p>
                      </td>
                    </tr>

                  </table>

                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error(
        "Resend payout email error:",
        error
      );

      return {
        success: false,
        error:
          error.message,
      };
    }

    console.log(
      "Payout confirmation email sent:",
      data?.id
    );

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    console.error(
      "Unexpected payout email error:",
      error
    );

    return {
      success: false,
      error:
        "Unexpected email error.",
    };
  }
}

// --------------------------------------------------
// BASIC HTML ESCAPING
// --------------------------------------------------

function escapeHtml(
  value: string
) {
  return String(
    value || ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}