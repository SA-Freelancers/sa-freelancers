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
    const { count: freelancerCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "freelancer");

    const { count: clientCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "client");

    const { count: jobCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true });

    const { count: applicationCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true });

    setFreelancers(freelancerCount || 0);
    setClients(clientCount || 0);
    setJobs(jobCount || 0);
    setApplications(applicationCount || 0);
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