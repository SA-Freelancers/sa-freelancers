"use client";

import Link from "next/link";
import { ReactNode } from "react";

type QuickActionCardProps = {
  title: string;
  description: string;
  href: string;
  icon?: ReactNode;
  color?: string;
};

export default function QuickActionCard({
  title,
  description,
  href,
  icon,
  color = "#2563eb",
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="dark-card"
      style={{
        display: "block",
        padding: 22,
        borderLeft: `5px solid ${color}`,
        textDecoration: "none",
        transition: "0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        {icon && (
          <div
            style={{
              fontSize: 30,
            }}
          >
            {icon}
          </div>
        )}

        <div>
          <h3 style={{ margin: 0 }}>
            {title}
          </h3>

          <p
            style={{
              marginTop: 8,
              opacity: 0.75,
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}