"use client";

import Link from "next/link";
import {
  FormEvent,
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
  processing_started_at?: string | null;
  paid_out_at?: string | null;

  payout_reference?: string | null;

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

type PayoutMethod = {
  id?: string;

  accountHolderName: string;
  bankName: string;
  accountNumberMasked: string;
  accountType: string;
  branchCode: string;

  status: string;

  verifiedAt?: string | null;
  updatedAt?: string | null;
};

type PayoutMethodResponse = {
  success?: boolean;
  message?: string;
  method?: PayoutMethod | null;
  error?: string;
};

const emptyTotals: EarningsTotals = {
  held: 0,
  available: 0,
  requested: 0,
  processing: 0,
  paidOut: 0,
  platformFees: 0,
  totalEarned: 0,
};

export default function FreelancerEarningsPage() {
  const [
    payouts,
    setPayouts,
  ] = useState<Payout[]>([]);

  const [
    totals,
    setTotals,
  ] =
    useState<EarningsTotals>(
      emptyTotals
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    requestingPayoutId,
    setRequestingPayoutId,
  ] =
    useState<string | null>(
      null
    );

  // ==================================================
  // BANKING DETAILS STATE
  // ==================================================

  const [
    payoutMethod,
    setPayoutMethod,
  ] =
    useState<PayoutMethod | null>(
      null
    );

  const [
    accountHolderName,
    setAccountHolderName,
  ] = useState("");

  const [
    bankName,
    setBankName,
  ] = useState("");

  const [
    accountNumber,
    setAccountNumber,
  ] = useState("");

  const [
    accountType,
    setAccountType,
  ] = useState("");

  const [
    branchCode,
    setBranchCode,
  ] = useState("");

  const [
    savingBankDetails,
    setSavingBankDetails,
  ] = useState(false);

  const [
    editingBankDetails,
    setEditingBankDetails,
  ] = useState(false);

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage =
    async () => {
      setLoading(true);

      try {
        await Promise.all([
          loadEarnings(),
          loadPayoutMethod(),
        ]);
      } finally {
        setLoading(false);
      }
    };

  // ==================================================
  // AUTH TOKEN
  // ==================================================

  const getAccessToken =
    async () => {
      const {
        data:
          sessionData,
        error:
          sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        return null;
      }

      return sessionData
        .session
        .access_token;
    };

  // ==================================================
  // LOAD EARNINGS
  // ==================================================

  const loadEarnings =
    async () => {
      try {
        const accessToken =
          await getAccessToken();

        if (!accessToken) {
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
                  `Bearer ${accessToken}`,
              },

              cache:
                "no-store",
            }
          );

        const responseText =
          await response.text();

        let result:
          EarningsResponse =
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
          result.totals ||
            emptyTotals
        );
      } catch (error) {
        console.error(
          "Unexpected earnings page error:",
          error
        );

        setMessage(
          "Unable to load earnings."
        );
      }
    };

  // ==================================================
  // LOAD PAYOUT METHOD
  // ==================================================

  const loadPayoutMethod =
    async () => {
      try {
        const accessToken =
          await getAccessToken();

        if (!accessToken) {
          return;
        }

        const response =
          await fetch(
            "/api/payouts/method",
            {
              method:
                "GET",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },

              cache:
                "no-store",
            }
          );

        const responseText =
          await response.text();

        let result:
          PayoutMethodResponse =
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
            "Payout method API returned non-JSON:",
            responseText
          );

          return;
        }

        if (
          !response.ok ||
          !result.success
        ) {
          console.error(
            "Unable to load payout method:",
            result.error
          );

          return;
        }

        if (
          !result.method
        ) {
          setPayoutMethod(
            null
          );

          setEditingBankDetails(
            true
          );

          return;
        }

        setPayoutMethod(
          result.method
        );

        setAccountHolderName(
          result.method
            .accountHolderName ||
            ""
        );

        setBankName(
          result.method
            .bankName ||
            ""
        );

        setAccountType(
          result.method
            .accountType ||
            ""
        );

        setBranchCode(
          result.method
            .branchCode ||
            ""
        );

        setAccountNumber(
          ""
        );

        setEditingBankDetails(
          false
        );
      } catch (error) {
        console.error(
          "Unexpected payout method loading error:",
          error
        );
      }
    };

  // ==================================================
  // SAVE BANKING DETAILS
  // ==================================================

  const saveBankDetails =
    async (
      event:
        FormEvent
    ) => {
      event.preventDefault();

      setMessage("");

      if (
        !accountHolderName.trim() ||
        !bankName.trim() ||
        !accountNumber.trim() ||
        !accountType ||
        !branchCode.trim()
      ) {
        setMessage(
          "Please complete all banking details."
        );

        return;
      }

      setSavingBankDetails(
        true
      );

      try {
        const accessToken =
          await getAccessToken();

        if (!accessToken) {
          setMessage(
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            "/api/payouts/method",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${accessToken}`,
              },

              body:
                JSON.stringify({
                  accountHolderName:
                    accountHolderName.trim(),

                  bankName:
                    bankName.trim(),

                  accountNumber:
                    accountNumber.trim(),

                  accountType,

                  branchCode:
                    branchCode.trim(),
                }),
            }
          );

        const responseText =
          await response.text();

        let result:
          PayoutMethodResponse =
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
              "Unable to save banking details."
          );

          return;
        }

        if (
          result.method
        ) {
          setPayoutMethod(
            result.method
          );
        }

        setAccountNumber(
          ""
        );

        setEditingBankDetails(
          false
        );

        setMessage(
          "Banking details saved successfully."
        );

        await loadPayoutMethod();
      } catch (error) {
        console.error(
          "Unexpected banking details save error:",
          error
        );

        setMessage(
          "Unable to save banking details."
        );
      } finally {
        setSavingBankDetails(
          false
        );
      }
    };

  // ==================================================
  // REQUEST PAYOUT
  // ==================================================

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

      if (
        !payoutMethod
      ) {
        setMessage(
          "Please add your banking details before requesting a payout."
        );

        setEditingBankDetails(
          true
        );

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });

        return;
      }

      if (
        payoutMethod.status ===
        "disabled"
      ) {
        setMessage(
          "Your payout method is currently disabled. Please update your banking details."
        );

        return;
      }

      if (
        payoutMethod.status ===
        "rejected"
      ) {
        setMessage(
          "Your banking details require an update before you can request a payout."
        );

        setEditingBankDetails(
          true
        );

        return;
      }

      setRequestingPayoutId(
        payout.id
      );

      try {
        const accessToken =
          await getAccessToken();

        if (!accessToken) {
          setMessage(
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            "/api/payouts/request",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${accessToken}`,
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

  // ==================================================
  // STATUS HELPERS
  // ==================================================

  const getStatusLabel = (
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

  const getBankStatusLabel = (
    status: string
  ) => {
    switch (status) {
      case "pending":
        return "Pending Verification";

      case "verified":
        return "Verified";

      case "rejected":
        return "Needs Attention";

      case "disabled":
        return "Disabled";

      default:
        return status;
    }
  };

  const formatDate = (
    value?:
      | string
      | null
  ) => {
    if (!value) {
      return "—";
    }

    return new Date(
      value
    ).toLocaleString(
      "en-ZA"
    );
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <LoadingSkeleton />
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="dashboard-page">

      {/* ============================================
          HEADER
          ============================================ */}

      <section className="dashboard-header">
        <p className="dashboard-badge">
          Freelancer Earnings
        </p>

        <h1>
          My Earnings
        </h1>

        <p>
          Track secured payments,
          available earnings,
          payout requests and
          completed payment receipts.
        </p>
      </section>

      {message && (
        <p className="upload-message">
          {message}
        </p>
      )}

      {/* ============================================
          BANKING DETAILS
          ============================================ */}

      <section
        className="dark-card"
        style={{
          marginBottom: 30,
        }}
      >
        <div
          style={{
            display: "flex",

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
            <p className="dashboard-badge">
              Payout Method
            </p>

            <h2>
              Banking Details
            </h2>

            <p>
              Add the South African
              bank account where you
              want to receive your
              freelancer payouts.
            </p>
          </div>

          {payoutMethod && (
            <span
              className={`contract-status ${payoutMethod.status}`}
            >
              {getBankStatusLabel(
                payoutMethod.status
              )}
            </span>
          )}
        </div>

        {payoutMethod &&
        !editingBankDetails ? (
          <div
            style={{
              marginTop: 20,
            }}
          >
            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",

                gap: 15,
              }}
            >
              <BankInfo
                label="Account Holder"
                value={
                  payoutMethod
                    .accountHolderName
                }
              />

              <BankInfo
                label="Bank"
                value={
                  payoutMethod
                    .bankName
                }
              />

              <BankInfo
                label="Account Number"
                value={
                  payoutMethod
                    .accountNumberMasked
                }
              />

              <BankInfo
                label="Account Type"
                value={
                  payoutMethod
                    .accountType
                }
              />

              <BankInfo
                label="Branch Code"
                value={
                  payoutMethod
                    .branchCode
                }
              />
            </div>

            {payoutMethod.status ===
              "pending" && (
              <p
                style={{
                  marginTop:
                    18,
                }}
              >
                Your banking details
                have been saved and
                are awaiting
                verification.
              </p>
            )}

            {payoutMethod.status ===
              "verified" && (
              <p
                style={{
                  marginTop:
                    18,
                }}
              >
                ✓ Your payout banking
                details have been
                verified.
              </p>
            )}

            {payoutMethod.status ===
              "rejected" && (
              <p
                style={{
                  marginTop:
                    18,
                }}
              >
                Your banking details
                require attention.
                Please update them
                before requesting
                another payout.
              </p>
            )}

            <button
              type="button"
              className="primary-action-btn"
              style={{
                marginTop:
                  20,
              }}
              onClick={() => {
                setAccountNumber(
                  ""
                );

                setEditingBankDetails(
                  true
                );
              }}
            >
              Update Banking Details
            </button>
          </div>
        ) : (
          <form
            onSubmit={
              saveBankDetails
            }
            style={{
              marginTop: 24,
            }}
          >
            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(240px, 1fr))",

                gap: 18,
              }}
            >
              {/* ACCOUNT HOLDER */}

              <div>
                <label
                  htmlFor="accountHolderName"
                  style={{
                    display:
                      "block",

                    marginBottom:
                      7,

                    fontWeight:
                      600,
                  }}
                >
                  Account Holder Name
                </label>

                <input
                  id="accountHolderName"
                  type="text"
                  value={
                    accountHolderName
                  }
                  onChange={(
                    event
                  ) =>
                    setAccountHolderName(
                      event.target.value
                    )
                  }
                  placeholder="Full name on bank account"
                  required
                  style={{
                    width:
                      "100%",

                    padding:
                      12,

                    borderRadius:
                      8,
                  }}
                />
              </div>

              {/* BANK */}

              <div>
                <label
                  htmlFor="bankName"
                  style={{
                    display:
                      "block",

                    marginBottom:
                      7,

                    fontWeight:
                      600,
                  }}
                >
                  Bank
                </label>

                <select
                  id="bankName"
                  value={
                    bankName
                  }
                  onChange={(
                    event
                  ) =>
                    setBankName(
                      event.target.value
                    )
                  }
                  required
                  style={{
                    width:
                      "100%",

                    padding:
                      12,

                    borderRadius:
                      8,
                  }}
                >
                  <option value="">
                    Select bank
                  </option>

                  <option value="ABSA">
                    ABSA
                  </option>

                  <option value="Capitec">
                    Capitec
                  </option>

                  <option value="FNB">
                    FNB
                  </option>

                  <option value="Nedbank">
                    Nedbank
                  </option>

                  <option value="Standard Bank">
                    Standard Bank
                  </option>

                  <option value="African Bank">
                    African Bank
                  </option>

                  <option value="TymeBank">
                    TymeBank
                  </option>

                  <option value="Discovery Bank">
                    Discovery Bank
                  </option>

                  <option value="Bank Zero">
                    Bank Zero
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {/* ACCOUNT NUMBER */}

              <div>
                <label
                  htmlFor="accountNumber"
                  style={{
                    display:
                      "block",

                    marginBottom:
                      7,

                    fontWeight:
                      600,
                  }}
                >
                  Account Number
                </label>

                <input
                  id="accountNumber"
                  type="text"
                  inputMode="numeric"
                  value={
                    accountNumber
                  }
                  onChange={(
                    event
                  ) =>
                    setAccountNumber(
                      event.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder={
                    payoutMethod
                      ? `Current: ${payoutMethod.accountNumberMasked} — enter full number to update`
                      : "Bank account number"
                  }
                  required
                  style={{
                    width:
                      "100%",

                    padding:
                      12,

                    borderRadius:
                      8,
                  }}
                />
              </div>

              {/* ACCOUNT TYPE */}

              <div>
                <label
                  htmlFor="accountType"
                  style={{
                    display:
                      "block",

                    marginBottom:
                      7,

                    fontWeight:
                      600,
                  }}
                >
                  Account Type
                </label>

                <select
                  id="accountType"
                  value={
                    accountType
                  }
                  onChange={(
                    event
                  ) =>
                    setAccountType(
                      event.target.value
                    )
                  }
                  required
                  style={{
                    width:
                      "100%",

                    padding:
                      12,

                    borderRadius:
                      8,
                  }}
                >
                  <option value="">
                    Select account type
                  </option>

                  <option value="Cheque">
                    Cheque
                  </option>

                  <option value="Savings">
                    Savings
                  </option>

                  <option value="Current">
                    Current
                  </option>

                  <option value="Transmission">
                    Transmission
                  </option>
                </select>
              </div>

              {/* BRANCH CODE */}

              <div>
                <label
                  htmlFor="branchCode"
                  style={{
                    display:
                      "block",

                    marginBottom:
                      7,

                    fontWeight:
                      600,
                  }}
                >
                  Branch Code
                </label>

                <input
                  id="branchCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={
                    6
                  }
                  value={
                    branchCode
                  }
                  onChange={(
                    event
                  ) =>
                    setBranchCode(
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        )
                    )
                  }
                  placeholder="6-digit branch code"
                  required
                  style={{
                    width:
                      "100%",

                    padding:
                      12,

                    borderRadius:
                      8,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",

                gap: 12,

                flexWrap:
                  "wrap",

                marginTop:
                  22,
              }}
            >
              <button
                type="submit"
                className="primary-action-btn"
                disabled={
                  savingBankDetails
                }
              >
                {savingBankDetails
                  ? "Saving..."
                  : payoutMethod
                  ? "Save Updated Banking Details"
                  : "Save Banking Details"}
              </button>

              {payoutMethod && (
                <button
                  type="button"
                  className="secondary-action-btn"
                  disabled={
                    savingBankDetails
                  }
                  onClick={() => {
                    setAccountHolderName(
                      payoutMethod
                        .accountHolderName
                    );

                    setBankName(
                      payoutMethod
                        .bankName
                    );

                    setAccountType(
                      payoutMethod
                        .accountType
                    );

                    setBranchCode(
                      payoutMethod
                        .branchCode
                    );

                    setAccountNumber(
                      ""
                    );

                    setEditingBankDetails(
                      false
                    );
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            <p
              style={{
                marginTop: 16,
                opacity: 0.8,
              }}
            >
              Please check your
              account number
              carefully. Incorrect
              banking details can
              delay your payout.
            </p>
          </form>
        )}
      </section>

      {/* ============================================
          EARNINGS SUMMARY
          ============================================ */}

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
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",

            gap: 15,

            marginTop:
              20,
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

      {/* ============================================
          PAYMENT HISTORY
          ============================================ */}

      <section>
        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap: 12,

            flexWrap:
              "wrap",

            marginBottom:
              18,
          }}
        >
          <div>
            <h2>
              Payment History
            </h2>

            <p
              style={{
                marginTop:
                  4,

                opacity:
                  0.75,
              }}
            >
              Track each secured,
              requested, processing
              and completed payout.
            </p>
          </div>

          <span className="dashboard-badge">
            {payouts.length}{" "}
            {payouts.length ===
            1
              ? "Payout"
              : "Payouts"}
          </span>
        </div>

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
              (
                payout
              ) => {
                const isRequesting =
                  requestingPayoutId ===
                  payout.id;

                const isPaid =
                  payout.status ===
                  "paid_out";

                return (
                  <article
                    key={
                      payout.id
                    }
                    className="dark-card contract-card"
                    style={
                      isPaid
                        ? {
                            border:
                              "1px solid rgba(34, 197, 94, 0.22)",
                          }
                        : undefined
                    }
                  >
                    {/* HEADER */}

                    <div className="contract-top">
                      <div>
                        <h2>
                          {payout
                            .milestone
                            ?.title ||
                            "Project Milestone"}
                        </h2>

                        {isPaid && (
                          <p
                            style={{
                              marginTop:
                                5,

                              opacity:
                                0.75,

                              fontSize:
                                13,
                            }}
                          >
                            Completed payout
                          </p>
                        )}
                      </div>

                      <span
                        className={`contract-status ${payout.status}`}
                      >
                        {getStatusLabel(
                          payout.status
                        )}
                      </span>
                    </div>

                    {/* MONEY */}

                    <div
                      style={{
                        marginTop:
                          16,
                      }}
                    >
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
                    </div>

                    {/* TIMELINE */}

                    <div
                      style={{
                        marginTop:
                          16,
                      }}
                    >
                      {payout.payment_received_at && (
                        <p>
                          <strong>
                            Payment Received:
                          </strong>{" "}
                          {formatDate(
                            payout.payment_received_at
                          )}
                        </p>
                      )}

                      {payout.approved_for_payout_at && (
                        <p>
                          <strong>
                            Approved for Payout:
                          </strong>{" "}
                          {formatDate(
                            payout.approved_for_payout_at
                          )}
                        </p>
                      )}

                      {payout.payout_requested_at && (
                        <p>
                          <strong>
                            Requested:
                          </strong>{" "}
                          {formatDate(
                            payout.payout_requested_at
                          )}
                        </p>
                      )}

                      {payout.processing_started_at && (
                        <p>
                          <strong>
                            Processing Started:
                          </strong>{" "}
                          {formatDate(
                            payout.processing_started_at
                          )}
                        </p>
                      )}

                      {payout.paid_out_at && (
                        <p>
                          <strong>
                            Paid Out:
                          </strong>{" "}
                          {formatDate(
                            payout.paid_out_at
                          )}
                        </p>
                      )}

                      {isPaid &&
                        payout.payout_reference && (
                          <p>
                            <strong>
                              Payment Reference:
                            </strong>{" "}
                            {
                              payout.payout_reference
                            }
                          </p>
                        )}
                    </div>

                    {/* HELD */}

                    {payout.status ===
                      "held" && (
                      <div className="contract-actions">
                        <span className="contract-status pending">
                          Funds Secured —
                          Waiting for Client
                          Approval
                        </span>
                      </div>
                    )}

                    {/* READY FOR PAYOUT */}

                    {payout.status ===
                      "ready_for_payout" && (
                      <div className="contract-actions">
                        {!payoutMethod && (
                          <p>
                            Add your banking
                            details before
                            requesting this
                            payout.
                          </p>
                        )}

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
                      <div
                        className="contract-actions"
                        style={{
                          marginTop:
                            18,
                        }}
                      >
                        <span className="contract-status approved">
                          Payout Processing
                        </span>

                        <p
                          style={{
                            marginTop:
                              10,

                            opacity:
                              0.8,
                          }}
                        >
                          Your payout is being
                          processed. You will
                          receive a notification
                          once payment has been
                          sent.
                        </p>
                      </div>
                    )}

                    {/* PAID OUT */}

                    {isPaid && (
                      <div
                        className="contract-actions"
                        style={{
                          marginTop:
                            20,
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "space-between",

                            gap: 16,

                            flexWrap:
                              "wrap",

                            width:
                              "100%",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",

                              gap: 10,

                              alignItems:
                                "center",

                              flexWrap:
                                "wrap",
                            }}
                          >
                            <span className="contract-status completed">
                              ✓ Payment Sent
                            </span>

                            <span
                              style={{
                                display:
                                  "inline-flex",

                                alignItems:
                                  "center",

                                gap: 6,

                                padding:
                                  "6px 10px",

                                borderRadius:
                                  999,

                                fontSize:
                                  13,

                                fontWeight:
                                  600,

                                background:
                                  "rgba(34, 197, 94, 0.12)",
                              }}
                            >
                              📄 Receipt Available
                            </span>
                          </div>

                          <Link
                            href={`/dashboard/freelancer/earnings/receipt/${payout.id}`}
                            className="primary-action-btn"
                            style={{
                              textDecoration:
                                "none",

                              display:
                                "inline-flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "center",

                              gap: 7,
                            }}
                          >
                            📄 View Receipt
                          </Link>
                        </div>
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

// ==================================================
// SUMMARY CARD
// ==================================================

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

// ==================================================
// BANK INFO
// ==================================================

function BankInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="dark-card">
      <p>
        {label}
      </p>

      <strong>
        {value || "—"}
      </strong>
    </div>
  );
}