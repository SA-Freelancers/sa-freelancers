"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type MilestoneInfo = {
  id: string;
  title?: string;
  status?: string;
};

type Payout = {
  id: string;
  milestone_id: string;
  project_id: string;
  contract_id?: string | null;

  gross_amount: number;
  platform_fee: number;
  freelancer_amount: number;
  platform_fee_percent: number;

  status: string;

  payment_received_at?: string | null;
  approved_for_payout_at?: string | null;
  payout_requested_at?: string | null;
  paid_out_at?: string | null;

  created_at?: string;

  milestone?: MilestoneInfo | null;
};

type EarningsTotals = {
  held: number;
  available: number;
  requested: number;
  processing: number;
  paidOut: number;
  platformFees: number;
  totalEarned: number;
};

type EarningsResponse = {
  success?: boolean;

  totals?: EarningsTotals;

  payouts?: Payout[];

  error?: string;
};

type RequestPayoutResponse = {
  success?: boolean;
  error?: string;
};

export default function FreelancerEarningsPage() {
  const [payouts, setPayouts] =
    useState<Payout[]>([]);

  const [totals, setTotals] =
    useState<EarningsTotals>({
      held: 0,
      available: 0,
      requested: 0,
      processing: 0,
      paidOut: 0,
      platformFees: 0,
      totalEarned: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [
    requestingPayoutId,
    setRequestingPayoutId,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadEarnings();
  }, []);

  // ---------------------------------------------
  // LOAD EARNINGS THROUGH SECURE SERVER API
  // ---------------------------------------------

  const loadEarnings =
    async () => {
      setLoading(true);

      try {
        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (
          sessionError ||
          !sessionData.session
        ) {
          setMessage(
            "Please login first."
          );

          return;
        }

        const response =
          await fetch(
            "/api/payouts/earnings",
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

        const responseText =
          await response.text();

        let result:
          EarningsResponse = {};

        try {
          result =
            responseText
              ? JSON.parse(
                  responseText
                )
              : {};
        } catch {
          console.error(
            "Earnings API non-JSON response:",
            responseText
          );

          setMessage(
            `Unable to load earnings. Server error ${response.status}.`
          );

          return;
        }

        if (
          !response.ok ||
          !result.success
        ) {
          setMessage(
            result.error ||
              "Unable to load earnings."
          );

          return;
        }

        setPayouts(
          result.payouts ||
            []
        );

        setTotals(
          result.totals || {
            held: 0,
            available: 0,
            requested: 0,
            processing: 0,
            paidOut: 0,
            platformFees: 0,
            totalEarned: 0,
          }
        );
      } catch (error) {
        console.error(
          "Unexpected earnings page error:",
          error
        );

        setMessage(
          "Unable to load earnings."
        );
      } finally {
        setLoading(false);
      }
    };

  // ---------------------------------------------
  // REQUEST PAYOUT
  // ---------------------------------------------

  const requestPayout =
    async (
      payout: Payout
    ) => {
      setMessage("");

      if (
        payout.status !==
        "ready_for_payout"
      ) {
        setMessage(
          "This payout is not currently available."
        );

        return;
      }

      setRequestingPayoutId(
        payout.id
      );

      try {
        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (
          sessionError ||
          !sessionData.session
        ) {
          setMessage(
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            "/api/payouts/request",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${sessionData.session.access_token}`,
              },

              body:
                JSON.stringify({
                  payoutId:
                    payout.id,
                }),
            }
          );

        const responseText =
          await response.text();

        let result:
          RequestPayoutResponse =
            {};

        try {
          result =
            responseText
              ? JSON.parse(
                  responseText
                )
              : {};
        } catch {
          setMessage(
            `Server error (${response.status}).`
          );

          return;
        }

        if (
          !response.ok ||
          !result.success
        ) {
          setMessage(
            result.error ||
              "Unable to request payout."
          );

          return;
        }

        setMessage(
          "Payout requested successfully."
        );

        await loadEarnings();
      } catch (error) {
        console.error(
          "Unexpected payout request error:",
          error
        );

        setMessage(
          "Unable to request payout."
        );
      } finally {
        setRequestingPayoutId(
          null
        );
      }
    };

  // ---------------------------------------------
  // STATUS LABEL
  // ---------------------------------------------

  const getStatusLabel =
    (
      status: string
    ) => {
      switch (status) {
        case "held":
          return "Held";

        case "ready_for_payout":
          return "Ready for Payout";

        case "payout_requested":
          return "Payout Requested";

        case "processing":
          return "Processing";

        case "paid_out":
          return "Paid Out";

        case "cancelled":
          return "Cancelled";

        case "refunded":
          return "Refunded";

        default:
          return status;
      }
    };

  if (loading) {
    return (
      <LoadingSkeleton />
    );
  }

  return (
    <main className="dashboard-page">

      {/* HEADER */}

      <section className="dashboard-header">
        <p className="dashboard-badge">
          Freelancer Earnings
        </p>

        <h1>
          My Earnings
        </h1>

        <p>
          Track secured payments,
          available earnings and
          payout requests.
        </p>
      </section>

      {message && (
        <p className="upload-message">
          {message}
        </p>
      )}

      {/* SUMMARY */}

      <section
        className="dark-card"
        style={{
          marginBottom: 30,
        }}
      >
        <h2>
          Earnings Summary
        </h2>

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",

            gap: 15,

            marginTop: 20,
          }}
        >

          <SummaryCard
            label="Available for Payout"
            amount={
              totals.available
            }
          />

          <SummaryCard
            label="Held"
            amount={
              totals.held
            }
          />

          <SummaryCard
            label="Requested"
            amount={
              totals.requested
            }
          />

          <SummaryCard
            label="Processing"
            amount={
              totals.processing
            }
          />

          <SummaryCard
            label="Paid Out"
            amount={
              totals.paidOut
            }
          />

          <SummaryCard
            label="Total Earned"
            amount={
              totals.totalEarned
            }
          />

          <SummaryCard
            label="Platform Fees"
            amount={
              totals.platformFees
            }
          />

        </div>
      </section>

      {/* PAYMENT HISTORY */}

      <section>
        <h2
          style={{
            marginBottom: 18,
          }}
        >
          Payment History
        </h2>

        {payouts.length ===
        0 ? (
          <EmptyState
            emoji="💰"
            title="No earnings yet"
            description="Paid milestones will appear here."
          />
        ) : (
          <div className="contracts-grid">

            {payouts.map(
              (payout) => {
                const isRequesting =
                  requestingPayoutId ===
                  payout.id;

                return (
                  <div
                    key={
                      payout.id
                    }
                    className="dark-card contract-card"
                  >

                    <div className="contract-top">

                      <h2>
                        {payout
                          .milestone
                          ?.title ||
                          "Project Milestone"}
                      </h2>

                      <span
                        className={`contract-status ${payout.status}`}
                      >
                        {getStatusLabel(
                          payout.status
                        )}
                      </span>

                    </div>

                    <p>
                      <strong>
                        Gross Payment:
                      </strong>{" "}
                      ZAR{" "}
                      {Number(
                        payout.gross_amount ||
                          0
                      ).toFixed(
                        2
                      )}
                    </p>

                    <p>
                      <strong>
                        Platform Fee:
                      </strong>{" "}
                      ZAR{" "}
                      {Number(
                        payout.platform_fee ||
                          0
                      ).toFixed(
                        2
                      )}
                    </p>

                    <p>
                      <strong>
                        You Receive:
                      </strong>{" "}
                      ZAR{" "}
                      {Number(
                        payout.freelancer_amount ||
                          0
                      ).toFixed(
                        2
                      )}
                    </p>

                    {payout.payment_received_at && (
                      <p>
                        <strong>
                          Payment Received:
                        </strong>{" "}
                        {new Date(
                          payout.payment_received_at
                        ).toLocaleString()}
                      </p>
                    )}

                    {payout.approved_for_payout_at && (
                      <p>
                        <strong>
                          Approved for Payout:
                        </strong>{" "}
                        {new Date(
                          payout.approved_for_payout_at
                        ).toLocaleString()}
                      </p>
                    )}

                    {payout.payout_requested_at && (
                      <p>
                        <strong>
                          Requested:
                        </strong>{" "}
                        {new Date(
                          payout.payout_requested_at
                        ).toLocaleString()}
                      </p>
                    )}

                    {payout.paid_out_at && (
                      <p>
                        <strong>
                          Paid Out:
                        </strong>{" "}
                        {new Date(
                          payout.paid_out_at
                        ).toLocaleString()}
                      </p>
                    )}

                    {/* HELD */}

                    {payout.status ===
                      "held" && (
                      <div className="contract-actions">
                        <span className="contract-status pending">
                          Funds Secured —
                          Waiting for
                          Client Approval
                        </span>
                      </div>
                    )}

                    {/* READY */}

                    {payout.status ===
                      "ready_for_payout" && (
                      <div className="contract-actions">

                        <button
                          type="button"
                          disabled={
                            isRequesting
                          }
                          onClick={() =>
                            requestPayout(
                              payout
                            )
                          }
                          className="primary-action-btn"
                        >
                          {isRequesting
                            ? "Requesting..."
                            : `Request Payout — ZAR ${Number(
                                payout.freelancer_amount ||
                                  0
                              ).toFixed(
                                2
                              )}`}
                        </button>

                      </div>
                    )}

                    {/* REQUESTED */}

                    {payout.status ===
                      "payout_requested" && (
                      <div className="contract-actions">
                        <span className="contract-status pending">
                          Payout Request
                          Submitted
                        </span>
                      </div>
                    )}

                    {/* PROCESSING */}

                    {payout.status ===
                      "processing" && (
                      <div className="contract-actions">
                        <span className="contract-status approved">
                          Payout
                          Processing
                        </span>
                      </div>
                    )}

                    {/* PAID */}

                    {payout.status ===
                      "paid_out" && (
                      <div className="contract-actions">
                        <span className="contract-status completed">
                          Payment Sent
                        </span>
                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>
        )}
      </section>

    </main>
  );
}

function SummaryCard({
  label,
  amount,
}: {
  label: string;
  amount: number;
}) {
  return (
    <div className="dark-card">

      <p>
        {label}
      </p>

      <h2>
        ZAR{" "}
        {Number(
          amount || 0
        ).toFixed(2)}
      </h2>

    </div>
  );
}