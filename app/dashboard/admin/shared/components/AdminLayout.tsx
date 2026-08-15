"use client";

import { ReactNode } from "react";

type AdminLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export default function AdminLayout({
  title,
  description,
  children,
  actions,
}: AdminLayoutProps) {
  return (
    <main className="contracts-page">

      <section className="contracts-header dark-card">

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="dashboard-badge">
              Administration
            </p>

            <h1>{title}</h1>

            {description && (
              <p>{description}</p>
            )}
          </div>

          <div>{actions}</div>
        </div>

      </section>

      {children}

    </main>
  );
}