"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type MonthlyGrowth = {
  label: string;
  count: number;
};

type AnalyticsChartProps = {
  monthlyGrowth: MonthlyGrowth[];
};

export default function AnalyticsChart({
  monthlyGrowth,
}: AnalyticsChartProps) {
  const labels = monthlyGrowth.map(
    (item) => item.label
  );

  const values = monthlyGrowth.map(
    (item) => item.count
  );

  const data = {
    labels,

    datasets: [
      {
        label: "New Users",

        data: values,

        borderColor: "#22c55e",

        backgroundColor:
          "rgba(34,197,94,.18)",

        tension: 0.3,

        fill: true,

        pointRadius: 4,

        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        labels: {
          color: "white",

          boxWidth: 14,

          padding: 14,
        },
      },

      tooltip: {
        callbacks: {
          label: (
            context: {
              parsed: {
                y: number | null;
              };
            }
          ) =>
            `${
              context.parsed.y ?? 0
            } new user${
              context.parsed.y === 1
                ? ""
                : "s"
            }`,
        },
      },
    },

    scales: {
      x: {
        ticks: {
          color: "white",

          maxRotation: 0,

          autoSkip: true,

          maxTicksLimit: 12,
        },

        grid: {
          color:
            "rgba(255,255,255,.05)",
        },
      },

      y: {
        beginAtZero: true,

        ticks: {
          color: "white",

          precision: 0,
        },

        grid: {
          color:
            "rgba(255,255,255,.05)",
        },
      },
    },
  };

  return (
    <section className="dark-card admin-analytics-card">
      <div>
        <h2>
          User Growth
        </h2>

        <p
          style={{
            marginTop: 6,
            opacity: 0.65,
            fontSize: 13,
          }}
        >
          Actual new registrations
          during the last 12 months
        </p>
      </div>

      <div className="admin-chart-container">
        {monthlyGrowth.length >
        0 ? (
          <Line
            data={data}
            options={options}
          />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              opacity: 0.65,
            }}
          >
            No registration data
            available yet.
          </div>
        )}
      </div>
    </section>
  );
}