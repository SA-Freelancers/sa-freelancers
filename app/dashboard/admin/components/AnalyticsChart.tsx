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

        backgroundColor: "rgba(34,197,94,.25)",

        tension: .35,

        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,

    plugins: {

      legend: {

        labels: {

          color: "white",

        },

      },

    },

    scales: {

      x: {

        ticks: {

          color: "white",

        },

      },

      y: {

        ticks: {

          color: "white",

        },

      },

    },

  };

  return (

    <section
      className="dark-card"
      style={{
        padding: 24,
        marginTop: 24,
      }}
    >

      <h2>User Growth</h2>

      <div
        style={{
          marginTop: 20,
        }}
      >

        <Line
          data={data}
          options={options}
        />

      </div>

    </section>

  );

}