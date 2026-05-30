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

type Activity = {
  id: string;
  title: string;
  description: string;
  created_at?: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    applications: 0,
    completed: 0,
    saved: 0,
  });

  const [activities, setActivities] = useState<Activity[]>([]);
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
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id);

    const { count: applicationsCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("freelancer_id", user.id);

    const { count: completedCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("freelancer_id", user.id)
      .eq("status", "accepted");

    const { count: savedCount } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { data: latestApplications } = await supabase
      .from("applications")
      .select("id, status, proposed_budget, created_at")
      .eq("freelancer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    const { data: latestJobs } = await supabase
      .from("jobs")
      .select("id, title, budget, created_at")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    const applicationActivities =
      latestApplications?.map((app) => ({
        id: `application-${app.id}`,
        title: "Application update",
        description: `Application status: ${app.status || "pending"} • ZAR ${
          app.proposed_budget || "N/A"
        }`,
        created_at: app.created_at,
      })) || [];

    const jobActivities =
      latestJobs?.map((job) => ({
        id: `job-${job.id}`,
        title: "Project created",
        description: `${job.title || "Untitled job"} • Budget ZAR ${
          job.budget || "N/A"
        }`,
        created_at: job.created_at,
      })) || [];

    const combinedActivities = [...applicationActivities, ...jobActivities]
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    setStats({
      projects: projectsCount || 0,
      applications: applicationsCount || 0,
      completed: completedCount || 0,
      saved: savedCount || 0,
    });

    setActivities(combinedActivities);
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
        <h2>Recent Activity</h2>

        {activities.length === 0 ? (
          <p>No recent activity yet.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-dot" />

              <div>
                <strong>{activity.title}</strong>
                <p>{activity.description}</p>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}