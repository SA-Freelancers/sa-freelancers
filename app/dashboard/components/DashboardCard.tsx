"use client";

import { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: string;
  onClick?: () => void;
};

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  color = "#2563eb",
  onClick,
}: DashboardCardProps) {
  return (
    <div
      onClick={onClick}
      className="dark-card"
      style={{
        padding: 24,
        borderLeft: `5px solid ${color}`,
        cursor: onClick ? "pointer" : "default",
        transition: "0.25s",
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
              margin: 0,
              fontSize: 34,
            }}
          >
            {value}
          </h2>

          {subtitle && (
            <small
              style={{
                opacity: .65,
              }}
            >
              {subtitle}
            </small>
          )}

        </div>

        {icon && (
          <div
            style={{
              fontSize: 34,
            }}
          >
            {icon}
          </div>
        )}

      </div>
    </div>
  );
}