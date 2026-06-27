"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Job = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  budget?: number | string;
  client_id?: string;
  created_at?: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "client") {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setJobs((data as Job[]) || []);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Client Area</p>
          <h1>Access Restricted</h1>
          <p>Only clients can access the Jobs Dashboard.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Client Jobs</p>

        <h1>My Posted Jobs</h1>

        <p>
          Manage jobs you created and review freelancer applications.
        </p>

        <div style={{ marginTop: 20 }}>
          <Link href="/dashboard/post-job" className="primary-action-link">
            Post New Job
          </Link>
        </div>
      </section>

      {message && <p className="upload-message">{message}</p>}

      {jobs.length === 0 ? (
        <EmptyState
          emoji="💼"
          title="No jobs posted yet"
          description="Create your first job to start receiving freelancer proposals."
          buttonText="Post Job"
          buttonLink="/dashboard/post-job"
        />
      ) : (
        <section className="contracts-grid">
          {jobs.map((job) => (
            <div key={job.id} className="dark-card contract-card">
              <div className="contract-top">
                <h2>{job.title || "Untitled Job"}</h2>

                <span className="marketplace-badge">
                  {job.category || "General"}
                </span>
              </div>

              <p className="contract-description">
                {job.description?.slice(0, 160) || "No description provided."}
              </p>

              <p className="contract-budget">
                Budget: R{Number(job.budget || 0).toLocaleString("en-ZA")}
              </p>

              <div className="contract-actions">
                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="primary-action-link"
                >
                  View Job
                </Link>

                <Link
                  href={`/dashboard/client/jobs/${job.id}/applications`}
                  className="primary-action-link"
                >
                  Applications
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}