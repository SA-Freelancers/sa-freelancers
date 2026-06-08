"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Job = {
  id: string;
  title: string;
  budget: number;
  category: string;
  created_at: string;
};

export default function LatestJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    setJobs((data as Job[]) || []);
  };

  if (jobs.length === 0) return null;

  return (
    <section className="home-section">
      <div className="home-section-header">
        <p className="dashboard-badge">Latest Opportunities</p>
        <h2>Find your next project</h2>
      </div>

      <div className="home-grid">
        {jobs.map((job) => (
          <div key={job.id} className="dark-card home-card">
            <h3>{job.title}</h3>

            <p>
              <strong>Category:</strong> {job.category || "General"}
            </p>

            <p>
              <strong>Budget:</strong> ZAR {job.budget || 0}
            </p>

            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="primary-action-link"
            >
              View Opportunity
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}