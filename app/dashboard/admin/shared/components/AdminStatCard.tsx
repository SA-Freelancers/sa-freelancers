"use client";

import { ReactNode } from "react";

type AdminStatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?:
    | "blue"
    | "green"
    | "orange"
    | "red"
    | "purple"
    | "gray";
};

const colors = {
  blue: "#2563eb",
  green: "#16a34a",
  orange: "#ea580c",
  red: "#dc2626",
  purple: "#7c3aed",
  gray: "#64748b",
};

export default function AdminStatCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
}: AdminStatCardProps) {
  return (
    <div
      className="dark-card"
      style={{
        padding: 20,
        minWidth: 220,
        flex: 1,
        borderLeft: `5px solid ${colors[color]}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>

          <p
            style={{
              opacity: .75,
              marginBottom: 8,
            }}
          >
            {title}
          </p>

          <h2
            style={{
              fontSize: 32,
              margin: 0,
            }}
          >
            {value}
          </h2>

          {subtitle && (
            <small
              style={{
                opacity: .7,
              }}
            >
              {subtitle}
            </small>
          )}

        </div>

        {icon && (
          <div
            style={{
              fontSize: 30,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}