"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/app/lib/supabase";

import DashboardHeader from "./components/DashboardHeader";
import DashboardStats from "./components/DashboardStats";
import AnalyticsChart from "./components/AnalyticsChart";
import PlatformHealth from "./components/PlatformHealth";
import RecentUsers from "./components/RecentUsers";
import RecentJobs from "./components/RecentJobs";
import DashboardQuickActions from "./components/DashboardQuickActions";
import DashboardActivity, {
  type DashboardActivityItem,
} from "./components/DashboardActivity";

import type {
  UserProfile,
} from "./users/types";

// ==================================================
// TYPES
// ==================================================

type MonthlyGrowth = {
  label: string;
  count: number;
};

type RecentJob = {
  id: string;
  title: string | null;
  created_at: string | null;
};

type ProfileActivityRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
  is_demo: boolean | null;
};

type JobActivityRow = {
  id: string;
  title: string | null;
  created_at: string | null;
  is_demo: boolean | null;
};

type ApplicationActivityRow = {
  id: string;
  created_at: string | null;
  is_demo: boolean | null;
};

type ReportActivityRow = {
  id: string;
  reason: string | null;
  status: string | null;
  created_at: string | null;
};

type PayoutActivityRow = {
  id: string;
  gross_amount: number | string | null;
  freelancer_amount: number | string | null;
  status: string | null;
  created_at: string | null;
  payout_requested_at: string | null;
  paid_out_at: string | null;
};

// ==================================================
// HELPERS
// ==================================================

function buildMonthlyGrowth(
  profiles: ProfileActivityRow[]
): MonthlyGrowth[] {
  const now =
    new Date();

  const months: {
    year: number;
    month: number;
    label: string;
    count: number;
  }[] = [];

  // Build the last 12 calendar months,
  // including the current month.
  for (
    let offset = 11;
    offset >= 0;
    offset--
  ) {
    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() -
          offset,
        1
      );

    months.push({
      year:
        date.getFullYear(),

      month:
        date.getMonth(),

      label:
        date.toLocaleDateString(
          "en-ZA",
          {
            month:
              "short",
          }
        ),

      count: 0,
    });
  }

  for (
    const profile
    of profiles
  ) {
    if (
      !profile.created_at
    ) {
      continue;
    }

    const created =
      new Date(
        profile.created_at
      );

    if (
      Number.isNaN(
        created.getTime()
      )
    ) {
      continue;
    }

    const matchingMonth =
      months.find(
        (month) =>
          month.year ===
            created.getFullYear() &&
          month.month ===
            created.getMonth()
      );

    if (
      matchingMonth
    ) {
      matchingMonth.count +=
        1;
    }
  }

  return months.map(
    (month) => ({
      label:
        month.label,

      count:
        month.count,
    })
  );
}

