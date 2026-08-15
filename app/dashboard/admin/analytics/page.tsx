"use client";

import Link from "next/link";

export default function AnalyticsPage() {
  return (
    <main className="contracts-page">

      <section className="contracts-header dark-card">

        <p className="dashboard-badge">
          Administration
        </p>

        <h1>Platform Analytics</h1>

        <p>
          View trends, growth and platform performance.
        </p>

        <div
          style={{
            marginTop:20
          }}
        >
          <Link
            href="/dashboard/admin"
            className="accept-btn"
          >
            ← Back to Dashboard
          </Link>
        </div>

      </section>

    </main>
  );
}