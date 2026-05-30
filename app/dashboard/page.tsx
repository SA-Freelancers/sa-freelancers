"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Stats = {
  projects: number;
  applications: number;
  completed: number;
  saved: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    applications: 0,
    completed: 0,
    saved: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { count: projectsCount } = await supabase
      .from("jobs")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("client_id", user.id);

    const { count: applicationsCount } = await supabase
      .from("applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("freelancer_id", user.id);

    const { count: completedCount } = await supabase
      .from("applications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("freelancer_id", user.id)
      .eq("status", "accepted");

    const { count: savedCount } = await supabase
      .from("favorites")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id);

    setStats({
      projects: projectsCount || 0,
      applications: applicationsCount || 0,
      completed: completedCount || 0,
      saved: savedCount || 0,
    });

    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="dashboard-home">
      <section className="dashboard-hero dark-card">
        <div>
          <p className="dashboard-badge">Welcome back</p>

          <h1>
            Build your freelance
            <span> career faster</span>
          </h1>

          <p className="dashboard-description">
            Manage projects, applications, uploads and freelancers from one
            professional dashboard.
          </p>
        </div>
      </section>

      <section className="dashboard-stats">
        <div className="dark-card stat-card">
          <h3>{stats.projects}</h3>
          <p>Active Projects</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.applications}</h3>
          <p>Applications</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.completed}</h3>
          <p>Completed Jobs</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.saved}</h3>
          <p>Saved Items</p>
        </div>
      </section>

      <section className="dark-card dashboard-activity">
        <h2>Platform Activity</h2>

        <div className="activity-item">
          <div className="activity-dot" />
          <p>You currently have {stats.projects} active projects.</p>
        </div>

        <div className="activity-item">
          <div className="activity-dot" />
          <p>{stats.applications} applications submitted so far.</p>
        </div>

        <div className="activity-item">
          <div className="activity-dot" />
          <p>{stats.saved} marketplace items saved.</p>
        </div>
      </section>
    </div>
  );
}