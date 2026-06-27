"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Job = {
  id: string;
  title?: string;
  category?: string;
  budget?: number | string;
  created_at?: string;
};

export default function RecommendedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    loadRecommendedJobs();
  }, []);

  const loadRecommendedJobs = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, category")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "freelancer") return;

    let query = supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    if (profile?.category) {
      query = query.eq("category", profile.category);
    }

    const { data } = await query;

    setJobs((data as Job[]) || []);
  };

  if (jobs.length === 0) return null;

  return (
    <section className="home-section">
      <div className="home-section-header">
        <p className="dashboard-badge">Recommended For You</p>
        <h2>Jobs matching your profile</h2>
      </div>

      <div className="home-grid">
        {jobs.map((job) => (
          <div key={job.id} className="dark-card home-card">
            <span className="marketplace-badge">
              {job.category || "General"}
            </span>

            <h3>{job.title || "Untitled Job"}</h3>

            <p>
              <strong>Budget:</strong> ZAR {job.budget || "N/A"}
            </p>

            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="primary-action-link"
            >
              View Job
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}