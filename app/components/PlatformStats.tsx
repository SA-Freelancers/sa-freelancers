"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function PlatformStats() {
  const [freelancers, setFreelancers] = useState(0);
  const [clients, setClients] = useState(0);
  const [jobs, setJobs] = useState(0);
  const [applications, setApplications] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data, error } = await supabase.rpc("get_platform_stats");

    if (error || !data || data.length === 0) return;

    setFreelancers(Number(data[0].freelancers_count || 0));
    setClients(Number(data[0].clients_count || 0));
    setJobs(Number(data[0].jobs_count || 0));
    setApplications(Number(data[0].applications_count || 0));
  };

  return (
    <section className="stats-section">
      <div className="dark-card stats-card">
        <h3>{freelancers}</h3>
        <p>Freelancers</p>
      </div>

      <div className="dark-card stats-card">
        <h3>{clients}</h3>
        <p>Clients</p>
      </div>

      <div className="dark-card stats-card">
        <h3>{jobs}</h3>
        <p>Jobs Posted</p>
      </div>

      <div className="dark-card stats-card">
        <h3>{applications}</h3>
        <p>Applications Sent</p>
      </div>
    </section>
  );
}