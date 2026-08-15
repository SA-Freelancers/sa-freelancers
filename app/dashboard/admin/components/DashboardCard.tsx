"use client";

import React from "react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
};

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
}: DashboardCardProps) {
  return (
    <div
      className="dark-card"
      style={{
        padding: "24px",
        borderRadius: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: "120px",
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            opacity: 0.7,
          }}
        >
          {title}
        </p>

        <h2
          style={{
            margin: "8px 0",
            fontSize: "32px",
            fontWeight: 700,
          }}
        >
          {value}
        </h2>

        {subtitle && (
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              opacity: 0.65,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          fontSize: "42px",
        }}
      >
        {icon}
      </div>
    </div>
  );
}