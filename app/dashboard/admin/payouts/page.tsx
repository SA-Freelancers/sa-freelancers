"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/app/lib/supabase";

type Payout = {
  id: string;

  milestone_id: string;
  project_id: string;
  contract_id?: string | null;

  freelancer_id: string;
  client_id: string;

  milestone_title: string;
  freelancer_name: string;

  gross_amount: number;
  platform_fee: number;
  freelancer_amount: number;

  status: string;

  payment_received_at?: string | null;
  approved_for_payout_at?: string | null;
  payout_requested_at?: string | null;
  paid_out_at?: string | null;

  created_at?: string;
};

type Summary = {
  held: number;
  ready: number;
  requested: number;
  processing: number;
  paid: number;
};

type PayoutResponse = {
  success?: boolean;
  payouts?: Payout[];
  summary?: Summary;
  error?: string;
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] =
    useState<Payout[]>([]);

  const [summary, setSummary] =
    useState<Summary>({
      held: 0,
      ready: 0,
      requested: 0,
      processing: 0,
      paid: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const loadPayouts =
    useCallback(async () => {
      setLoading(true);

      try {
        const {
          data: sessionData,
        } =
          await supabase.auth.getSession();

        if (
          !sessionData.session
        ) {
          setMessage(
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            "/api/admin/payouts",
            {
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
          PayoutResponse = {};

        try {
          result =
            text
              ? JSON.parse(
                  text
                )
              : {};
        } catch {
          setMessage(
            `Server returned an invalid response (${response.status}).`
          );

          return;
        }

        if (
          !response.ok ||
          !result.success
        ) {
          setMessage(
            result.error ||
              "Unable to load payouts."
          );

          return;
        }

        setPayouts(
          result.payouts ||
            []
        );

        setSummary(
          result.summary || {
            held: 0,
            ready: 0,
            requested: 0,
            processing: 0,
            paid: 0,
          }
        );
      } catch (error) {
        console.error(
          "Admin payout page error:",
          error
        );

        setMessage(
          "Unable to load payouts."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const updatePayout =
    async (
      payoutId: string,
      status:
        | "processing"
        | "paid_out"
    ) => {
      setUpdatingId(
        payoutId
      );

      setMessage("");

      try {
        const {
          data: sessionData,
        } =
          await supabase.auth.getSession();

        if (
          !sessionData.session
        ) {
          setMessage(
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            "/api/admin/payouts/update",
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
                  payoutId,
                  status,
                }),
            }
          );

        const text =
          await response.text();

        let result: {
          success?: boolean;
          error?: string;
        } = {};

        try {
          result =
            text
              ? JSON.parse(
                  text
                )
              : {};
        } catch {
          setMessage(
            `Server returned an invalid response (${response.status}).`
          );

          return;
        }

        if (
          !response.ok ||
          !result.success
        ) {
          setMessage(
            result.error ||
              "Unable to update payout."
          );

          return;
        }

        setMessage(
          status ===
            "processing"
            ? "Payout moved to processing."
            : "Payout marked as paid out."
        );

        await loadPayouts();
      } catch (error) {
        console.error(
          "Admin payout update error:",
          error
        );

        setMessage(
          "Unable to update payout."
        );
      } finally {
        setUpdatingId(
          null
        );
      }
    };

  const money = (
    value: number
  ) =>
    `ZAR ${Number(
      value || 0
    ).toFixed(2)}`;

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return "—";
    }

    return new Date(
      value
    ).toLocaleString();
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <h1>
          Payout Management
        </h1>

        <p>
          Loading payouts...
        </p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">

      <section className="dashboard-header">
        <p className="dashboard-badge">
          Administration
        </p>

        <h1>
          Payout Management
        </h1>

        <p>
          Review freelancer payout
          requests and track payment
          processing.
        </p>
      </section>

      {message && (
        <p className="upload-message">
          {message}
        </p>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 15,
          marginBottom: 30,
        }}
      >
        <SummaryCard
          title="Held"
          amount={
            summary.held
          }
        />

        <SummaryCard
          title="Ready"
          amount={
            summary.ready
          }
        />

        <SummaryCard
          title="Requested"
          amount={
            summary.requested
          }
        />

        <SummaryCard
          title="Processing"
          amount={
            summary.processing
          }
        />

        <SummaryCard
          title="Paid Out"
          amount={
            summary.paid
          }
        />
      </section>

      <section>
        <h2>
          Freelancer Payouts
        </h2>

        {payouts.length ===
        0 ? (
          <div className="dark-card">
            <h3>
              No payouts found
            </h3>

            <p>
              Freelancer payouts
              will appear here.
            </p>
          </div>
        ) : (
          <div className="contracts-grid">

            {payouts.map(
              (payout) => (
                <article
                  key={
                    payout.id
                  }
                  className="dark-card contract-card"
                >
                  <div className="contract-top">
                    <div>
                      <h2>
                        {
                          payout.milestone_title
                        }
                      </h2>

                      <p>
                        {
                          payout.freelancer_name
                        }
                      </p>
                    </div>

                    <span
                      className={`contract-status ${payout.status}`}
                    >
                      {payout.status
                        .replaceAll(
                          "_",
                          " "
                        )}
                    </span>
                  </div>

                  <p>
                    <strong>
                      Gross:
                    </strong>{" "}
                    {money(
                      payout.gross_amount
                    )}
                  </p>

                  <p>
                    <strong>
                      Platform Fee:
                    </strong>{" "}
                    {money(
                      payout.platform_fee
                    )}
                  </p>

                  <p>
                    <strong>
                      Freelancer:
                    </strong>{" "}
                    {money(
                      payout.freelancer_amount
                    )}
                  </p>

                  <p>
                    <strong>
                      Payment Received:
                    </strong>{" "}
                    {formatDate(
                      payout.payment_received_at
                    )}
                  </p>

                  <p>
                    <strong>
                      Approved:
                    </strong>{" "}
                    {formatDate(
                      payout.approved_for_payout_at
                    )}
                  </p>

                  <p>
                    <strong>
                      Requested:
                    </strong>{" "}
                    {formatDate(
                      payout.payout_requested_at
                    )}
                  </p>

                  {payout.status ===
                    "payout_requested" && (
                    <button
                      type="button"
                      className="primary-action-btn"
                      disabled={
                        updatingId ===
                        payout.id
                      }
                      onClick={() =>
                        updatePayout(
                          payout.id,
                          "processing"
                        )
                      }
                    >
                      {updatingId ===
                      payout.id
                        ? "Updating..."
                        : "Start Processing"}
                    </button>
                  )}

                  {payout.status ===
                    "processing" && (
                    <button
                      type="button"
                      className="primary-action-btn"
                      disabled={
                        updatingId ===
                        payout.id
                      }
                      onClick={() =>
                        updatePayout(
                          payout.id,
                          "paid_out"
                        )
                      }
                    >
                      {updatingId ===
                      payout.id
                        ? "Updating..."
                        : "Mark Paid Out"}
                    </button>
                  )}

                  {payout.status ===
                    "paid_out" && (
                    <p>
                      <strong>
                        Paid Out:
                      </strong>{" "}
                      {formatDate(
                        payout.paid_out_at
                      )}
                    </p>
                  )}
                </article>
              )
            )}

          </div>
        )}
      </section>

    </main>
  );
}

function SummaryCard({
  title,
  amount,
}: {
  title: string;
  amount: number;
}) {
  return (
    <div className="dark-card">
      <p>
        {title}
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