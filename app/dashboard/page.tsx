"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Stats = {
  jobs: number;
  applications: number;
  contracts: number;
  saved: number;
};

type Activity = {
  id: string;
  title: string;
  description: string;
  created_at?: string;
};

type Profile = {
  role?: string;
  is_admin?: boolean;
  full_name?: string;
  bio?: string;
  category?: string;
  avatar_url?: string;
  cv_url?: string;
  portfolio_url?: string;
};

export default function DashboardPage() {
  const [role, setRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [stats, setStats] = useState<Stats>({
    jobs: 0,
    applications: 0,
    contracts: 0,
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

    await supabase
      .from("profiles")
      .update({
        last_seen: new Date().toISOString(),
      })
      .eq("id", user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setRole(profile?.role || "");
    setIsAdmin(profile?.is_admin || false);
    calculateProfileCompletion(profile || {});

    if (profile?.role === "client") {
      await loadClientDashboard(user.id);
    }

    if (profile?.role === "freelancer") {
      await loadFreelancerDashboard(user.id);
    }

    setLoading(false);
  };

  const loadClientDashboard = async (userId: string) => {
    const { count: jobsCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("client_id", userId);

    const { count: contractsCount } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("client_id", userId);

    const { count: applicationsCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true });

    const { count: savedCount } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { data: latestJobs } = await supabase
      .from("jobs")
      .select("id, title, budget, created_at")
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const jobActivities =
      latestJobs?.map((job) => ({
        id: `job-${job.id}`,
        title: "Job posted",
        description: `${job.title || "Untitled job"} • Budget ZAR ${
          job.budget || "N/A"
        }`,
        created_at: job.created_at,
      })) || [];

    setStats({
      jobs: jobsCount || 0,
      applications: applicationsCount || 0,
      contracts: contractsCount || 0,
      saved: savedCount || 0,
    });

    setActivities(jobActivities);
  };

  const loadFreelancerDashboard = async (userId: string) => {
    const { count: applicationsCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("freelancer_id", userId);

    const { count: contractsCount } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("freelancer_id", userId);

    const { count: completedCount } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("freelancer_id", userId)
      .eq("status", "completed");

    const { count: savedCount } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { data: latestApplications } = await supabase
      .from("applications")
      .select("id, status, proposed_budget, created_at")
      .eq("freelancer_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const applicationActivities =
      latestApplications?.map((app) => ({
        id: `application-${app.id}`,
        title: "Application update",
        description: `Status: ${app.status || "pending"} • ZAR ${
          app.proposed_budget || "N/A"
        }`,
        created_at: app.created_at,
      })) || [];

    setStats({
      jobs: completedCount || 0,
      applications: applicationsCount || 0,
      contracts: contractsCount || 0,
      saved: savedCount || 0,
    });

    setActivities(applicationActivities);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="dashboard-home">
      <section className="dashboard-hero dark-card">
        <div>
          <p className="dashboard-badge">
            {role === "client"
              ? "Client Dashboard"
              : role === "freelancer"
              ? "Freelancer Dashboard"
              : "Dashboard"}
          </p>

          <h1>
            {role === "client" ? (
              <>
                Manage your
                <span> hiring</span>
              </>
            ) : role === "freelancer" ? (
              <>
                Build your freelance
                <span> career faster</span>
              </>
            ) : (
              <>
                Manage your
                <span> account</span>
              </>
            )}
          </h1>

          <p className="dashboard-description">
            {role === "client"
              ? "Post jobs, review applications, hire freelancers and manage contracts from one client workspace."
              : role === "freelancer"
              ? "Find jobs, apply safely, manage contracts, upload deliveries and grow your freelance profile."
              : "Manage your account from one professional dashboard."}
          </p>
        </div>
      </section>

      <section className="dashboard-quick-actions">
        {role === "client" && (
          <>
            <Link href="/dashboard/post-job" className="dark-card quick-action-card">
              <span>➕</span>
              <h3>Post Job</h3>
              <p>Create a new project and receive freelancer proposals.</p>
            </Link>

            <Link href="/dashboard/jobs" className="dark-card quick-action-card">
              <span>💼</span>
              <h3>My Jobs</h3>
              <p>View posted jobs and manage applications.</p>
            </Link>

            <Link href="/dashboard/client-contracts" className="dark-card quick-action-card">
              <span>📨</span>
              <h3>Sent Contracts</h3>
              <p>Track contracts sent to freelancers.</p>
            </Link>
          </>
        )}

        {role === "freelancer" && (
          <>
            <Link href="/search" className="dark-card quick-action-card">
              <span>🔍</span>
              <h3>Marketplace</h3>
              <p>Find jobs and clients looking for your skills.</p>
            </Link>

            <Link href="/dashboard/contracts" className="dark-card quick-action-card">
              <span>📄</span>
              <h3>Contracts</h3>
              <p>Review hiring requests and manage accepted work.</p>
            </Link>

            <Link href="/dashboard/projects" className="dark-card quick-action-card">
              <span>📁</span>
              <h3>Projects</h3>
              <p>Track active work and project progress.</p>
            </Link>
          </>
        )}

        <Link href="/dashboard/notifications" className="dark-card quick-action-card">
          <span>🔔</span>
          <h3>Notifications</h3>
          <p>Check hiring requests, contract updates and platform alerts.</p>
        </Link>

        {isAdmin && (
          <Link href="/dashboard/admin" className="dark-card quick-action-card">
            <span>🛡️</span>
            <h3>Admin</h3>
            <p>Manage users, reports, moderation and platform activity.</p>
          </Link>
        )}
      </section>

      <section className="dark-card profile-completion-card">
        <div style={{ width: "100%" }}>
          <p className="dashboard-badge">Profile Completion</p>

          <div className="profile-progress-top">
            <h2>{profileCompletion}% Complete</h2>

            <Link href="/dashboard/profile" className="primary-action-link">
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
          <h3>{stats.jobs}</h3>
          <p>{role === "client" ? "Posted Jobs" : "Completed Jobs"}</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.applications}</h3>
          <p>{role === "client" ? "Applications Received" : "Applications Sent"}</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{stats.contracts}</h3>
          <p>{role === "client" ? "Sent Contracts" : "Contracts"}</p>
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