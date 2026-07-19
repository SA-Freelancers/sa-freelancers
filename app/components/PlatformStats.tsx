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
      console.error("Failed to load marketplace statistics:", error.message);
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

    // Refresh the figures every minute while the page is open.
    const interval = window.setInterval(loadStats, 60_000);

    // Refresh when the visitor returns to the browser tab.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadStats();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
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
    <section className="platform-stats-section">
      <div className="platform-stats-grid">
        {cards.map((card) => (
          <article key={card.label} className="platform-stat-card">
            <strong className="platform-stat-number">
              {loading ? "—" : card.value.toLocaleString("en-ZA")}
            </strong>

            <span className="platform-stat-label">
              {card.label}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}