"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Payout = {
  id: string;
  milestone_id: string;
  project_id: string;
  contract_id?: string | null;
  freelancer_id: string;
  client_id: string;

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
};

type Milestone = {
  id: string;
  title?: string;
  status?: string;
};

type RequestPayoutResponse = {
  success?: boolean;
  payoutId?: string;
  milestoneId?: string;
  status?: string;
  freelancerAmount?: number;
  payoutRequestedAt?: string;
  error?: string;
};

export default function FreelancerEarningsPage() {
  const [payouts, setPayouts] =
    useState<Payout[]>([]);

  const [milestones, setMilestones] =
    useState<Record<string, Milestone>>({});

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [
    requestingPayoutId,
    setRequestingPayoutId,
  ] = useState<string | null>(null);

  useEffect(() => {
    loadEarnings();
  }, []);

  // --------------------------------------------------
  // LOAD EARNINGS
  // --------------------------------------------------

  const loadEarnings = async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        setMessage(
          "Please login first."
        );

        return;
      }

      // ----------------------------------------------
      // LOAD PAYOUTS
      // ----------------------------------------------

      const {
        data: payoutData,
        error: payoutError,
      } = await supabase
        .from("freelancer_payouts")
        .select(
          `
          id,
          milestone_id,
          project_id,
          contract_id,
          freelancer_id,
          client_id,
          gross_amount,
          platform_fee,
          freelancer_amount,
          platform_fee_percent,
          status,
          payment_received_at,
          approved_for_payout_at,
          payout_requested_at,
          paid_out_at,
          created_at
          `
        )
        .eq(
          "freelancer_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (payoutError) {
        console.error(
          "Earnings loading error:",
          payoutError
        );

        setMessage(
          "Unable to load your earnings."
        );

        return;
      }

      const loadedPayouts =
        (payoutData as Payout[]) ||
        [];

      setPayouts(
        loadedPayouts
      );

      // ----------------------------------------------
      // LOAD MILESTONE TITLES
      // ----------------------------------------------

      const milestoneIds =
        loadedPayouts.map(
          (payout) =>
            payout.milestone_id
        );

      if (
        milestoneIds.length >
        0
      ) {
        const {
          data: milestoneData,
          error: milestoneError,
        } = await supabase
          .from("milestones")
          .select(
            `
            id,
            title,
            status
            `
          )
          .in(
            "id",
            milestoneIds
          );

        if (milestoneError) {
          console.error(
            "Milestone title loading error:",
            milestoneError
          );
        }

        const map:
          Record<
            string,
            Milestone
          > = {};

        (
          (milestoneData as Milestone[]) ||
          []
        ).forEach(
          (milestone) => {
            map[
              milestone.id
            ] = milestone;
          }
        );

        setMilestones(map);
      } else {
        setMilestones({});
      }
    } catch (error) {
      console.error(
        "Unexpected earnings loading error:",
        error
      );

      setMessage(
        "An unexpected error occurred while loading your earnings."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // TOTALS
  // --------------------------------------------------

  const totals =
    useMemo(() => {
      let held = 0;
      let available = 0;
      let requested = 0;
      let processing = 0;
      let paidOut = 0;
      let platformFees = 0;
      let totalEarned = 0;

      for (
        const payout of payouts
      ) {
        const freelancerAmount =
          Number(
            payout.freelancer_amount ||
              0
          );

        const platformFee =
          Number(
            payout.platform_fee ||
              0
          );

        totalEarned +=
          freelancerAmount;

        platformFees +=
          platformFee;

        switch (
          payout.status
        ) {
          case "held":
            held +=
              freelancerAmount;
            break;

          case "ready_for_payout":
            available +=
              freelancerAmount;
            break;

          case "payout_requested":
            requested +=
              freelancerAmount;
            break;

          case "processing":
            processing +=
              freelancerAmount;
            break;

          case "paid_out":
            paidOut +=
              freelancerAmount;
            break;

          default:
            break;
        }
      }

      return {
        held,
        available,
        requested,
        processing,
        paidOut,
        platformFees,
        totalEarned,
      };
    }, [payouts]);

  // --------------------------------------------------
  // REQUEST PAYOUT
  // --------------------------------------------------

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
          "This payout is not currently available for withdrawal."
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
            "Your login session could not be verified. Please login again."
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
          console.error(
            "Payout request non-JSON response:",
            responseText
          );

          setMessage(
            `Server error (${response.status}).`
          );

          return;
        }

        if (
          !response.ok
        ) {
          setMessage(
            result.error ||
              "Unable to request payout."
          );

          return;
        }

        if (
          !result.success
        ) {
          setMessage(
            "The payout request could not be confirmed."
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
          "Unable to request payout. Please try again."
        );
      } finally {
        setRequestingPayoutId(
          null
        );
      }
    };

  // --------------------------------------------------
  // STATUS LABEL
  // --------------------------------------------------

  const payoutStatusLabel =
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

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <LoadingSkeleton />
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

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

      {/* MESSAGE */}

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

          <div className="dark-card">
            <p>
              Available for Payout
            </p>

            <h2>
              ZAR{" "}
              {totals.available.toFixed(
                2
              )}
            </h2>
          </div>

          <div className="dark-card">
            <p>
              Held
            </p>

            <h2>
              ZAR{" "}
              {totals.held.toFixed(
                2
              )}
            </h2>
          </div>

          <div className="dark-card">
            <p>
              Requested
            </p>

            <h2>
              ZAR{" "}
              {totals.requested.toFixed(
                2
              )}
            </h2>
          </div>

          <div className="dark-card">
            <p>
              Processing
            </p>

            <h2>
              ZAR{" "}
              {totals.processing.toFixed(
                2
              )}
            </h2>
          </div>

          <div className="dark-card">
            <p>
              Paid Out
            </p>

            <h2>
              ZAR{" "}
              {totals.paidOut.toFixed(
                2
              )}
            </h2>
          </div>

          <div className="dark-card">
            <p>
              Platform Fees
            </p>

            <h2>
              ZAR{" "}
              {totals.platformFees.toFixed(
                2
              )}
            </h2>
          </div>

        </div>
      </section>

      {/* PAYOUT LIST */}

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
                const milestone =
                  milestones[
                    payout.milestone_id
                  ];

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
                        {milestone?.title ||
                          "Project Milestone"}
                      </h2>

                      <span
                        className={`contract-status ${payout.status}`}
                      >
                        {payoutStatusLabel(
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
                          Approved:
                        </strong>{" "}
                        {new Date(
                          payout.approved_for_payout_at
                        ).toLocaleString()}
                      </p>
                    )}

                    {payout.payout_requested_at && (
                      <p>
                        <strong>
                          Payout Requested:
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

                    {payout.status ===
                      "held" && (
                      <div
                        className="contract-actions"
                        style={{
                          marginTop:
                            15,
                        }}
                      >
                        <span className="contract-status pending">
                          Waiting for Client Approval
                        </span>
                      </div>
                    )}

                    {payout.status ===
                      "ready_for_payout" && (
                      <div
                        className="contract-actions"
                        style={{
                          marginTop:
                            15,
                        }}
                      >
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

                    {payout.status ===
                      "payout_requested" && (
                      <div
                        className="contract-actions"
                        style={{
                          marginTop:
                            15,
                        }}
                      >
                        <span className="contract-status pending">
                          Payout Request Submitted
                        </span>
                      </div>
                    )}

                    {payout.status ===
                      "processing" && (
                      <div
                        className="contract-actions"
                        style={{
                          marginTop:
                            15,
                        }}
                      >
                        <span className="contract-status approved">
                          Payout Processing
                        </span>
                      </div>
                    )}

                    {payout.status ===
                      "paid_out" && (
                      <div
                        className="contract-actions"
                        style={{
                          marginTop:
                            15,
                        }}
                      >
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