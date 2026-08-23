"use client";

import {
  Bar,
} from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type MonthRow = {
  month: string;
  gross: number;
  fees: number;
  freelancer: number;
};

export default function MonthlyFinanceChart({
  rows,
}: {
  rows: MonthRow[];
}) {
  const data = {
    labels:
      rows.map(
        (row) =>
          row.month
      ),

    datasets: [
      {
        label:
          "Gross Client Payments",

        data:
          rows.map(
            (row) =>
              row.gross
          ),
      },
      {
        label:
          "Platform Fees",

        data:
          rows.map(
            (row) =>
              row.fees
          ),
      },
      {
        label:
          "Freelancer Net",

        data:
          rows.map(
            (row) =>
              row.freelancer
          ),
      },
    ],
  };

  const options = {
    responsive:
      true,

    maintainAspectRatio:
      false,

    plugins: {
      legend: {
        position:
          "top" as const,
      },

      title: {
        display:
          false,
      },
    },

    scales: {
      y: {
        beginAtZero:
          true,

        ticks: {
          callback: (
            value:
              string |
              number
          ) =>
            `R ${Number(
              value
            ).toLocaleString(
              "en-ZA"
            )}`,
        },
      },
    },
  };

  return (
    <div
      className="dark-card"
      style={{
        marginTop: 30,
        padding: 20,
      }}
    >
      <h2>
        Monthly Financial Performance
      </h2>

      <p
        style={{
          marginTop: 6,
          opacity: 0.75,
        }}
      >
        Gross payments,
        platform fees and
        freelancer net amounts
        by month.
      </p>

      <div
        style={{
          height: 380,
          marginTop: 20,
        }}
      >
        <Bar
          data={
            data
          }
          options={
            options
          }
        />
      </div>
    </div>
  );
}