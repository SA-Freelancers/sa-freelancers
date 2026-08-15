"use client";

import { ReactNode } from "react";

export default function DashboardGrid({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",

        gap: 20,

        gridTemplateColumns:
          "repeat(auto-fit,minmax(220px,1fr))",

        marginTop: 20,
      }}
    >
      {children}
    </div>
  );
}