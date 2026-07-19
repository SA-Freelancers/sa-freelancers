"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type HealthStats = {
  realFreelancers: number;
  demoFreelancers: number;
  realClients: number;
  demoClients: number;
  realJobs: number;
  demoJobs: number;
  realApplications: number;
  demoApplications: number;
  demoJobsExpiringToday: number;
};

const initialStats: HealthStats = {
  realFreelancers: 0,
  demoFreelancers: 0,
  realClients: 0,
  demoClients: 0,
  realJobs: 0,
  demoJobs: 0,
  realApplications: 0,
  demoApplications: 0,
  demoJobsExpiringToday: 0,
};

export default function MarketplaceHealthPage() {
  const [stats, setStats] = useState<HealthStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    const now = new Date();
    const next24Hours = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    const [
      realFreelancers,
      demoFreelancers,
      realClients,
      demoClients,
      realJobs,
      demoJobs,
      realApplications,
      demoApplications,
      expiringJobs,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "freelancer")
        .eq("suspended", false),

      supabase
        .from("demo_freelancers")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "client")
        .eq("suspended", false),

      supabase
        .from("demo_clients")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("is_demo", false),

      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("is_demo", true),

      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("is_demo", false),

      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("is_demo", true),

      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("is_demo", true)
        .not("demo_expires_at", "is", null)
        .gte("demo_expires_at", now.toISOString())
        .lte("demo_expires_at", next24Hours.toISOString()),
    ]);

    const errors = [
      realFreelancers.error,
      demoFreelancers.error,
      realClients.error,
      demoClients.error,
      realJobs.error,
      demoJobs.error,
      realApplications.error,
      demoApplications.error,
      expiringJobs.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error("Marketplace health errors:", errors);
      setMessage(
        "Some marketplace statistics could not be loaded. Check the browser console."
      );
    }

    setStats({
      realFreelancers: realFreelancers.count ?? 0,
      demoFreelancers: demoFreelancers.count ?? 0,
      realClients: realClients.count ?? 0,
      demoClients: demoClients.count ?? 0,
      realJobs: realJobs.count ?? 0,
      demoJobs: demoJobs.count ?? 0,
      realApplications: realApplications.count ?? 0,
      demoApplications: demoApplications.count ?? 0,
      demoJobsExpiringToday: expiringJobs.count ?? 0,
    });

    setLoading(false);
  };

  const refreshDemoMarketplace = async () => {
    setRefreshing(true);
    setMessage("Refreshing demo marketplace...");

    const { error } = await supabase.rpc(
      "run_daily_marketplace_refresh"
    );

    if (error) {
      setMessage(error.message);
      setRefreshing(false);
      return;
    }

    await loadHealth();
    setMessage("Demo jobs and freelancers refreshed successfully.");
    setRefreshing(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Admin</p>
          <h1>Access Restricted</h1>
          <p>Only admins can view marketplace health.</p>
        </section>
      </main>
    );
  }

  const totalReal =
    stats.realFreelancers +
    stats.realClients +
    stats.realJobs +
    stats.realApplications;

  const totalDemo =
    stats.demoFreelancers +
    stats.demoClients +
    stats.demoJobs +
    stats.demoApplications;

  const cards = [
    {
      label: "Real Freelancers",
      value: stats.realFreelancers,
    },
    {
      label: "Demo Freelancers",
      value: stats.demoFreelancers,
    },
    {
      label: "Real Clients",
      value: stats.realClients,
    },
    {
      label: "Demo Clients",
      value: stats.demoClients,
    },
    {
      label: "Real Jobs",
      value: stats.realJobs,
    },
    {
      label: "Demo Jobs",
      value: stats.demoJobs,
    },
    {
      label: "Real Applications",
      value: stats.realApplications,
    },
    {
      label: "Demo Applications",
      value: stats.demoApplications,
    },
    {
      label: "Demo Jobs Expiring Today",
      value: stats.demoJobsExpiringToday,
    },
  ];

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Admin Marketplace Health
        </p>

        <h1>Marketplace Health Dashboard</h1>

        <p>
          Monitor real activity, demo activity, expiring demo jobs and
          the overall balance of the platform.
        </p>

        <div className="contract-actions" style={{ marginTop: 22 }}>
          <button
            onClick={refreshDemoMarketplace}
            disabled={refreshing}
            className="accept-btn"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh Demo Marketplace"}
          </button>

          <button
            onClick={loadHealth}
            disabled={refreshing}
            className="secondary-action-btn"
          >
            Reload Statistics
          </button>
        </div>

        {message && <p className="upload-message">{message}</p>}
      </section>

      <section className="dashboard-stats">
        {cards.map((card) => (
          <div key={card.label} className="dark-card stat-card">
            <h3>{card.value.toLocaleString("en-ZA")}</h3>
            <p>{card.label}</p>
          </div>
        ))}
      </section>

      <section className="profile-layout" style={{ marginTop: 32 }}>
        <div className="dark-card profile-card">
          <h2>Real Marketplace Activity</h2>

          <p>
            <strong>Total real activity:</strong>{" "}
            {totalReal.toLocaleString("en-ZA")}
          </p>

          <p>
            These are actual users, jobs and applications created by
            real users. As this figure grows, demo activity can be
            reduced gradually.
          </p>
        </div>

        <div className="dark-card profile-card">
          <h2>Demo Marketplace Activity</h2>

          <p>
            <strong>Total demo activity:</strong>{" "}
            {totalDemo.toLocaleString("en-ZA")}
          </p>

          <p>
            Demo freelancers and clients are stored separately from real
            profiles. Demo jobs rotate automatically to keep the
            marketplace active.
          </p>
        </div>
      </section>
    </main>
  );
}