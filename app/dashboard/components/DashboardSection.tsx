"use client";

import { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export default function DashboardSection({
  title,
  children,
}: Props) {
  return (
    <section
      style={{
        marginTop: 35,
      }}
    >
      <h2
        style={{
          marginBottom: 15,
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}