function formatMoney(
  value:
    | number
    | string
    | null
    | undefined
) {
  const amount =
    Number(value || 0);

  if (
    !Number.isFinite(
      amount
    )
  ) {
    return "ZAR 0";
  }

  return new Intl.NumberFormat(
    "en-ZA",
    {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  ).format(amount);
}

// ==================================================
// ADMIN DASHBOARD
// ==================================================

export default function AdminDashboard() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    recentUsers,
    setRecentUsers,
  ] =
    useState<
      UserProfile[]
    >([]);

  const [
    recentJobs,
    setRecentJobs,
  ] =
    useState<
      RecentJob[]
    >([]);

  const [
    monthlyGrowth,
    setMonthlyGrowth,
  ] =
    useState<
      MonthlyGrowth[]
    >([]);

  const [
    activities,
    setActivities,
  ] =
    useState<
      DashboardActivityItem[]
    >([]);

  const [
    openReports,
    setOpenReports,
  ] = useState(0);

  const [
    pendingPayouts,
    setPendingPayouts,
  ] = useState(0);

  const [
    pendingVerifications,
    setPendingVerifications,
  ] = useState(0);

  const [
    stats,
    setStats,
  ] = useState({
    totalUsers: 0,
    freelancers: 0,
    clients: 0,
    jobs: 0,
    applications: 0,
    revenue: 0,
  });

  useEffect(() => {
    void loadDashboard();
  }, []);

  // ==================================================
  // LOAD DASHBOARD
  // ==================================================

  async function loadDashboard() {
    setLoading(true);

    try {
      // ==================================================
      // MAIN COUNTS
      // ==================================================

      const [
        totalUsers,
        freelancers,
        clients,
        jobs,
        applications,
        payoutFees,
        reportsCount,
        payoutsCount,
        verificationCount,
      ] =
        await Promise.all([
          supabase
            .from(
              "profiles"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head:
                  true,
              }
            )
            .or(
              "is_demo.is.null,is_demo.eq.false"
            ),

          supabase
            .from(
              "profiles"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head:
                  true,
              }
            )
            .eq(
              "role",
              "freelancer"
            )
            .or(
              "is_demo.is.null,is_demo.eq.false"
            ),

          supabase
            .from(
              "profiles"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head:
                  true,
              }
            )
            .eq(
              "role",
              "client"
            )
            .or(
              "is_demo.is.null,is_demo.eq.false"
            ),

          supabase
            .from(
              "jobs"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head:
                  true,
              }
            )
            .or(
              "is_demo.is.null,is_demo.eq.false"
            ),

          supabase
            .from(
              "applications"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head:
                  true,
              }
            )
            .or(
              "is_demo.is.null,is_demo.eq.false"
            ),

          supabase
            .from(
              "freelancer_payouts"
            )
            .select(
              "platform_fee"
            ),

          supabase
            .from(
              "reports"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head:
                  true,
              }
            )
            .neq(
              "status",
              "resolved"
            ),

          supabase
            .from(
              "freelancer_payouts"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head:
                  true,
              }
            )
            .is(
              "paid_out_at",
              null
            )
            .not(
              "payout_requested_at",
              "is",
              null
            ),

          supabase
            .from(
              "profiles"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head:
                  true,
              }
            )
            .eq(
              "role",
              "freelancer"
            )
            .eq(
              "verification_status",
              "pending"
            )
            .or(
              "is_demo.is.null,is_demo.eq.false"
            ),
        ]);

      // ==================================================
      // REVENUE
      // ==================================================

      const actualRevenue =
        (
          payoutFees.data ||
          []
        ).reduce(
          (
            total,
            payout
          ) =>
            total +
            Number(
              payout.platform_fee ||
                0
            ),
          0
        );

      setStats({
        totalUsers:
          totalUsers.count ??
          0,

        freelancers:
          freelancers.count ??
          0,

        clients:
          clients.count ??
          0,

        jobs:
          jobs.count ??
          0,

        applications:
          applications.count ??
          0,

        revenue:
          actualRevenue,
      });

      setOpenReports(
        reportsCount.count ??
          0
      );

      setPendingPayouts(
        payoutsCount.count ??
          0
      );

      setPendingVerifications(
        verificationCount.count ??
          0
      );

      // ==================================================
      // RECENT USERS
      // ==================================================

      const {
        data:
          latestUsers,
        error:
          usersError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select("*")
          .or(
            "is_demo.is.null,is_demo.eq.false"
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(5);

      if (
        usersError
      ) {
        console.error(
          "Recent users loading error:",
          usersError
        );
      } else {
        setRecentUsers(
          (
            latestUsers as
              UserProfile[]
          ) ?? []
        );
      }

      // ==================================================
      // RECENT JOBS
      // ==================================================

      const {
        data:
          latestJobs,
        error:
          jobsError,
      } =
        await supabase
          .from(
            "jobs"
          )
          .select(`
            id,
            title,
            created_at
          `)
          .or(
            "is_demo.is.null,is_demo.eq.false"
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(5);

      if (
        jobsError
      ) {
        console.error(
          "Recent jobs loading error:",
          jobsError
        );
      } else {
        setRecentJobs(
          (
            latestJobs as
              RecentJob[]
          ) ?? []
        );
      }

      // ==================================================
      // USER GROWTH
      // ==================================================

      const startDate =
        new Date();

      startDate.setDate(
        1
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      startDate.setMonth(
        startDate.getMonth() -
          11
      );

      const {
        data:
          growthProfiles,
        error:
          growthError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(`
            id,
            full_name,
            role,
            created_at,
            is_demo
          `)
          .gte(
            "created_at",
            startDate.toISOString()
          )
          .or(
            "is_demo.is.null,is_demo.eq.false"
          )
          .order(
            "created_at",
            {
              ascending:
                true,
            }
          );

      if (
        growthError
      ) {
        console.error(
          "User growth loading error:",
          growthError
        );

        setMonthlyGrowth(
          buildMonthlyGrowth(
            []
          )
        );
      } else {
        setMonthlyGrowth(
          buildMonthlyGrowth(
            (
              growthProfiles as
                ProfileActivityRow[]
            ) ?? []
          )
        );
      }

      // ==================================================
      // ACTIVITY QUERIES
      // ==================================================

      const [
        activityProfiles,
        activityJobs,
        activityApplications,
        activityReports,
        activityPayouts,
      ] =
        await Promise.all([
          supabase
            .from(
              "profiles"
            )
            .select(`
              id,
              full_name,
              role,
              created_at,
              is_demo
            `)
            .or(
              "is_demo.is.null,is_demo.eq.false"
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(5),

          supabase
            .from(
              "jobs"
            )
            .select(`
              id,
              title,
              created_at,
              is_demo
            `)
            .or(
              "is_demo.is.null,is_demo.eq.false"
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(5),

          supabase
            .from(
              "applications"
            )
            .select(`
              id,
              created_at,
              is_demo
            `)
            .or(
              "is_demo.is.null,is_demo.eq.false"
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(5),

          supabase
            .from(
              "reports"
            )
            .select(`
              id,
              reason,
              status,
              created_at
            `)
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(5),

          supabase
            .from(
              "freelancer_payouts"
            )
            .select(`
              id,
              gross_amount,
              freelancer_amount,
              status,
              created_at,
              payout_requested_at,
              paid_out_at
            `)
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(5),
        ]);

      // ==================================================
      // BUILD REAL ACTIVITY FEED
      // ==================================================

      const activityItems:
        DashboardActivityItem[] =
        [];

      // USER REGISTRATIONS

      if (
        !activityProfiles.error
      ) {
        (
          activityProfiles.data as
            ProfileActivityRow[]
        )?.forEach(
          (profile) => {
            if (
              !profile.created_at
            ) {
              return;
            }

            const roleLabel =
              profile.role ===
              "freelancer"
                ? "Freelancer"
                : profile.role ===
                    "client"
                ? "Client"
                : "User";

            activityItems.push({
              id:
                `profile-${profile.id}`,

              icon:
                "👤",

              title:
                `${
                  profile.full_name ||
                  "A new user"
                } registered as a ${roleLabel}`,

              createdAt:
                profile.created_at,
            });
          }
        );
      } else {
        console.error(
          "Activity profiles error:",
          activityProfiles.error
        );
      }

      // JOBS

      if (
        !activityJobs.error
      ) {
        (
          activityJobs.data as
            JobActivityRow[]
        )?.forEach(
          (job) => {
            if (
              !job.created_at
            ) {
              return;
            }

            activityItems.push({
              id:
                `job-${job.id}`,

              icon:
                "💼",

              title:
                `Job posted: ${
                  job.title ||
                  "Untitled job"
                }`,

              createdAt:
                job.created_at,
            });
          }
        );
      } else {
        console.error(
          "Activity jobs error:",
          activityJobs.error
        );
      }

      // APPLICATIONS

      if (
        !activityApplications.error
      ) {
        (
          activityApplications.data as
            ApplicationActivityRow[]
        )?.forEach(
          (
            application
          ) => {
            if (
              !application.created_at
            ) {
              return;
            }

            activityItems.push({
              id:
                `application-${application.id}`,

              icon:
                "📄",

              title:
                "A new job application was submitted",

              createdAt:
                application.created_at,
            });
          }
        );
      } else {
        console.error(
          "Activity applications error:",
          activityApplications.error
        );
      }

      // REPORTS

      if (
        !activityReports.error
      ) {
        (
          activityReports.data as
            ReportActivityRow[]
        )?.forEach(
          (report) => {
            if (
              !report.created_at
            ) {
              return;
            }

            activityItems.push({
              id:
                `report-${report.id}`,

              icon:
                "🚩",

              title:
                report.reason
                  ? `User report submitted: ${report.reason}`
                  : "A new user report was submitted",

              createdAt:
                report.created_at,
            });
          }
        );
      } else {
        console.error(
          "Activity reports error:",
          activityReports.error
        );
      }

      // PAYOUTS

      if (
        !activityPayouts.error
      ) {
        (
          activityPayouts.data as
            PayoutActivityRow[]
        )?.forEach(
          (payout) => {
            /*
             * Paid-out event takes
             * priority because it is
             * the most advanced state.
             */

            if (
              payout.paid_out_at
            ) {
              activityItems.push({
                id:
                  `payout-paid-${payout.id}`,

                icon:
                  "💳",

                title:
                  `Payout completed: ${formatMoney(
                    payout.freelancer_amount
                  )}`,

                createdAt:
                  payout.paid_out_at,
              });

              return;
            }

            if (
              payout.payout_requested_at
            ) {
              activityItems.push({
                id:
                  `payout-request-${payout.id}`,

                icon:
                  "💰",

                title:
                  `Payout requested: ${formatMoney(
                    payout.freelancer_amount
                  )}`,

                createdAt:
                  payout.payout_requested_at,
              });

              return;
            }

            if (
              payout.created_at
            ) {
              activityItems.push({
                id:
                  `payout-${payout.id}`,

                icon:
                  "💰",

                title:
                  `Payout record created: ${formatMoney(
                    payout.freelancer_amount
                  )}`,

                createdAt:
                  payout.created_at,
              });
            }
          }
        );
      } else {
        console.error(
          "Activity payouts error:",
          activityPayouts.error
        );
      }

      // ==================================================
      // SORT ACTIVITY BY REAL TIMESTAMP
      // ==================================================

      const sortedActivity =
        activityItems
          .filter(
            (activity) =>
              !Number.isNaN(
                new Date(
                  activity.createdAt
                ).getTime()
              )
          )
          .sort(
            (a, b) =>
              new Date(
                b.createdAt
              ).getTime() -
              new Date(
                a.createdAt
              ).getTime()
          )
          .slice(
            0,
            8
          );

      setActivities(
        sortedActivity
      );
    } catch (error) {
      console.error(
        "Dashboard Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="contracts-page">
        <h1>
          Loading Dashboard...
        </h1>
      </main>
    );
  }

  // ==================================================
  // DASHBOARD
  // ==================================================

  return (
    <main className="contracts-page">
      <DashboardHeader />

      <DashboardStats
        totalUsers={
          stats.totalUsers
        }
        freelancers={
          stats.freelancers
        }
        clients={
          stats.clients
        }
        jobs={
          stats.jobs
        }
        applications={
          stats.applications
        }
        revenue={
          stats.revenue
        }
      />

      {/* ============================================
          REAL ANALYTICS + PLATFORM OVERVIEW
      ============================================ */}

      <div className="admin-dashboard-main-grid">
        <AnalyticsChart
          monthlyGrowth={
            monthlyGrowth
          }
        />

        <PlatformHealth
          totalUsers={
            stats.totalUsers
          }
          jobs={
            stats.jobs
          }
          applications={
            stats.applications
          }
          openReports={
            openReports
          }
          pendingPayouts={
            pendingPayouts
          }
          pendingVerifications={
            pendingVerifications
          }
        />
      </div>

      {/* ============================================
          RECENT USERS
      ============================================ */}

      <RecentUsers
        users={
          recentUsers
        }
      />

      {/* ============================================
          RECENT JOBS
      ============================================ */}

      <RecentJobs
        jobs={
          recentJobs
        }
      />

      {/* ============================================
          REAL ACTIVITY
      ============================================ */}

      <DashboardActivity
        activities={
          activities
        }
      />

      {/* ============================================
          QUICK ACTIONS
      ============================================ */}

      <DashboardQuickActions />
    </main>
  );
}