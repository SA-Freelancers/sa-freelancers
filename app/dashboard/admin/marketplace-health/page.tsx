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

export default function MarketplaceHealthPage() {
  const [stats, setStats] = useState<HealthStats>({
    realFreelancers: 0,
    demoFreelancers: 0,
    realClients: 0,
    demoClients: 0,
    realJobs: 0,
    demoJobs: 0,
    realApplications: 0,
    demoApplications: 0,
    demoJobsExpiringToday: 0,
  });

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

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
        .select("*", { count: "exact", head: true })
        .eq("role", "freelancer")
        .eq("is_demo", false),

      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "freelancer")
        .eq("is_demo", true),

      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client")
        .eq("is_demo", false),

      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client")
        .eq("is_demo", true),

      supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("is_demo", false),

      supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("is_demo", true),

      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("is_demo", false),

      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("is_demo", true),

      supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("is_demo", true)
        .gte("demo_expires_at", new Date().toISOString())
        .lte(
          "demo_expires_at",
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

    setStats({
      realFreelancers: realFreelancers.count || 0,
      demoFreelancers: demoFreelancers.count || 0,
      realClients: realClients.count || 0,
      demoClients: demoClients.count || 0,
      realJobs: realJobs.count || 0,
      demoJobs: demoJobs.count || 0,
      realApplications: realApplications.count || 0,
      demoApplications: demoApplications.count || 0,
      demoJobsExpiringToday: expiringJobs.count || 0,
    });

    setLoading(false);
  };

  const refreshDemoMarketplace = async () => {
    setMessage("Refreshing demo marketplace...");

    const { error } = await supabase.rpc("refresh_demo_marketplace");

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Demo marketplace refreshed successfully.");
    loadHealth();
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

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin Marketplace Health</p>

        <h1>Marketplace Health Dashboard</h1>

        <p>
          Monitor real activity, demo activity, expiring demo jobs and the
          overall balance of the platform.
        </p>

        <div className="contract-actions" style={{ marginTop: 22 }}>
          <button onClick={refreshDemoMarketplace} className="accept-btn">
            Refresh Demo Marketplace
          </button>
        </div>

        {message && <p className="upload-message">{message}</p>}
      </section>

      <section className="dashboard-stats">
        <div className="dark-card stat-card">
          <h3>{stats.realFreelancers}</h3>
          <p>Real Freelancers</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.demoFreelancers}</h3>
          <p>Demo Freelancers</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.realClients}</h3>
          <p>Real Clients</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.demoClients}</h3>
          <p>Demo Clients</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.realJobs}</h3>
          <p>Real Jobs</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.demoJobs}</h3>
          <p>Demo Jobs</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.realApplications}</h3>
          <p>Real Applications</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.demoApplications}</h3>
          <p>Demo Applications</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.demoJobsExpiringToday}</h3>
          <p>Demo Jobs Expiring Today</p>
        </div>
      </section>

      <section className="profile-layout" style={{ marginTop: 32 }}>
        <div className="dark-card profile-card">
          <h2>Real Marketplace Activity</h2>

          <p>
            <strong>Total real activity:</strong> {totalReal}
          </p>

          <p>
            These are actual users, jobs and applications created by real users.
            As this number grows, you can slowly reduce demo activity.
          </p>
        </div>

        <div className="dark-card profile-card">
          <h2>Demo Marketplace Activity</h2>

          <p>
            <strong>Total demo activity:</strong> {totalDemo}
          </p>

          <p>
            Demo content keeps the marketplace active while Freelance Hub SA is
            still growing. Demo jobs expire automatically after 14 days.
          </p>
        </div>
      </section>
    </main>
  );
}