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
        payoutFees,
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

        supabase
          .from("freelancer_payouts")
          .select("platform_fee"),
      ]);

      const actualRevenue = (payoutFees.data || []).reduce(
        (total, payout) =>
          total + Number(payout.platform_fee || 0),
        0
      );

      setStats({
        totalUsers: totalUsers.count ?? 0,
        freelancers: freelancers.count ?? 0,
        clients: clients.count ?? 0,
        jobs: jobs.count ?? 0,
        applications: applications.count ?? 0,
        revenue: actualRevenue,
      });

      // ==================================================
      // RECENT USERS
      // ==================================================

      const {
        data: latestUsers,
        error: usersError,
      } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      if (usersError) {
        console.error(
          "Recent users loading error:",
          usersError
        );
      } else {
        setRecentUsers(
          (latestUsers as UserProfile[]) ?? []
        );
      }

      // ==================================================
      // RECENT JOBS
      // ==================================================
      //
      // Important:
      // We intentionally do not include the nested
      // `profiles (...)` relationship here.
      //
      // The previous nested relationship was causing
      // the Recent Jobs query to fail on the admin
      // dashboard.
      // ==================================================

      const {
  data: latestJobs,
  error: jobsError,
} = await supabase
  .from("jobs")
  .select(`
    id,
    title,
    created_at
  `)
  .order("created_at", {
    ascending: false,
  })
  .limit(5);

      if (jobsError) {
        console.error(
          "Recent jobs loading error:",
          jobsError
        );
      } else {
        setRecentJobs(latestJobs ?? []);
      }
    } catch (error) {
      console.error(
        "Dashboard Error:",
        error
      );
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

      {/* ==================================================
          ANALYTICS + PLATFORM HEALTH
          ================================================== */}

      <div className="admin-dashboard-main-grid">
        <AnalyticsChart />

        <PlatformHealth />
      </div>

      {/* ==================================================
          RECENT USERS
          ================================================== */}

      <RecentUsers
        users={recentUsers}
      />

      {/* ==================================================
          RECENT JOBS
          ================================================== */}

      <RecentJobs
        jobs={recentJobs}
      />

      {/* ==================================================
          ACTIVITY
          ================================================== */}

      <DashboardActivity />

      {/* ==================================================
          QUICK ACTIONS
          ================================================== */}

      <DashboardQuickActions />
    </main>
  );
}