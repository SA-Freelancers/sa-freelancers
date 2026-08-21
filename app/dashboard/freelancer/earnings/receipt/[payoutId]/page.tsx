"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "@/app/lib/supabase";

type BankingDetails = {
  accountHolderName:
    string | null;

  bankName:
    string | null;

  accountNumberMasked:
    string | null;

  accountType:
    string | null;

  branchCode:
    string | null;
};

type Receipt = {
  payoutId: string;

  milestoneId:
    string | null;

  milestoneTitle:
    string;

  projectId:
    string | null;

  contractId:
    string | null;

  freelancerName:
    string;

  grossAmount:
    number;

  platformFee:
    number;

  freelancerAmount:
    number;

  platformFeePercent:
    number;

  payoutReference:
    string | null;

  paymentReceivedAt:
    string | null;

  approvedForPayoutAt:
    string | null;

  payoutRequestedAt:
    string | null;

  processingStartedAt:
    string | null;

  paidOutAt:
    string | null;

  bankingDetails:
    BankingDetails | null;
};

type ReceiptResponse = {
  success?: boolean;
  receipt?: Receipt;
  error?: string;
};

export default function PayoutReceiptPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const payoutId =
    typeof params.payoutId ===
    "string"
      ? params.payoutId
      : "";

  const [
    receipt,
    setReceipt,
  ] =
    useState<Receipt | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    if (payoutId) {
      loadReceipt();
    }
  }, [payoutId]);

  const loadReceipt =
    async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: sessionData,
          error:
            sessionError,
        } =
          await supabase.auth.getSession();

        if (
          sessionError ||
          !sessionData.session
        ) {
          setError(
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            `/api/payouts/receipt?payoutId=${encodeURIComponent(
              payoutId
            )}`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${sessionData.session.access_token}`,
              },

              cache:
                "no-store",
            }
          );

        const text =
          await response.text();

        let result:
          ReceiptResponse = {};

        try {
          result =
            text
              ? JSON.parse(
                  text
                )
              : {};
        } catch {
          setError(
            `Server returned an invalid response (${response.status}).`
          );

          return;
        }

        if (
          !response.ok ||
          !result.success ||
          !result.receipt
        ) {
          setError(
            result.error ||
              "Unable to load payout receipt."
          );

          return;
        }

        setReceipt(
          result.receipt
        );
      } catch (error) {
        console.error(
          "Receipt loading error:",
          error
        );

        setError(
          "Unable to load payout receipt."
        );
      } finally {
        setLoading(false);
      }
    };

  const money = (
    value: number
  ) =>
    `ZAR ${Number(
      value || 0
    ).toFixed(2)}`;

  const formatDate = (
    value:
      | string
      | null
      | undefined
  ) => {
    if (!value) {
      return "—";
    }

    return new Date(
      value
    ).toLocaleString(
      "en-ZA",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    );
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <h1>
          Payout Receipt
        </h1>

        <p>
          Loading receipt...
        </p>
      </main>
    );
  }

  if (
    error ||
    !receipt
  ) {
    return (
      <main className="dashboard-page">

        <section className="dark-card">
          <h1>
            Payout Receipt
          </h1>

          <p>
            {error ||
              "Receipt not found."}
          </p>

          <button
            type="button"
            className="primary-action-btn"
            style={{
              marginTop: 20,
            }}
            onClick={() =>
              router.push(
                "/dashboard/freelancer/earnings"
              )
            }
          >
            Back to My Earnings
          </button>
        </section>

      </main>
    );
  }

  return (
    <main
      className="dashboard-page"
      style={{
        maxWidth:
          1000,

        margin:
          "0 auto",
      }}
    >

      {/* PAGE ACTIONS */}

      <div
        className="receipt-actions"
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          gap: 12,

          flexWrap:
            "wrap",

          marginBottom:
            20,
        }}
      >
        <button
          type="button"
          className="secondary-action-btn"
          onClick={() =>
            router.push(
              "/dashboard/freelancer/earnings"
            )
          }
        >
          ← Back to Earnings
        </button>

        <button
          type="button"
          className="primary-action-btn"
          onClick={() =>
            window.print()
          }
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* RECEIPT */}

      <section
        id="payout-receipt"
        style={{
          background:
            "#ffffff",

          color:
            "#111827",

          borderRadius:
            14,

          overflow:
            "hidden",

          boxShadow:
            "0 12px 35px rgba(0,0,0,0.18)",
        }}
      >

        {/* TOP */}

        <div
          style={{
            padding:
              "32px 36px",

            borderBottom:
              "4px solid #22c55e",
          }}
        >
          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "flex-start",

              gap: 20,

              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin:
                    0,

                  fontSize:
                    30,

                  color:
                    "#111827",
                }}
              >
                Freelance Hub SA
              </h1>

              <p
  className="receipt-muted"
  style={{
    margin: "6px 0 0",
  }}
>
  Trusted Work
</p>
            </div>

            <div
              style={{
                textAlign:
                  "right",
              }}
            >
              <h2
                style={{
                  margin:
                    0,

                  fontSize:
                    24,
                }}
              >
                Payout Receipt
              </h2>

              <p
  className="receipt-paid"
  style={{
    margin: "6px 0 0",
  }}
>
  ✓ PAID
</p>
            </div>
          </div>
        </div>

        {/* RECEIPT INFO */}

        <div
          style={{
            padding:
              "28px 36px",
          }}
        >
          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap:
                24,

              marginBottom:
                30,
            }}
          >
            <ReceiptInfo
              label="Freelancer"
              value={
                receipt.freelancerName
              }
            />

            <ReceiptInfo
              label="Paid Date"
              value={
                formatDate(
                  receipt.paidOutAt
                )
              }
            />

            <ReceiptInfo
              label="Payment Reference"
              value={
                receipt.payoutReference ||
                "—"
              }
            />

            <ReceiptInfo
              label="Payout ID"
              value={
                receipt.payoutId
              }
            />
          </div>

          {/* PROJECT */}

          <div
            style={{
              padding:
                20,

              border:
                "1px solid #e5e7eb",

              borderRadius:
                10,

              marginBottom:
                28,
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 14px",
              }}
            >
              Project / Milestone
            </h3>

            <p
              style={{
                margin:
                  "6px 0",
              }}
            >
              <strong>
                Milestone:
              </strong>{" "}
              {
                receipt.milestoneTitle
              }
            </p>

            <p
              style={{
                margin:
                  "6px 0",
              }}
            >
              <strong>
                Milestone ID:
              </strong>{" "}
              {
                receipt.milestoneId ||
                "—"
              }
            </p>

            <p
              style={{
                margin:
                  "6px 0",
              }}
            >
              <strong>
                Contract ID:
              </strong>{" "}
              {
                receipt.contractId ||
                "—"
              }
            </p>
          </div>

          {/* PAYMENT BREAKDOWN */}

          <div
            style={{
              marginBottom:
                28,
            }}
          >
            <h3
              style={{
                marginBottom:
                  14,
              }}
            >
              Payment Breakdown
            </h3>

            <div
              style={{
                border:
                  "1px solid #e5e7eb",

                borderRadius:
                  10,

                overflow:
                  "hidden",
              }}
            >
              <ReceiptRow
                label="Gross Client Payment"
                value={
                  money(
                    receipt.grossAmount
                  )
                }
              />

              <ReceiptRow
                label={`Freelance Hub SA Platform Fee (${Number(
                  receipt.platformFeePercent ||
                    0
                ).toFixed(
                  2
                )}%)`}
                value={`- ${money(
                  receipt.platformFee
                )}`}
              />

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  gap:
                    20,

                  padding:
                    "18px 20px",

                  background:
                    "#f3f4f6",

                  fontSize:
                    19,

                  fontWeight:
                    700,
                }}
              >
                <span>
                  Net Amount Paid
                </span>

                <span>
                  {money(
                    receipt.freelancerAmount
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* DESTINATION */}

          {receipt.bankingDetails && (
            <div
              style={{
                padding:
                  20,

                border:
                  "1px solid #e5e7eb",

                borderRadius:
                  10,

                marginBottom:
                  28,
              }}
            >
              <h3
                style={{
                  margin:
                    "0 0 14px",
                }}
              >
                Payout Destination
              </h3>

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(190px, 1fr))",

                  gap:
                    18,
                }}
              >
                <ReceiptInfo
                  label="Account Holder"
                  value={
                    receipt
                      .bankingDetails
                      .accountHolderName ||
                    "—"
                  }
                />

                <ReceiptInfo
                  label="Bank"
                  value={
                    receipt
                      .bankingDetails
                      .bankName ||
                    "—"
                  }
                />

                <ReceiptInfo
                  label="Account"
                  value={
                    receipt
                      .bankingDetails
                      .accountNumberMasked ||
                    "—"
                  }
                />

                <ReceiptInfo
                  label="Account Type"
                  value={
                    receipt
                      .bankingDetails
                      .accountType ||
                    "—"
                  }
                />

                <ReceiptInfo
                  label="Branch Code"
                  value={
                    receipt
                      .bankingDetails
                      .branchCode ||
                    "—"
                  }
                />
              </div>
            </div>
          )}

          {/* TIMELINE */}

          <div
            style={{
              padding:
                20,

              border:
                "1px solid #e5e7eb",

              borderRadius:
                10,

              marginBottom:
                28,
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 14px",
              }}
            >
              Payout Timeline
            </h3>

            <ReceiptTimeline
              label="Client Payment Received"
              value={
                formatDate(
                  receipt.paymentReceivedAt
                )
              }
            />

            <ReceiptTimeline
              label="Approved for Payout"
              value={
                formatDate(
                  receipt.approvedForPayoutAt
                )
              }
            />

            <ReceiptTimeline
              label="Payout Requested"
              value={
                formatDate(
                  receipt.payoutRequestedAt
                )
              }
            />

            <ReceiptTimeline
              label="Processing Started"
              value={
                formatDate(
                  receipt.processingStartedAt
                )
              }
            />

            <ReceiptTimeline
              label="Payment Sent"
              value={
                formatDate(
                  receipt.paidOutAt
                )
              }
            />
          </div>

          {/* FOOTER */}

          <div
            style={{
              borderTop:
                "1px solid #e5e7eb",

              paddingTop:
                20,

              color:
                "#6b7280",

              fontSize:
                13,

              lineHeight:
                1.6,
            }}
          >
            <p
              style={{
                margin:
                  "0 0 5px",
              }}
            >
              This receipt confirms
              that Freelance Hub SA
              recorded the freelancer
              payout shown above as
              completed.
            </p>

            <p
              style={{
                margin:
                  0,
              }}
            >
              Keep this receipt for
              your records.
            </p>
          </div>
        </div>

      </section>

      {/* PRINT CSS */}

      <style jsx global>{`
  /* ================================================
     PAYOUT RECEIPT

     The receipt is intentionally always light.
     Global website dark-mode styles must not
     override the document.
     ================================================ */

  #payout-receipt {
    background: #ffffff !important;
    color: #111827 !important;
  }

  #payout-receipt * {
    color: #111827;
  }

  #payout-receipt h1,
  #payout-receipt h2,
  #payout-receipt h3,
  #payout-receipt h4,
  #payout-receipt strong {
    color: #111827 !important;
  }

  #payout-receipt p,
  #payout-receipt span,
  #payout-receipt div {
    color: inherit;
  }

  /* Secondary / label text */

  #payout-receipt .receipt-muted {
    color: #6b7280 !important;
  }

  /* PAID status */

  #payout-receipt .receipt-paid {
    color: #16a34a !important;
    font-weight: 700;
  }

  /* Keep receipt readable when website uses dark mode */

  html.dark #payout-receipt,
  body.dark #payout-receipt,
  [data-theme="dark"] #payout-receipt {
    background: #ffffff !important;
    color: #111827 !important;
  }

  html.dark #payout-receipt *,
  body.dark #payout-receipt *,
  [data-theme="dark"] #payout-receipt * {
    color: #111827;
  }

  /* ================================================
     PRINT / SAVE AS PDF
     ================================================ */

  @media print {
    body {
      background: #ffffff !important;
    }

    header,
    nav,
    aside,
    footer,
    .dashboard-sidebar,
    .receipt-actions {
      display: none !important;
    }

    .dashboard-page {
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
      width: 100% !important;
    }

    #payout-receipt {
      background: #ffffff !important;
      color: #111827 !important;

      box-shadow: none !important;
      border-radius: 0 !important;

      width: 100% !important;
      max-width: none !important;
    }

    #payout-receipt * {
      color: #111827 !important;

      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    #payout-receipt .receipt-muted {
      color: #6b7280 !important;
    }

    #payout-receipt .receipt-paid {
      color: #16a34a !important;
    }

    @page {
      size: A4;
      margin: 12mm;
    }
  }
`}</style>

    </main>
  );
}

function ReceiptInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p
        style={{
          margin:
            "0 0 5px",

          fontSize:
            12,

          textTransform:
            "uppercase",

          color:
            "#6b7280",

          letterSpacing:
            "0.04em",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin:
            0,

          fontWeight:
            600,

          wordBreak:
            "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display:
          "flex",

        justifyContent:
          "space-between",

        gap:
          20,

        padding:
          "14px 20px",

        borderBottom:
          "1px solid #e5e7eb",
      }}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function ReceiptTimeline({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display:
          "flex",

        justifyContent:
          "space-between",

        gap:
          20,

        flexWrap:
          "wrap",

        padding:
          "8px 0",
      }}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}