"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

import DashboardHeader from "./components/DashboardHeader";
import DashboardStats from "./components/DashboardStats";
import AnalyticsChart from "./components/AnalyticsChart";
import PlatformHealth from "./components/PlatformHealth";
import RecentUsers from "./components/RecentUsers";
import RecentJobs from "./components/RecentJobs";
import DashboardQuickActions from "./components/DashboardQuickActions";
import DashboardActivity from "./components/DashboardActivity";

import type { UserProfile } from "./users/types";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);

  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    freelancers: 0,
    clients: 0,
    jobs: 0,
    applications: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [
        totalUsers,
        freelancers,
        clients,
        jobs,
        applications,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "freelancer"),

        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "client"),

        supabase
          .from("jobs")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("applications")
          .select("id", {
            count: "exact",
            head: true,
          }),
      ]);

      setStats({
        totalUsers: totalUsers.count ?? 0,
        freelancers: freelancers.count ?? 0,
        clients: clients.count ?? 0,
        jobs: jobs.count ?? 0,
        applications: applications.count ?? 0,

        // Temporary estimated revenue
        revenue: (jobs.count ?? 0) * 250,
      });

      // Recent Users
      const { data: latestUsers } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      setRecentUsers((latestUsers as UserProfile[]) ?? []);

      // Recent Jobs
      const { data: latestJobs } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          budget,
          status,
          created_at,
          profiles (
            full_name
          )
        `)
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      setRecentJobs(latestJobs ?? []);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="contracts-page">
        <h1>Loading Dashboard...</h1>
      </main>
    );
  }

  return (
    <main className="contracts-page">

      <DashboardHeader />

      <DashboardStats
        totalUsers={stats.totalUsers}
        freelancers={stats.freelancers}
        clients={stats.clients}
        jobs={stats.jobs}
        applications={stats.applications}
        revenue={stats.revenue}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginTop: 24,
          alignItems: "start",
        }}
      >
        <AnalyticsChart />

        <PlatformHealth />
      </div>

      <RecentUsers users={recentUsers} />

      <RecentJobs jobs={recentJobs} />

      <DashboardActivity />

      <DashboardQuickActions />

    </main>
  );
}