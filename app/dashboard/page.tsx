"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type Profile = {
  full_name?: string;
  bio?: string;
  category?: string;
  avatar_url?: string;
  cv_url?: string;
  portfolio_url?: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    applications: 0,
    completed: 0,
    saved: 0,
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const calculateProfileCompletion = (profile: Profile) => {
    const checks = [
      !!profile.full_name,
      !!profile.bio,
      !!profile.category,
      !!profile.avatar_url,
      !!profile.cv_url,
      !!profile.portfolio_url,
    ];

    const missing = [];

    if (!profile.full_name) missing.push("Full Name");
    if (!profile.bio) missing.push("Bio");
    if (!profile.category) missing.push("Category");
    if (!profile.avatar_url) missing.push("Profile Picture");
    if (!profile.cv_url) missing.push("CV Upload");
    if (!profile.portfolio_url) missing.push("Portfolio Upload");

    const completed = checks.filter(Boolean).length;
    const percentage = Math.round((completed / checks.length) * 100);

    setProfileCompletion(percentage);
    setMissingItems(missing);
  };

  const loadDashboard = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    calculateProfileCompletion(profile || {});

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

      <section className="dashboard-quick-actions">
        <Link
          href="/dashboard/jobs/new"
          className="dark-card quick-action-card"
        >
          <span>➕</span>
          <h3>Post Job</h3>
          <p>Create a new project and receive freelancer proposals.</p>
        </Link>

        <Link href="/search" className="dark-card quick-action-card">
          <span>🔍</span>
          <h3>Find Freelancers</h3>
          <p>Browse skilled professionals across categories.</p>
        </Link>

        <Link
          href="/dashboard/projects"
          className="dark-card quick-action-card"
        >
          <span>📁</span>
          <h3>Manage Projects</h3>
          <p>Track proposals, projects and client activity.</p>
        </Link>
        <Link
  href="/dashboard/contracts"
  className="dark-card quick-action-card"
>
  <span>📄</span>
  <h3>Contracts</h3>
  <p>Review hiring requests and manage accepted work.</p>
</Link>
<Link
  href="/dashboard/notifications"
  className="dark-card quick-action-card"
>
  <span>🔔</span>
  <h3>Notifications</h3>
  <p>Check hiring requests, contract updates and platform alerts.</p>
</Link>
      </section>

      <section className="dark-card profile-completion-card">
        <div style={{ width: "100%" }}>
          <p className="dashboard-badge">Profile Completion</p>

          <div className="profile-progress-top">
            <h2>{profileCompletion}% Complete</h2>

            <Link
              href="/dashboard/profile"
              className="primary-action-link"
            >
              Complete Profile
            </Link>
          </div>

          <div className="profile-progress-bar">
            <div
              className="profile-progress-fill"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>

          {missingItems.length > 0 && (
            <div className="profile-missing-list">
              <strong>Missing:</strong>

              <div className="profile-tags">
                {missingItems.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          )}
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