"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/app/lib/supabase";
import MonthlyFinanceChart from "./MonthlyFinanceChart";

type Period =
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "year"
  | "all";

type MonthlyFinanceRow = {
  month: string;
  gross: number;
  fees: number;
  freelancer: number;
};

type ReconciliationResponse = {
  success?: boolean;

  period?: Period;

  range?: {
    from?: string | null;
    to?: string | null;
  };

  totals?: {
    grossClientPayments: number;
    platformFeesEarned: number;
    freelancerNetAmount: number;
    held: number;
    ready: number;
    requested: number;
    processing: number;
    paidOut: number;
  };

  counts?: {
    paymentsReceived: number;
    payoutsCompleted: number;
    outstandingPayouts: number;
    totalRecords: number;
  };

  accounting?: {
    expectedGross: number;
    difference: number;
    balanced: boolean;
  };

  monthly?: MonthlyFinanceRow[];

  error?: string;
};

const emptyData: ReconciliationResponse = {
  totals: {
    grossClientPayments: 0,
    platformFeesEarned: 0,
    freelancerNetAmount: 0,
    held: 0,
    ready: 0,
    requested: 0,
    processing: 0,
    paidOut: 0,
  },

  counts: {
    paymentsReceived: 0,
    payoutsCompleted: 0,
    outstandingPayouts: 0,
    totalRecords: 0,
  },

  accounting: {
    expectedGross: 0,
    difference: 0,
    balanced: true,
  },

  monthly: [],
};

