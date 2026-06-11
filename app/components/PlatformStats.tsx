"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function PlatformStats() {
  const [stats, setStats] = useState({
    freelancers: 0,
    clients: 0,
    jobs: 0,
    applications: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data, error } = await supabase.rpc("get_platform_stats");

    if (error) {
      console.error("Stats error:", error.message);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;

    setStats({
      freelancers: Number(row?.freelancers_count || 0),
      clients: Number(row?.clients_count || 0),
      jobs: Number(row?.jobs_count || 0),
      applications: Number(row?.applications_count || 0),
    });
  };

  return (
    <section className="stats-section">
      <div className="dark-card stats-card">
        <h3>{stats.freelancers}</h3>
        <p>Freelancers</p>
      </div>

      <div className="dark-card stats-card">
        <h3>{stats.clients}</h3>
        <p>Clients</p>
      </div>

      <div className="dark-card stats-card">
        <h3>{stats.jobs}</h3>
        <p>Jobs Posted</p>
      </div>

      <div className="dark-card stats-card">
        <h3>{stats.applications}</h3>
        <p>Applications Sent</p>
      </div>
    </section>
  );
}