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
  milestone_status?: string | null;

  freelancer_name: string;

  gross_amount: number;
  platform_fee: number;
  freelancer_amount: number;

  status: string;

  payment_received_at?: string | null;
  approved_for_payout_at?: string | null;
  payout_requested_at?: string | null;
  processing_started_at?: string | null;
  payout_reference?: string | null;
  payout_notes?: string | null;
  processed_by?: string | null;
  paid_out_at?: string | null;

  payout_method_id?: string | null;

  account_holder_name?: string | null;
  bank_name?: string | null;
  account_number_masked?: string | null;
  account_type?: string | null;
  branch_code?: string | null;

  banking_status?: string;
  banking_verified_at?: string | null;
  banking_updated_at?: string | null;

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

type UpdateResponse = {
  success?: boolean;
  error?: string;
};

type VerificationResponse = {
  success?: boolean;
  error?: string;

  payoutMethod?: {
    id: string;
    freelancerId: string;
    accountHolderName: string;
    bankName: string;
    accountType: string;
    branchCode: string;
    status: string;
    updatedAt?: string | null;
  };
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

  const [
    updatingId,
    setUpdatingId,
  ] = useState<string | null>(
    null
  );

  const [
    verifyingMethodId,
    setVerifyingMethodId,
  ] = useState<string | null>(
    null
  );

  // --------------------------------------------------
  // LOAD PAYOUTS
  // --------------------------------------------------

  const loadPayouts =
    useCallback(async () => {
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
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            "/api/admin/payouts",
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
          result.payouts || []
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

  // --------------------------------------------------
  // VERIFY / REJECT BANKING DETAILS
  // --------------------------------------------------

  const verifyPayoutMethod =
    async (
      payout: Payout,
      action:
        | "verify"
        | "reject"
    ) => {
      setMessage("");

      if (
        !payout.payout_method_id
      ) {
        setMessage(
          "This freelancer has not configured payout banking details."
        );

        return;
      }

      setVerifyingMethodId(
        payout.payout_method_id
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
            "/api/admin/payout-methods/verify",
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
                  payoutMethodId:
                    payout.payout_method_id,

                  action,
                }),
            }
          );

        const text =
          await response.text();

        let result:
          VerificationResponse =
            {};

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
              "Unable to update banking verification."
          );

          return;
        }

        setMessage(
          action === "verify"
            ? "Banking details verified successfully."
            : "Banking details rejected."
        );

        await loadPayouts();
      } catch (error) {
        console.error(
          "Banking verification error:",
          error
        );

        setMessage(
          "Unable to update banking verification."
        );
      } finally {
        setVerifyingMethodId(
          null
        );
      }
    };

  // --------------------------------------------------
  // UPDATE PAYOUT
  // --------------------------------------------------

  const updatePayout =
    async (
      payout: Payout,
      status:
        | "processing"
        | "paid_out"
    ) => {
      setMessage("");

      // ----------------------------------------------
      // SECURITY:
      // ADMIN MUST VERIFY BANKING BEFORE PROCESSING
      // ----------------------------------------------

      if (
        status ===
          "processing" &&
        payout.banking_status !==
          "verified"
      ) {
        setMessage(
          "Verify the freelancer banking details before processing this payout."
        );

        return;
      }

      setUpdatingId(
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
                  payoutId:
                    payout.id,

                  status,
                }),
            }
          );

        const text =
          await response.text();

        let result:
          UpdateResponse = {};

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

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

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

  const bankingStatusLabel =
    (
      status?: string
    ) => {
      switch (status) {
        case "pending":
          return "Pending Verification";

        case "verified":
          return "Verified";

        case "rejected":
          return "Rejected";

        case "disabled":
          return "Disabled";

        case "not_configured":
          return "Not Configured";

        default:
          return (
            status ||
            "Not Configured"
          );
      }
    };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

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

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="dashboard-page">

      {/* HEADER */}

      <section className="dashboard-header">
        <p className="dashboard-badge">
          Administration
        </p>

        <h1>
          Payout Management
        </h1>

        <p>
          Verify freelancer banking
          details, review payout
          requests and track manual
          payment processing.
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

      {/* PAYOUTS */}

      <section>
        <h2
          style={{
            marginBottom: 18,
          }}
        >
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
              (payout) => {
                const isUpdating =
                  updatingId ===
                  payout.id;

                const isVerifying =
                  Boolean(
                    payout.payout_method_id &&
                      verifyingMethodId ===
                        payout.payout_method_id
                  );

                const bankingVerified =
                  payout.banking_status ===
                  "verified";

                return (
                  <article
                    key={
                      payout.id
                    }
                    className="dark-card contract-card"
                  >

                    {/* PAYOUT HEADER */}

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

                    {/* PAYOUT AMOUNTS */}

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
                        Freelancer Receives:
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

                    {/* BANKING DETAILS */}

                    <div
                      style={{
                        marginTop: 22,
                        padding: 18,

                        border:
                          "1px solid rgba(255,255,255,0.10)",

                        borderRadius:
                          12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "center",

                          gap: 12,

                          flexWrap:
                            "wrap",

                          marginBottom:
                            15,
                        }}
                      >
                        <h3>
                          Payout Banking Details
                        </h3>

                        <span
                          className={`contract-status ${
                            payout.banking_status ||
                            "pending"
                          }`}
                        >
                          {bankingStatusLabel(
                            payout.banking_status
                          )}
                        </span>
                      </div>

                      {!payout.payout_method_id ? (
                        <p>
                          This freelancer
                          has not configured
                          banking details.
                        </p>
                      ) : (
                        <>
                          <p>
                            <strong>
                              Account Holder:
                            </strong>{" "}
                            {payout.account_holder_name ||
                              "—"}
                          </p>

                          <p>
                            <strong>
                              Bank:
                            </strong>{" "}
                            {payout.bank_name ||
                              "—"}
                          </p>

                          <p>
                            <strong>
                              Account:
                            </strong>{" "}
                            {payout.account_number_masked ||
                              "—"}
                          </p>

                          <p>
                            <strong>
                              Account Type:
                            </strong>{" "}
                            {payout.account_type ||
                              "—"}
                          </p>

                          <p>
                            <strong>
                              Branch Code:
                            </strong>{" "}
                            {payout.branch_code ||
                              "—"}
                          </p>

                          {payout.banking_verified_at && (
                            <p>
                              <strong>
                                Verified:
                              </strong>{" "}
                              {formatDate(
                                payout.banking_verified_at
                              )}
                            </p>
                          )}

                          {payout.banking_status ===
                            "pending" && (
                            <div
                              style={{
                                display:
                                  "flex",

                                gap: 10,

                                flexWrap:
                                  "wrap",

                                marginTop:
                                  16,
                              }}
                            >
                              <button
                                type="button"
                                className="primary-action-btn"
                                disabled={
                                  isVerifying
                                }
                                onClick={() =>
                                  verifyPayoutMethod(
                                    payout,
                                    "verify"
                                  )
                                }
                              >
                                {isVerifying
                                  ? "Updating..."
                                  : "Verify Banking Details"}
                              </button>

                              <button
                                type="button"
                                className="secondary-action-btn"
                                disabled={
                                  isVerifying
                                }
                                onClick={() =>
                                  verifyPayoutMethod(
                                    payout,
                                    "reject"
                                  )
                                }
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {payout.banking_status ===
                            "rejected" && (
                            <p
                              style={{
                                marginTop:
                                  14,
                              }}
                            >
                              The freelancer
                              must update their
                              banking details
                              before this payout
                              can continue.
                            </p>
                          )}

                          {payout.banking_status ===
                            "verified" && (
                            <p
                              style={{
                                marginTop:
                                  14,
                              }}
                            >
                              ✓ Banking details
                              verified for manual
                              payout.
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* PAYOUT REQUESTED */}

                    {payout.status ===
                      "payout_requested" && (
                      <div
                        style={{
                          marginTop:
                            20,
                        }}
                      >
                        {!bankingVerified && (
                          <p
                            style={{
                              marginBottom:
                                12,
                            }}
                          >
                            Banking details
                            must be verified
                            before this payout
                            can be processed.
                          </p>
                        )}

                        <button
                          type="button"
                          className="primary-action-btn"
                          disabled={
                            isUpdating ||
                            !bankingVerified
                          }
                          onClick={() =>
                            updatePayout(
                              payout,
                              "processing"
                            )
                          }
                        >
                          {isUpdating
                            ? "Updating..."
                            : bankingVerified
                            ? "Start Processing"
                            : "Verify Banking First"}
                        </button>
                      </div>
                    )}

                    {/* PROCESSING */}

                    {payout.status ===
                      "processing" && (
                      <div
                        style={{
                          marginTop:
                            20,
                        }}
                      >
                        <p>
                          <strong>
                            Processing Started:
                          </strong>{" "}
                          {formatDate(
                            payout.processing_started_at
                          )}
                        </p>

                        <p
                          style={{
                            marginTop:
                              12,
                          }}
                        >
                          Transfer{" "}
                          <strong>
                            {money(
                              payout.freelancer_amount
                            )}
                          </strong>{" "}
                          manually to the
                          verified bank account
                          before marking this
                          payout as paid.
                        </p>

                        <button
                          type="button"
                          className="primary-action-btn"
                          disabled={
                            isUpdating ||
                            !bankingVerified
                          }
                          onClick={() =>
                            updatePayout(
                              payout,
                              "paid_out"
                            )
                          }
                        >
                          {isUpdating
                            ? "Updating..."
                            : "Mark Paid Out"}
                        </button>
                      </div>
                    )}

                    {/* PAID OUT */}

                    {payout.status ===
                      "paid_out" && (
                      <div
                        style={{
                          marginTop:
                            20,
                        }}
                      >
                        <p>
                          <strong>
                            Paid Out:
                          </strong>{" "}
                          {formatDate(
                            payout.paid_out_at
                          )}
                        </p>

                        {payout.payout_reference && (
                          <p>
                            <strong>
                              Reference:
                            </strong>{" "}
                            {
                              payout.payout_reference
                            }
                          </p>
                        )}
                      </div>
                    )}

                  </article>
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