export default function AdminFinancePage() {
  const [period, setPeriod] =
    useState<Period>("month");

  const [data, setData] =
    useState<ReconciliationResponse>(
      emptyData
    );

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const loadFinance =
    useCallback(async () => {
      setLoading(true);
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
            `/api/admin/finance/reconciliation?period=${period}`,
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

        let result:
          ReconciliationResponse = {};

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
              "Unable to load financial reconciliation."
          );

          return;
        }

        setData(result);
      } catch (error) {
        console.error(
          "Finance dashboard loading error:",
          error
        );

        setMessage(
          "Unable to load financial reconciliation."
        );
      } finally {
        setLoading(false);
      }
    }, [period]);

  useEffect(() => {
    loadFinance();
  }, [loadFinance]);

  const totals =
    data.totals ||
    emptyData.totals!;

  const counts =
    data.counts ||
    emptyData.counts!;

  const accounting =
    data.accounting ||
    emptyData.accounting!;

  const monthly =
    data.monthly || [];

  const money = (
    value: number
  ) =>
    `R ${Number(
      value || 0
    ).toLocaleString(
      "en-ZA",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  const periodLabel =
    useMemo(() => {
      switch (period) {
        case "today":
          return "Today";

        case "7d":
          return "Last 7 Days";

        case "30d":
          return "Last 30 Days";

        case "month":
          return "This Month";

        case "year":
          return "This Year";

        case "all":
          return "All Time";

        default:
          return "This Month";
      }
    }, [period]);

  if (loading) {
    return (
      <main className="dashboard-page">
        <h1>
          Financial Reconciliation
        </h1>

        <p>
          Loading financial data...
        </p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">

      {/* HEADER */}

      <section className="dashboard-header">
        <p className="dashboard-badge">
          Administration
        </p>

        <h1>
          Financial Reconciliation
        </h1>

        <p>
          Track client payments,
          platform revenue,
          freelancer liabilities
          and completed payouts.
        </p>
      </section>

      {message && (
        <p className="upload-message">
          {message}
        </p>
      )}

      {/* PERIOD FILTER */}

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
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3>
              Reporting Period
            </h3>

            <p
              style={{
                opacity: 0.75,
                marginTop: 4,
              }}
            >
              {periodLabel}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <PeriodButton
              label="Today"
              value="today"
              current={period}
              onChange={setPeriod}
            />

            <PeriodButton
              label="7 Days"
              value="7d"
              current={period}
              onChange={setPeriod}
            />

            <PeriodButton
              label="30 Days"
              value="30d"
              current={period}
              onChange={setPeriod}
            />

            <PeriodButton
              label="This Month"
              value="month"
              current={period}
              onChange={setPeriod}
            />

            <PeriodButton
              label="This Year"
              value="year"
              current={period}
              onChange={setPeriod}
            />

            <PeriodButton
              label="All Time"
              value="all"
              current={period}
              onChange={setPeriod}
            />
          </div>
        </div>
      </section>

      {/* FINANCIAL OVERVIEW */}

      <section
        style={{
          marginBottom: 32,
        }}
      >
        <h2
          style={{
            marginBottom: 16,
          }}
        >
          Financial Overview
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 15,
          }}
        >
          <FinanceCard
            title="Gross Client Payments"
            amount={money(
              totals.grossClientPayments
            )}
          />

          <FinanceCard
            title="Platform Fees Earned"
            amount={money(
              totals.platformFeesEarned
            )}
          />

          <FinanceCard
            title="Freelancer Net Amount"
            amount={money(
              totals.freelancerNetAmount
            )}
          />
        </div>
      </section>

      {/* PAYOUT LIABILITY */}

      <section
        style={{
          marginBottom: 32,
        }}
      >
        <h2
          style={{
            marginBottom: 16,
          }}
        >
          Payout Liability
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 15,
          }}
        >
          <FinanceCard
            title="Currently Held"
            amount={money(
              totals.held
            )}
          />

          <FinanceCard
            title="Ready for Payout"
            amount={money(
              totals.ready
            )}
          />

          <FinanceCard
            title="Payout Requested"
            amount={money(
              totals.requested
            )}
          />

          <FinanceCard
            title="Processing"
            amount={money(
              totals.processing
            )}
          />
        </div>
      </section>

      {/* COMPLETED */}

      <section
        style={{
          marginBottom: 32,
        }}
      >
        <h2
          style={{
            marginBottom: 16,
          }}
        >
          Completed Payouts
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 15,
          }}
        >
          <FinanceCard
            title="Paid Out"
            amount={money(
              totals.paidOut
            )}
          />

          <CountCard
            title="Payouts Completed"
            value={
              counts.payoutsCompleted
            }
          />

          <CountCard
            title="Outstanding Payouts"
            value={
              counts.outstandingPayouts
            }
          />
        </div>
      </section>

      {/* TRANSACTIONS */}

      <section
        style={{
          marginBottom: 32,
        }}
      >
        <h2
          style={{
            marginBottom: 16,
          }}
        >
          Transactions
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 15,
          }}
        >
          <CountCard
            title="Payments Received"
            value={
              counts.paymentsReceived
            }
          />

          <CountCard
            title="Total Payout Records"
            value={
              counts.totalRecords
            }
          />
        </div>
      </section>

      {/* MONTHLY FINANCIAL PERFORMANCE */}

      <section
        style={{
          marginBottom: 32,
        }}
      >
        {monthly.length > 0 ? (
          <MonthlyFinanceChart
            rows={monthly}
          />
        ) : (
          <div
            className="dark-card"
            style={{
              padding: 20,
            }}
          >
            <h2>
              Monthly Financial Performance
            </h2>

            <p
              style={{
                marginTop: 8,
                opacity: 0.75,
              }}
            >
              No financial transactions
              are available for the
              selected reporting period.
            </p>
          </div>
        )}
      </section>

      {/* ACCOUNTING CHECK */}

      <section className="dark-card">
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="dashboard-badge">
              Reconciliation Check
            </p>

            <h2>
              Accounting Balance
            </h2>

            <p
              style={{
                marginTop: 8,
              }}
            >
              Gross client payments
              should equal platform
              fees plus the freelancer
              net amount.
            </p>
          </div>

          <span
            className={`contract-status ${
              accounting.balanced
                ? "verified"
                : "rejected"
            }`}
          >
            {accounting.balanced
              ? "Balanced"
              : "Difference Found"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 15,
            marginTop: 22,
          }}
        >
          <FinanceCard
            title="Gross Payments"
            amount={money(
              totals.grossClientPayments
            )}
          />

          <FinanceCard
            title="Expected Gross"
            amount={money(
              accounting.expectedGross
            )}
          />

          <FinanceCard
            title="Difference"
            amount={money(
              accounting.difference
            )}
          />
        </div>
      </section>
    </main>
  );
}

function PeriodButton({
  label,
  value,
  current,
  onChange,
}: {
  label: string;
  value: Period;
  current: Period;
  onChange: (
    value: Period
  ) => void;
}) {
  const active =
    current === value;

  return (
    <button
      type="button"
      className={
        active
          ? "primary-action-btn"
          : "secondary-action-btn"
      }
      onClick={() =>
        onChange(value)
      }
    >
      {label}
    </button>
  );
}

function FinanceCard({
  title,
  amount,
}: {
  title: string;
  amount: string;
}) {
  return (
    <div className="dark-card">
      <p>
        {title}
      </p>

      <h2
        style={{
          marginTop: 8,
        }}
      >
        {amount}
      </h2>
    </div>
  );
}

function CountCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="dark-card">
      <p>
        {title}
      </p>

      <h2
        style={{
          marginTop: 8,
        }}
      >
        {Number(
          value || 0
        ).toLocaleString(
          "en-ZA"
        )}
      </h2>
    </div>
  );
}