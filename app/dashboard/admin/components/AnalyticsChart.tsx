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

export default function AnalyticsChart() {
  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],

    datasets: [
      {
        label: "New Users",

        data: [
          15,
          24,
          31,
          40,
          55,
          68,
          72,
          83,
          90,
          101,
          115,
          130,
        ],

        borderColor: "#22c55e",

        backgroundColor:
          "rgba(34,197,94,.25)",

        tension: 0.35,

        fill: true,

        pointRadius: 3,

        pointHoverRadius: 5,
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
    },

    scales: {
      x: {
        ticks: {
          color: "white",

          maxRotation: 0,

          autoSkip: true,

          maxTicksLimit: 6,
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
      <h2>
        User Growth
      </h2>

      <div className="admin-chart-container">
        <Line
          data={data}
          options={options}
        />
      </div>
    </section>
  );
}