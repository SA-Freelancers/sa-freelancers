"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState(0);
  const [freelancers, setFreelancers] = useState(0);
  const [clients, setClients] = useState(0);
  const [jobs, setJobs] = useState(0);
  const [applications, setApplications] = useState(0);
  const [contracts, setContracts] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: freelancerCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "freelancer");

    const { count: clientCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "client");

    const { count: jobCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true });

    const { count: applicationCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true });

    const { count: contractCount } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true });

    setUsers(userCount || 0);
    setFreelancers(freelancerCount || 0);
    setClients(clientCount || 0);
    setJobs(jobCount || 0);
    setApplications(applicationCount || 0);
    setContracts(contractCount || 0);

    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="dashboard-home">
      <section className="dashboard-hero dark-card">
        <div>
          <p className="dashboard-badge">Admin Dashboard</p>

          <h1>Platform Analytics</h1>

          <p>
            Monitor users, jobs, contracts and marketplace activity.
          </p>
        </div>
      </section>

      <section className="dashboard-stats">
        <div className="dark-card stat-card">
          <h3>{users}</h3>
          <p>Total Users</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{freelancers}</h3>
          <p>Freelancers</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{clients}</h3>
          <p>Clients</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{jobs}</h3>
          <p>Jobs</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{applications}</h3>
          <p>Applications</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{contracts}</h3>
          <p>Contracts</p>
        </div>
      </section>
      <section className="dashboard-quick-actions">
  <a href="/dashboard/admin/users" className="dark-card quick-action-card">
    <span>👥</span>
    <h3>Manage Users</h3>
    <p>View, suspend and unsuspend platform users.</p>
  </a>

  <a href="/dashboard/admin/reports" className="dark-card quick-action-card">
    <span>🚩</span>
    <h3>Review Reports</h3>
    <p>Resolve or dismiss reports submitted by users.</p>
  </a>

  <a href="/dashboard/admin/moderation" className="dark-card quick-action-card">
    <span>🛡️</span>
    <h3>Moderation Center</h3>
    <p>Review suspicious activity and safety issues.</p>
  </a>
</section>
<section className="dark-card dashboard-activity">
  <h2>Admin Tasks</h2>

  <div className="activity-item">
    <div className="activity-dot" />
    <div>
      <strong>User Management</strong>
      <p>Review new registrations and account status.</p>
    </div>
  </div>

  <div className="activity-item">
    <div className="activity-dot" />
    <div>
      <strong>Reports Queue</strong>
      <p>Check reported users and project disputes.</p>
    </div>
  </div>

  <div className="activity-item">
    <div className="activity-dot" />
    <div>
      <strong>Platform Monitoring</strong>
      <p>Monitor jobs, applications and contracts.</p>
    </div>
  </div>
</section>
    </main>
  );
}