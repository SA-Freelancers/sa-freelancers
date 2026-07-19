"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type MarketplaceStats = {
  freelancers: number;
  clients: number;
  jobs_posted: number;
  applications_sent: number;
};

const emptyStats: MarketplaceStats = {
  freelancers: 0,
  clients: 0,
  jobs_posted: 0,
  applications_sent: 0,
};

export default function PlatformStats() {
  const [stats, setStats] = useState<MarketplaceStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const { data, error } = await supabase.rpc(
      "get_public_marketplace_stats"
    );

    if (error) {
      console.error(
        "Failed to load marketplace statistics:",
        error.message
      );
      setLoading(false);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (result) {
      setStats({
        freelancers: Number(result.freelancers || 0),
        clients: Number(result.clients || 0),
        jobs_posted: Number(result.jobs_posted || 0),
        applications_sent: Number(result.applications_sent || 0),
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();

    const interval = window.setInterval(loadStats, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadStats]);

  const cards = [
    {
      label: "Freelancers",
      value: stats.freelancers,
    },
    {
      label: "Clients",
      value: stats.clients,
    },
    {
      label: "Jobs Posted",
      value: stats.jobs_posted,
    },
    {
      label: "Applications Sent",
      value: stats.applications_sent,
    },
  ];

  return (
    <section
      style={{
        width: "100%",
        padding: "56px 24px",
        background: "#020617",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "22px",
        }}
      >
        {cards.map((card) => (
          <article
            key={card.label}
            style={{
              minHeight: "170px",
              padding: "28px 20px",
              borderRadius: "22px",
              background: "#1e293b",
              border: "1px solid #334155",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <strong
              style={{
                display: "block",
                fontSize: "2.8rem",
                lineHeight: 1,
                fontWeight: 800,
                color: "#f8fafc",
                marginBottom: "18px",
              }}
            >
              {loading
                ? "—"
                : card.value.toLocaleString("en-ZA")}
            </strong>

            <span
              style={{
                display: "block",
                fontSize: "1rem",
                color: "#cbd5e1",
              }}
            >
              {card.label}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}