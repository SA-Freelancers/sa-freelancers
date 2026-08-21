"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type BankingDetails = {
  accountHolderName: string | null;
  bankName: string | null;
  accountNumberMasked: string | null;
  accountType: string | null;
  branchCode: string | null;
};

type Receipt = {
  payoutId: string;
  milestoneId: string | null;
  milestoneTitle: string;
  projectId: string | null;
  contractId: string | null;
  freelancerName: string;
  grossAmount: number;
  platformFee: number;
  freelancerAmount: number;
  platformFeePercent: number;
  payoutReference: string | null;
  paymentReceivedAt: string | null;
  approvedForPayoutAt: string | null;
  payoutRequestedAt: string | null;
  processingStartedAt: string | null;
  paidOutAt: string | null;
  bankingDetails: BankingDetails | null;
};

type ReceiptResponse = {
  success?: boolean;
  receipt?: Receipt;
  error?: string;
};

export default function PayoutReceiptPage() {
  const params = useParams();
  const router = useRouter();

  const payoutId =
    typeof params.payoutId === "string"
      ? params.payoutId
      : "";

  const [receipt, setReceipt] =
    useState<Receipt | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (payoutId) {
      loadReceipt();
    }
  }, [payoutId]);

  const loadReceipt = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        setError(
          "Please login again."
        );
        return;
      }

      const response = await fetch(
        `/api/payouts/receipt?payoutId=${encodeURIComponent(
          payoutId
        )}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${sessionData.session.access_token}`,
          },

          cache: "no-store",
        }
      );

      const text =
        await response.text();

      let result: ReceiptResponse =
        {};

      try {
        result = text
          ? JSON.parse(text)
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
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  /*
   * Generate a permanent readable remittance
   * number from the payout UUID.
   *
   * The same payout will always generate
   * the same remittance number.
   */
  const getReceiptNumber = (
    id: string
  ) => {
    const shortId = id
      .replace(/-/g, "")
      .slice(0, 10)
      .toUpperCase();

    return `FHSA-REM-${shortId}`;
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

  const receiptNumber =
    getReceiptNumber(
      receipt.payoutId
    );

  return (
    <main
      className="dashboard-page"
      style={{
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      {/* =====================================
          PAGE ACTIONS
          ===================================== */}

      <div
        className="receipt-actions"
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
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

      {/* =====================================
          REMITTANCE DOCUMENT
          ===================================== */}

      <section
        id="payout-receipt"
        style={{
          background: "#ffffff",
          color: "#111827",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 12px 35px rgba(0,0,0,0.18)",
        }}
      >
        {/* ===================================
            DOCUMENT HEADER
            =================================== */}

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
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div
  className="receipt-brand"
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  }}
>
  <Image
    src="/freelancehubsa-navbar-dark.png"
    alt="Freelance Hub SA"
    width={430}
    height={100}
    priority
    className="receipt-logo"
    style={{
      width: "250px",
      height: "auto",
      objectFit: "contain",
    }}
  />

  <p
    className="receipt-muted"
    style={{
      margin: "10px 0 0",
      fontSize: 12,
    }}
  >
    Freelancer Marketplace & Payment Platform
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
                  margin: 0,
                  fontSize: 25,
                  fontWeight: 800,
                }}
              >
                Remittance Advice
              </h2>

              <p
                className="receipt-paid"
                style={{
                  margin:
                    "7px 0 10px",
                }}
              >
                ✓ PAYMENT COMPLETED
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                }}
              >
                <strong>
                  Receipt No:
                </strong>{" "}
                {receiptNumber}
              </p>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  fontSize: 13,
                }}
              >
                <strong>
                  Payment Date:
                </strong>{" "}
                {formatDate(
                  receipt.paidOutAt
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================
            DOCUMENT CONTENT
            =================================== */}

        <div
          style={{
            padding:
              "28px 36px",
          }}
        >
          {/* SUMMARY */}

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",

              gap: 24,

              marginBottom: 30,
            }}
          >
            <ReceiptInfo
              label="Freelancer"
              value={
                receipt.freelancerName
              }
            />

            <ReceiptInfo
              label="Remittance Number"
              value={
                receiptNumber
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

          {/* =================================
              PROJECT / MILESTONE
              ================================= */}

          <div
            className="receipt-section"
          >
            <h3>
              Project / Milestone
            </h3>

            <p>
              <strong>
                Milestone:
              </strong>{" "}
              {
                receipt.milestoneTitle
              }
            </p>

            <p>
              <strong>
                Milestone ID:
              </strong>{" "}
              {receipt.milestoneId ||
                "—"}
            </p>

            <p>
              <strong>
                Contract ID:
              </strong>{" "}
              {receipt.contractId ||
                "—"}
            </p>
          </div>

          {/* =================================
              PAYMENT BREAKDOWN
              ================================= */}

          <div
            style={{
              marginBottom: 28,
            }}
          >
            <h3
              style={{
                marginBottom: 14,
              }}
            >
              Payment Breakdown
            </h3>

            <div
              style={{
                border:
                  "1px solid #e5e7eb",
                borderRadius: 10,
                overflow: "hidden",
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
                className="receipt-total"
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

          {/* =================================
              PAYOUT DESTINATION
              ================================= */}

          {receipt.bankingDetails && (
            <div
              className="receipt-section"
            >
              <h3>
                Payout Destination
              </h3>

              <div
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(170px, 1fr))",

                  gap: 18,
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

          {/* =================================
              PAYOUT TIMELINE
              ================================= */}

          <div
            className="receipt-section"
          >
            <h3>
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

          {/* =================================
              DOCUMENT FOOTER
              ================================= */}

          <div
            style={{
              borderTop:
                "1px solid #e5e7eb",

              paddingTop: 22,

              marginTop: 10,
            }}
          >
            <div
              style={{
                display: "flex",

                justifyContent:
                  "space-between",

                gap: 24,

                flexWrap:
                  "wrap",
              }}
            >
              <div
                style={{
                  maxWidth: 620,
                }}
              >
                <p
                  style={{
                    margin:
                      "0 0 8px",

                    fontWeight:
                      700,
                  }}
                >
                  Payment Confirmation
                </p>

                <p
                  className="receipt-muted"
                  style={{
                    margin: 0,

                    fontSize:
                      13,

                    lineHeight:
                      1.6,
                  }}
                >
                  This remittance advice
                  confirms that Freelance
                  Hub SA recorded the
                  freelancer payout shown
                  above as completed. The
                  payment reference shown
                  on this document should
                  be used when reconciling
                  the payment with the
                  receiving bank account.
                </p>
              </div>

              <div
                style={{
                  textAlign:
                    "right",
                }}
              >
                <p
                  className="receipt-muted"
                  style={{
                    margin: 0,
                    fontSize: 12,
                  }}
                >
                  Document Reference
                </p>

                <strong
                  style={{
                    fontSize: 13,
                  }}
                >
                  {receiptNumber}
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop: 24,

                paddingTop: 16,

                borderTop:
                  "1px solid #e5e7eb",

                display: "flex",

                justifyContent:
                  "space-between",

                gap: 12,

                flexWrap:
                  "wrap",

                fontSize: 11,
              }}
            >
              <span className="receipt-muted">
                Freelance Hub SA •
                Trusted Work
              </span>

              <span className="receipt-muted">
                Generated electronically
                — no signature required
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          RECEIPT + PRINT STYLING
          ===================================== */}

      <style jsx global>{`
  /* =========================================
     BASE RECEIPT
     ========================================= */

  #payout-receipt {
    background: #ffffff !important;
    color: #111827 !important;
  }

  #payout-receipt * {
    box-sizing: border-box;
  }

  #payout-receipt h1,
  #payout-receipt h2,
  #payout-receipt h3,
  #payout-receipt h4,
  #payout-receipt p,
  #payout-receipt span,
  #payout-receipt div,
  #payout-receipt strong {
    color: #111827;
  }

  #payout-receipt h1,
  #payout-receipt h2,
  #payout-receipt h3,
  #payout-receipt h4,
  #payout-receipt strong {
    color: #111827 !important;
  }

  /* =========================================
     LOGO / BRAND
     ========================================= */

  #payout-receipt .receipt-brand {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 250px;
  }

  #payout-receipt .receipt-logo {
    display: block !important;

    width: 250px !important;
    height: auto !important;

    max-width: 100% !important;

    object-fit: contain !important;

    object-position: left center !important;
  }

  /* =========================================
     MUTED TEXT
     ========================================= */

  #payout-receipt .receipt-muted {
    color: #6b7280 !important;
  }

  /* =========================================
     PAYMENT STATUS
     ========================================= */

  #payout-receipt .receipt-paid {
    color: #16a34a !important;
    font-weight: 800;
  }

  /* =========================================
     RECEIPT SECTIONS
     ========================================= */

  #payout-receipt .receipt-section {
    padding: 20px;

    border:
      1px solid #e5e7eb;

    border-radius: 10px;

    margin-bottom: 28px;

    background:
      #ffffff !important;
  }

  #payout-receipt
    .receipt-section
    h3 {
    margin: 0 0 14px;

    font-size: 18px;
  }

  #payout-receipt
    .receipt-section
    p {
    margin: 6px 0;
  }

  /* =========================================
     NET PAYOUT TOTAL
     ========================================= */

  #payout-receipt .receipt-total {
    display: flex;

    justify-content:
      space-between;

    align-items: center;

    gap: 20px;

    padding:
      18px 20px;

    background:
      #f3f4f6 !important;

    font-size: 19px;

    font-weight: 800;
  }

  /* =========================================
     DARK MODE PROTECTION

     The website may be dark, but the
     remittance document must remain white.
     ========================================= */

  html.dark #payout-receipt,
  body.dark #payout-receipt,
  [data-theme="dark"]
    #payout-receipt {
    background:
      #ffffff !important;

    color:
      #111827 !important;
  }

  html.dark
    #payout-receipt *,
  body.dark
    #payout-receipt *,
  [data-theme="dark"]
    #payout-receipt * {
    color: #111827;
  }

  html.dark
    #payout-receipt
    .receipt-muted,
  body.dark
    #payout-receipt
    .receipt-muted,
  [data-theme="dark"]
    #payout-receipt
    .receipt-muted {
    color:
      #6b7280 !important;
  }

  html.dark
    #payout-receipt
    .receipt-paid,
  body.dark
    #payout-receipt
    .receipt-paid,
  [data-theme="dark"]
    #payout-receipt
    .receipt-paid {
    color:
      #16a34a !important;
  }

  /* =========================================
     MOBILE
     ========================================= */

  @media (max-width: 700px) {
    #payout-receipt {
      border-radius:
        10px !important;
    }

    #payout-receipt
      > div:first-child {
      padding:
        24px 20px !important;
    }

    #payout-receipt
      > div:nth-child(2) {
      padding:
        24px 20px !important;
    }

    #payout-receipt
      .receipt-brand {
      min-width: 0;

      width: 100%;
    }

    #payout-receipt
      .receipt-logo {
      width:
        210px !important;

      max-width:
        100% !important;

      height:
        auto !important;
    }

    #payout-receipt
      .receipt-total {
      font-size: 17px;
    }
  }

  /* =========================================
     PRINT / SAVE AS PDF
     ========================================= */

  @media print {
    html,
    body {
      background:
        #ffffff !important;
    }

    header,
    nav,
    aside,
    footer,
    .dashboard-sidebar,
    .receipt-actions {
      display:
        none !important;
    }

    .dashboard-page {
      margin:
        0 !important;

      padding:
        0 !important;

      max-width:
        none !important;

      width:
        100% !important;
    }

    #payout-receipt {
      background:
        #ffffff !important;

      color:
        #111827 !important;

      box-shadow:
        none !important;

      border-radius:
        0 !important;

      width:
        100% !important;

      max-width:
        none !important;
    }

    #payout-receipt * {
      color:
        #111827 !important;

      -webkit-print-color-adjust:
        exact !important;

      print-color-adjust:
        exact !important;
    }

    /* Keep grey secondary text */

    #payout-receipt
      .receipt-muted {
      color:
        #6b7280 !important;
    }

    /* Keep payment status green */

    #payout-receipt
      .receipt-paid {
      color:
        #16a34a !important;
    }

    /* Logo */

    #payout-receipt
      .receipt-logo {
      display:
        block !important;

      width:
        220px !important;

      height:
        auto !important;

      max-width:
        220px !important;

      object-fit:
        contain !important;

      object-position:
        left center !important;

      -webkit-print-color-adjust:
        exact !important;

      print-color-adjust:
        exact !important;
    }

    #payout-receipt
      .receipt-brand {
      min-width:
        220px !important;
    }

    /* Preserve total background */

    #payout-receipt
      .receipt-total {
      background:
        #f3f4f6 !important;
    }

    /* Try to keep each section
       together on the same page */

    #payout-receipt
      .receipt-section {
      break-inside:
        avoid;

      page-break-inside:
        avoid;
    }

    /* Keep payment breakdown together */

    #payout-receipt
      .receipt-total {
      break-inside:
        avoid;

      page-break-inside:
        avoid;
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

/* ===========================================
   RECEIPT INFO
   =========================================== */

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
        className="receipt-muted"
        style={{
          margin:
            "0 0 5px",

          fontSize: 12,

          textTransform:
            "uppercase",

          letterSpacing:
            "0.04em",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,

          fontWeight: 600,

          wordBreak:
            "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

/* ===========================================
   PAYMENT ROW
   =========================================== */

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
        display: "flex",

        justifyContent:
          "space-between",

        gap: 20,

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

/* ===========================================
   PAYOUT TIMELINE ROW
   =========================================== */

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
        display: "flex",

        justifyContent:
          "space-between",

        gap: 20,

        flexWrap:
          "wrap",

        padding:
          "8px 0",

        borderBottom:
          "1px solid #f3f4f6",
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