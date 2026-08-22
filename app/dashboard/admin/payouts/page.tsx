"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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

  processing_started_by?: string | null;
  processing_started_by_name?: string | null;

  processed_by?: string | null;

  paid_out_at?: string | null;
  paid_out_by?: string | null;
  paid_out_by_name?: string | null;

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

type PaymentForm = {
  reference: string;
  notes: string;
};

type FilterStatus =
  | "all"
  | "needs_action"
  | "held"
  | "ready_for_payout"
  | "payout_requested"
  | "processing"
  | "paid_out";

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

  const [
    paymentForms,
    setPaymentForms,
  ] = useState<
    Record<string, PaymentForm>
  >({});

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<FilterStatus>(
      "all"
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
  // DOWNLOAD PAYOUT CSV REPORT
  // --------------------------------------------------

  const downloadCsvReport =
    async () => {
      setMessage("");

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
            "/api/admin/payouts/export",
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

        let result: {
          success?: boolean;

          payouts?: Array<{
            id: string;

            milestone_id?: string | null;

            freelancer_id?: string | null;

            gross_amount?: number | null;

            platform_fee?: number | null;

            freelancer_amount?: number | null;

            status?: string | null;

            payout_reference?: string | null;

            payout_notes?: string | null;

            payment_received_at?: string | null;

            approved_for_payout_at?: string | null;

            payout_requested_at?: string | null;

            processing_started_at?: string | null;

            processing_started_by?: string | null;

            paid_out_at?: string | null;

            paid_out_by?: string | null;

            processed_by?: string | null;

            created_at?: string | null;
          }>;

          error?: string;
        } = {};

        try {
          result =
            text
              ? JSON.parse(text)
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
              "Unable to export payout report."
          );

          return;
        }

        const rows =
          result.payouts || [];

        if (
          rows.length ===
          0
        ) {
          setMessage(
            "There are no payout records to export."
          );

          return;
        }

        // Prevent CSV formatting problems
        // when values contain commas,
        // quotation marks or line breaks.

        const escapeCsv = (
          value:
            | string
            | number
            | null
            | undefined
        ) => {
          const textValue =
            value === null ||
            value === undefined
              ? ""
              : String(value);

          return `"${textValue.replace(
            /"/g,
            '""'
          )}"`;
        };

        const headers = [
          "Payout ID",
          "Milestone ID",
          "Freelancer ID",
          "Gross Amount (ZAR)",
          "Platform Fee (ZAR)",
          "Freelancer Amount (ZAR)",
          "Status",
          "Payment Reference",
          "Payout Notes",
          "Payment Received At",
          "Approved For Payout At",
          "Payout Requested At",
          "Processing Started At",
          "Processing Started By",
          "Paid Out At",
          "Paid Out By",
          "Legacy Processed By",
          "Created At",
        ];

        const csvRows = [
          headers
            .map(escapeCsv)
            .join(","),

          ...rows.map(
            (row) =>
              [
                row.id,

                row.milestone_id,

                row.freelancer_id,

                Number(
                  row.gross_amount ||
                    0
                ).toFixed(2),

                Number(
                  row.platform_fee ||
                    0
                ).toFixed(2),

                Number(
                  row.freelancer_amount ||
                    0
                ).toFixed(2),

                row.status,

                row.payout_reference,

                row.payout_notes,

                row.payment_received_at,

                row.approved_for_payout_at,

                row.payout_requested_at,

                row.processing_started_at,

                row.processing_started_by,

                row.paid_out_at,

                row.paid_out_by,

                row.processed_by,

                row.created_at,
              ]
                .map(
                  escapeCsv
                )
                .join(",")
          ),
        ];

        // UTF-8 BOM helps Microsoft Excel
        // recognise the CSV encoding correctly.

        const csv =
          "\uFEFF" +
          csvRows.join("\r\n");

        const blob =
          new Blob(
            [csv],
            {
              type:
                "text/csv;charset=utf-8;",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        const date =
          new Date()
            .toISOString()
            .slice(0, 10);

        link.href =
          url;

        link.download =
          `freelance-hub-sa-payout-report-${date}.csv`;

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );

        URL.revokeObjectURL(
          url
        );

        setMessage(
          "Payout CSV report downloaded successfully."
        );
      } catch (error) {
        console.error(
          "Payout CSV export error:",
          error
        );

        setMessage(
          "Unable to export payout report."
        );
      }
    };

  // --------------------------------------------------
  // PAYMENT FORM HELPERS
  // --------------------------------------------------

  const getPaymentForm = (
    payoutId: string
  ): PaymentForm => {
    return (
      paymentForms[
        payoutId
      ] || {
        reference: "",
        notes: "",
      }
    );
  };

  const updatePaymentForm = (
    payoutId: string,
    field: keyof PaymentForm,
    value: string
  ) => {
    setPaymentForms(
      (current) => ({
        ...current,

        [payoutId]: {
          ...(
            current[
              payoutId
            ] || {
              reference: "",
              notes: "",
            }
          ),

          [field]:
            value,
        },
      })
    );
  };

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
              method:
                "POST",

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
          action ===
            "verify"
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

      if (
        payout.banking_status !==
        "verified"
      ) {
        setMessage(
          "The freelancer banking details must be verified before this payout can continue."
        );

        return;
      }

      const paymentForm =
        getPaymentForm(
          payout.id
        );

      const payoutReference =
        paymentForm.reference.trim();

      const payoutNotes =
        paymentForm.notes.trim();

      if (
        status ===
          "paid_out" &&
        !payoutReference
      ) {
        setMessage(
          "Enter the bank payment reference before confirming payment."
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

        const requestBody: {
          payoutId: string;

          status:
            | "processing"
            | "paid_out";

          payoutReference?: string;

          payoutNotes?: string;
        } = {
          payoutId:
            payout.id,

          status,
        };

        if (
          status ===
          "paid_out"
        ) {
          requestBody.payoutReference =
            payoutReference;

          requestBody.payoutNotes =
            payoutNotes;
        }

        const response =
          await fetch(
            "/api/admin/payouts/update",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${sessionData.session.access_token}`,
              },

              body:
                JSON.stringify(
                  requestBody
                ),
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

        if (
          status ===
          "processing"
        ) {
          setMessage(
            "Payout moved to processing. Complete the bank transfer, then enter the payment reference below."
          );
        } else {
          setMessage(
            "Payment confirmed and payout marked as paid out."
          );

          setPaymentForms(
            (current) => {
              const next = {
                ...current,
              };

              delete next[
                payout.id
              ];

              return next;
            }
          );
        }

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
    ).toLocaleString(
      "en-ZA"
    );
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

  const payoutStatusLabel =
    (
      status: string
    ) => {
      switch (status) {
        case "held":
          return "Held";

        case "ready_for_payout":
          return "Ready";

        case "payout_requested":
          return "Requested";

        case "processing":
          return "Processing";

        case "paid_out":
          return "Paid Out";

        default:
          return status.replaceAll(
            "_",
            " "
          );
      }
    };

  // --------------------------------------------------
  // FILTER COUNTS
  // --------------------------------------------------

  const needsActionCount =
    useMemo(() => {
      return payouts.filter(
        (payout) =>
          payout.status ===
            "payout_requested" ||
          payout.status ===
            "processing" ||
          (
            payout.banking_status ===
              "pending" &&
            payout.status !==
              "paid_out"
          )
      ).length;
    }, [payouts]);

  const paidCount =
    useMemo(() => {
      return payouts.filter(
        (payout) =>
          payout.status ===
          "paid_out"
      ).length;
    }, [payouts]);

  // --------------------------------------------------
  // SEARCH + FILTER
  // --------------------------------------------------

  const filteredPayouts =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      return payouts.filter(
        (payout) => {
          let matchesStatus =
            true;

          if (
            statusFilter ===
            "needs_action"
          ) {
            matchesStatus =
              payout.status ===
                "payout_requested" ||
              payout.status ===
                "processing" ||
              (
                payout.banking_status ===
                  "pending" &&
                payout.status !==
                  "paid_out"
              );
          } else if (
            statusFilter !==
            "all"
          ) {
            matchesStatus =
              payout.status ===
              statusFilter;
          }

          if (
            !matchesStatus
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable =
            [
              payout.freelancer_name,
              payout.milestone_title,
              payout.payout_reference,
              payout.bank_name,
              payout.account_holder_name,
              payout.processing_started_by_name,
              payout.paid_out_by_name,
              payout.status,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      payouts,
      searchTerm,
      statusFilter,
    ]);

  // --------------------------------------------------
  // ACTIVE + HISTORY
  // --------------------------------------------------

  const activePayouts =
    useMemo(
      () =>
        filteredPayouts.filter(
          (payout) =>
            payout.status !==
            "paid_out"
        ),
      [filteredPayouts]
    );

  const payoutHistory =
    useMemo(
      () =>
        filteredPayouts.filter(
          (payout) =>
            payout.status ===
            "paid_out"
        ),
      [filteredPayouts]
    );

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

            {/* HEADER */}

      <section className="dashboard-header">
        <p className="dashboard-badge">
          Administration
        </p>

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
            <h1>
              Payout Management
            </h1>

            <p>
              Verify banking details,
              process freelancer payouts
              and maintain a complete
              payout history.
            </p>
          </div>

          <button
            type="button"
            className="primary-action-btn"
            onClick={
              downloadCsvReport
            }
          >
            ⬇️ Download CSV Report
          </button>
        </div>
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

          marginBottom: 28,
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

      {/* SEARCH + FILTERS */}

      <section
        className="dark-card"
        style={{
          marginBottom: 28,
          padding: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            type="search"
            value={
              searchTerm
            }
            onChange={(
              event
            ) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search freelancer, milestone or payment reference..."
            style={{
              flex:
                "1 1 300px",

              minWidth: 220,

              padding:
                "12px 14px",

              borderRadius: 8,

              border:
                "1px solid rgba(255,255,255,0.15)",

              background:
                "rgba(255,255,255,0.05)",

              color:
                "inherit",
            }}
          />

          <button
            type="button"
            className={
              statusFilter ===
              "all"
                ? "primary-action-btn"
                : "secondary-action-btn"
            }
            onClick={() =>
              setStatusFilter(
                "all"
              )
            }
          >
            All ({payouts.length})
          </button>

          <button
            type="button"
            className={
              statusFilter ===
              "needs_action"
                ? "primary-action-btn"
                : "secondary-action-btn"
            }
            onClick={() =>
              setStatusFilter(
                "needs_action"
              )
            }
          >
            Needs Action (
            {needsActionCount})
          </button>

          <button
            type="button"
            className={
              statusFilter ===
              "payout_requested"
                ? "primary-action-btn"
                : "secondary-action-btn"
            }
            onClick={() =>
              setStatusFilter(
                "payout_requested"
              )
            }
          >
            Requested
          </button>

          <button
            type="button"
            className={
              statusFilter ===
              "processing"
                ? "primary-action-btn"
                : "secondary-action-btn"
            }
            onClick={() =>
              setStatusFilter(
                "processing"
              )
            }
          >
            Processing
          </button>

          <button
            type="button"
            className={
              statusFilter ===
              "paid_out"
                ? "primary-action-btn"
                : "secondary-action-btn"
            }
            onClick={() =>
              setStatusFilter(
                "paid_out"
              )
            }
          >
            Paid Out (
            {paidCount})
          </button>
        </div>

        <p
          style={{
            marginTop: 12,
            opacity: 0.75,
            fontSize: 14,
          }}
        >
          Showing{" "}
          {filteredPayouts.length}{" "}
          of {payouts.length} payout
          records.
        </p>
      </section>

      {/* ACTIVE PAYOUTS */}

      {statusFilter !==
        "paid_out" && (
        <section
          style={{
            marginBottom: 38,
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
                18,
            }}
          >
            <div>
              <h2>
                Active Payouts
              </h2>

              <p
                style={{
                  opacity:
                    0.75,

                  marginTop:
                    4,
                }}
              >
                Payouts that have not
                yet been completed.
              </p>
            </div>

            <span className="dashboard-badge">
              {
                activePayouts.length
              }{" "}
              Active
            </span>
          </div>

          {activePayouts.length ===
          0 ? (
            <div className="dark-card">
              <h3>
                No active payouts
              </h3>

              <p>
                No active payouts
                match the current
                search or filter.
              </p>
            </div>
          ) : (
            <div className="contracts-grid">

              {activePayouts.map(
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

                  const paymentForm =
                    getPaymentForm(
                      payout.id
                    );

                  return (
                    <article
                      key={
                        payout.id
                      }
                      className="dark-card contract-card"
                    >

                      {/* HEADER */}

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
                          {payoutStatusLabel(
                            payout.status
                          )}
                        </span>
                      </div>

                      {/* FINANCIAL DETAILS */}

                      <div
                        style={{
                          marginTop:
                            16,
                        }}
                      >
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
                      </div>

                      {/* BANKING */}

                      <div
                        style={{
                          marginTop:
                            22,

                          padding:
                            18,

                          border:
                            "1px solid rgba(255,255,255,0.10)",

                          borderRadius:
                            12,
                        }}
                      >
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

                                  gap:
                                    10,

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
                              22,

                            padding:
                              18,

                            border:
                              "1px solid rgba(255,255,255,0.10)",

                            borderRadius:
                              12,
                          }}
                        >
                          <h3
                            style={{
                              marginBottom:
                                12,
                            }}
                          >
                            Confirm Bank Transfer
                          </h3>

                          <p>
                            <strong>
                              Processing Started:
                            </strong>{" "}
                            {formatDate(
                              payout.processing_started_at
                            )}
                          </p>

                          {payout.processing_started_by_name && (
                            <p>
                              <strong>
                                Processing Started By:
                              </strong>{" "}
                              {payout.processing_started_by_name}
                            </p>
                          )}

                          <p
                            style={{
                              marginTop:
                                10,

                              marginBottom:
                                18,
                            }}
                          >
                            Transfer{" "}
                            <strong>
                              {money(
                                payout.freelancer_amount
                              )}
                            </strong>{" "}
                            to the verified
                            freelancer bank
                            account. Enter the
                            bank reference after
                            completing the
                            transfer.
                          </p>

                          <div
                            style={{
                              marginBottom:
                                15,
                            }}
                          >
                            <label
                              htmlFor={`reference-${payout.id}`}
                              style={{
                                display:
                                  "block",

                                fontWeight:
                                  600,

                                marginBottom:
                                  7,
                              }}
                            >
                              Payment Reference *
                            </label>

                            <input
                              id={`reference-${payout.id}`}
                              type="text"
                              value={
                                paymentForm.reference
                              }
                              maxLength={
                                120
                              }
                              disabled={
                                isUpdating
                              }
                              onChange={(
                                event
                              ) =>
                                updatePaymentForm(
                                  payout.id,
                                  "reference",
                                  event.target.value
                                )
                              }
                              placeholder="e.g. FNB-TRX-458921"
                              style={{
                                width:
                                  "100%",

                                padding:
                                  "12px 14px",

                                borderRadius:
                                  8,

                                border:
                                  "1px solid rgba(255,255,255,0.15)",

                                background:
                                  "rgba(255,255,255,0.05)",

                                color:
                                  "inherit",
                              }}
                            />
                          </div>

                          <div
                            style={{
                              marginBottom:
                                16,
                            }}
                          >
                            <label
                              htmlFor={`notes-${payout.id}`}
                              style={{
                                display:
                                  "block",

                                fontWeight:
                                  600,

                                marginBottom:
                                  7,
                              }}
                            >
                              Admin Notes
                              (optional)
                            </label>

                            <textarea
                              id={`notes-${payout.id}`}
                              value={
                                paymentForm.notes
                              }
                              maxLength={
                                1000
                              }
                              rows={
                                4
                              }
                              disabled={
                                isUpdating
                              }
                              onChange={(
                                event
                              ) =>
                                updatePaymentForm(
                                  payout.id,
                                  "notes",
                                  event.target.value
                                )
                              }
                              placeholder="Optional internal notes about this payout..."
                              style={{
                                width:
                                  "100%",

                                padding:
                                  "12px 14px",

                                borderRadius:
                                  8,

                                border:
                                  "1px solid rgba(255,255,255,0.15)",

                                background:
                                  "rgba(255,255,255,0.05)",

                                color:
                                  "inherit",

                                resize:
                                  "vertical",
                              }}
                            />
                          </div>

                          <p
                            style={{
                              marginBottom:
                                14,

                              fontSize:
                                14,

                              opacity:
                                0.8,
                            }}
                          >
                            Only confirm after
                            the money has actually
                            been transferred.
                          </p>

                          <button
                            type="button"
                            className="primary-action-btn"
                            disabled={
                              isUpdating ||
                              !bankingVerified ||
                              !paymentForm.reference.trim()
                            }
                            onClick={() =>
                              updatePayout(
                                payout,
                                "paid_out"
                              )
                            }
                          >
                            {isUpdating
                              ? "Confirming..."
                              : "Confirm Payment Sent"}
                          </button>
                        </div>
                      )}

                    </article>
                  );
                }
              )}

            </div>
          )}
        </section>
      )}

      {/* PAYOUT HISTORY */}

      {statusFilter !==
        "needs_action" &&
        statusFilter !==
          "payout_requested" &&
        statusFilter !==
          "processing" &&
        statusFilter !==
          "held" &&
        statusFilter !==
          "ready_for_payout" && (
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
                  Payout History
                </h2>

                <p
                  style={{
                    opacity:
                      0.75,

                    marginTop:
                      4,
                  }}
                >
                  Completed freelancer
                  payments and their
                  audit information.
                </p>
              </div>

              <span className="dashboard-badge">
                {
                  payoutHistory.length
                }{" "}
                Completed
              </span>
            </div>

            {payoutHistory.length ===
            0 ? (
              <div className="dark-card">
                <h3>
                  No completed payouts
                </h3>

                <p>
                  Completed payouts
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="contracts-grid">

                {payoutHistory.map(
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

                        <span className="contract-status paid_out">
                          Paid Out
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop:
                            18,
                        }}
                      >
                        <p>
                          <strong>
                            Amount Paid:
                          </strong>{" "}
                          {money(
                            payout.freelancer_amount
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
                            Gross Payment:
                          </strong>{" "}
                          {money(
                            payout.gross_amount
                          )}
                        </p>
                      </div>

                      <div
                        style={{
                          marginTop:
                            18,

                          padding:
                            16,

                          border:
                            "1px solid rgba(255,255,255,0.10)",

                          borderRadius:
                            12,
                        }}
                      >
                        <h3
                          style={{
                            marginBottom:
                              14,
                          }}
                        >
                          Audit Trail
                        </h3>

                        <p>
                          <strong>
                            Payout Requested:
                          </strong>{" "}
                          {formatDate(
                            payout.payout_requested_at
                          )}
                        </p>

                        <p>
                          <strong>
                            Processing Started:
                          </strong>{" "}
                          {formatDate(
                            payout.processing_started_at
                          )}
                        </p>

                        <p>
                          <strong>
                            Processing Started By:
                          </strong>{" "}
                          {payout.processing_started_by_name ||
                            "—"}
                        </p>

                        <p>
                          <strong>
                            Payment Confirmed:
                          </strong>{" "}
                          {formatDate(
                            payout.paid_out_at
                          )}
                        </p>

                        <p>
                          <strong>
                            Paid Out By:
                          </strong>{" "}
                          {payout.paid_out_by_name ||
                            "—"}
                        </p>

                        <p>
                          <strong>
                            Payment Reference:
                          </strong>{" "}
                          {payout.payout_reference ||
                            "—"}
                        </p>

                        {payout.payout_notes && (
                          <p>
                            <strong>
                              Admin Notes:
                            </strong>{" "}
                            {payout.payout_notes}
                          </p>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop:
                            18,

                          padding:
                            16,

                          border:
                            "1px solid rgba(255,255,255,0.10)",

                          borderRadius:
                            12,
                        }}
                      >
                        <h3
                          style={{
                            marginBottom:
                              12,
                          }}
                        >
                          Payout Destination
                        </h3>

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
                      </div>

                    </article>
                  )
                )}

              </div>
            )}
          </section>
        )}

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