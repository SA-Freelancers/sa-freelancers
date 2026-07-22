"use client";

import { useEffect, useState } from "react";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import { supabase } from "@/app/lib/supabase";

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
  const [stats, setStats] = useState(initialStats);

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [message, setMessage] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const [generatingClients, setGeneratingClients] =
    useState(false);

  const [generatingJobs, setGeneratingJobs] =
    useState(false);

  const [clientMessage, setClientMessage] =
    useState("");

  const [jobMessage, setJobMessage] =
    useState("");

  useEffect(() => {
    loadHealth();
  }, []);

  async function loadHealth() {
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

    const now = new Date();

    const tomorrow = new Date(
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
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("role", "freelancer")
        .eq("suspended", false),

      supabase
        .from("demo_freelancers")
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
        .eq("role", "client")
        .eq("suspended", false),

      supabase
        .from("demo_clients")
        .select("id", {
          count: "exact",
          head: true,
        }),

      supabase
        .from("jobs")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("is_demo", false),

      supabase
        .from("jobs")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("is_demo", true),

      supabase
        .from("applications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("is_demo", false),

      supabase
        .from("applications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("is_demo", true),

      supabase
        .from("jobs")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("is_demo", true)
        .not("demo_expires_at", "is", null)
        .gte("demo_expires_at", now.toISOString())
        .lte("demo_expires_at", tomorrow.toISOString()),
    ]);

    setStats({
      realFreelancers:
        realFreelancers.count ?? 0,

      demoFreelancers:
        demoFreelancers.count ?? 0,

      realClients:
        realClients.count ?? 0,

      demoClients:
        demoClients.count ?? 0,

      realJobs:
        realJobs.count ?? 0,

      demoJobs:
        demoJobs.count ?? 0,

      realApplications:
        realApplications.count ?? 0,

      demoApplications:
        demoApplications.count ?? 0,

      demoJobsExpiringToday:
        expiringJobs.count ?? 0,
    });

    setLoading(false);
  }
    async function getAdminAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!session?.access_token) {
      throw new Error(
        "You must be logged in as an administrator."
      );
    }

    return session.access_token;
  }

  async function callMarketplaceRoute(
    route: string,
    count: number
  ) {
    const accessToken = await getAdminAccessToken();

    const response = await fetch(route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        count,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "The marketplace operation could not be completed."
      );
    }

    return result;
  }

  async function handleGenerateClients() {
    try {
      setGeneratingClients(true);
      setClientMessage("");
      setMessage("");

      const result = await callMarketplaceRoute(
        "/api/admin/marketplace/generate-clients",
        10
      );

      const inserted = Number(result.inserted ?? 0);
      const failed = Number(result.failed ?? 0);
      const total = Number(
        result.totalDemoClientProfiles ?? 0
      );

      let successMessage =
        `${inserted} authenticated demo client` +
        `${inserted === 1 ? "" : "s"} created.`;

      if (total > 0) {
        successMessage +=
          ` Total authenticated demo clients: ${total}.`;
      }

      if (failed > 0) {
        successMessage +=
          ` ${failed} client${failed === 1 ? "" : "s"} failed.`;
      }

      setClientMessage(successMessage);

      await loadHealth();
    } catch (error) {
      setClientMessage(
        error instanceof Error
          ? error.message
          : "Could not generate demo client accounts."
      );
    } finally {
      setGeneratingClients(false);
    }
  }

  async function handleGenerateJobs() {
    try {
      setGeneratingJobs(true);
      setJobMessage("");
      setMessage("");

      const result = await callMarketplaceRoute(
        "/api/admin/marketplace/generate-jobs",
        20
      );

      const inserted = Number(result.inserted ?? 0);
      const activeJobs = Number(
        result.totalActiveDemoJobs ?? 0
      );

      setJobMessage(
        `${inserted} demo job${
          inserted === 1 ? "" : "s"
        } created. Active demo jobs: ${activeJobs}.`
      );

      await loadHealth();
    } catch (error) {
      setJobMessage(
        error instanceof Error
          ? error.message
          : "Could not generate demo jobs."
      );
    } finally {
      setGeneratingJobs(false);
    }
  }

  async function refreshDemoMarketplace() {
    try {
      setRefreshing(true);
      setMessage("Refreshing demo marketplace...");
      setClientMessage("");
      setJobMessage("");

      const { error } = await supabase.rpc(
        "run_daily_marketplace_refresh"
      );

      if (error) {
        throw new Error(error.message);
      }

      await loadHealth();

      setMessage(
        "Demo marketplace refreshed successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not refresh the demo marketplace."
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleReloadStatistics() {
    try {
      setMessage("Reloading marketplace statistics...");
      setClientMessage("");
      setJobMessage("");

      await loadHealth();

      setMessage(
        "Marketplace statistics reloaded successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not reload marketplace statistics."
      );
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Admin</p>

          <h1>Access Restricted</h1>

          <p>
            Only authorised administrators can view and manage
            marketplace health.
          </p>
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
    <main className="mx-auto max-w-7xl space-y-8 p-6">

      {/* Header */}

      <div className="flex flex-col gap-4 rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-lg md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm uppercase tracking-widest text-green-400">
            Marketplace Engine
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Marketplace Health
          </h1>

          <p className="mt-2 text-gray-400">
            Monitor the activity of Freelancer Hub SA and generate realistic
            demo marketplace data.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            onClick={handleReloadStatistics}
            className="rounded-lg bg-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-600"
          >
            Reload Statistics
          </button>

          <button
            onClick={refreshDemoMarketplace}
            disabled={refreshing}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh Marketplace"}
          </button>

        </div>

      </div>

      {(message || clientMessage || jobMessage) && (

        <div className="rounded-lg border border-green-700 bg-green-950 p-4">

          {message && (
            <p className="text-green-300">{message}</p>
          )}

          {clientMessage && (
            <p className="mt-2 text-green-300">
              {clientMessage}
            </p>
          )}

          {jobMessage && (
            <p className="mt-2 text-green-300">
              {jobMessage}
            </p>
          )}

        </div>

      )}

      {/* Statistics */}

      <section>

        <h2 className="mb-4 text-xl font-bold text-white">
          Marketplace Statistics
        </h2>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {cards.map((card) => (

            <div
              key={card.label}
              className="rounded-xl border border-gray-700 bg-gray-900 p-5 shadow"
            >

              <p className="text-sm text-gray-400">
                {card.label}
              </p>

              <h3 className="mt-2 text-4xl font-bold text-white">
                {card.value}
              </h3>

            </div>

          ))}

        </div>

      </section>

      {/* Summary */}

      <section className="grid gap-5 md:grid-cols-2">

        <div className="rounded-xl border border-green-700 bg-green-950 p-6">

          <h2 className="text-xl font-bold text-white">
            Real Marketplace
          </h2>

          <p className="mt-3 text-5xl font-bold text-green-300">
            {totalReal}
          </p>

          <p className="mt-3 text-gray-300">
            Total real marketplace records.
          </p>

        </div>

        <div className="rounded-xl border border-blue-700 bg-blue-950 p-6">

          <h2 className="text-xl font-bold text-white">
            Demo Marketplace
          </h2>

          <p className="mt-3 text-5xl font-bold text-blue-300">
            {totalDemo}
          </p>

          <p className="mt-3 text-gray-300">
            Total demo marketplace records.
          </p>

        </div>

      </section>

      {/* Marketplace Actions */}

      <section className="rounded-xl border border-gray-700 bg-gray-900 p-6 shadow">

        <h2 className="mb-6 text-2xl font-bold text-white">
          Marketplace Actions
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          <button
            onClick={handleGenerateClients}
            disabled={generatingClients}
            className="rounded-lg bg-purple-600 px-5 py-4 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {generatingClients
              ? "Generating..."
              : "Generate 10 Clients"}
          </button>

          <button
            onClick={handleGenerateJobs}
            disabled={generatingJobs}
            className="rounded-lg bg-green-600 px-5 py-4 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {generatingJobs
              ? "Generating..."
              : "Generate 20 Jobs"}
          </button>

          <button
            className="rounded-lg bg-orange-600 px-5 py-4 font-semibold text-white transition hover:bg-orange-700"
          >
            Generate Applications
          </button>

          <button
            className="rounded-lg bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700"
          >
            Remove Demo Data
          </button>

        </div>

      </section>

    </main>
  );
}