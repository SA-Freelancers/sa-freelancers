"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Job = {
  id: string;
  title?: string;
  category?: string;
  budget?: number | string;
  created_at?: string;
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs((data as Job[]) || []);
    setLoading(false);
  };

  const deleteJob = async (jobId: string) => {
    const confirmDelete = confirm("Delete this job permanently?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("jobs").delete().eq("id", jobId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Job deleted successfully.");
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Admin</p>
          <h1>Access Restricted</h1>
          <p>Only admins can manage jobs.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin Jobs</p>
        <h1>Job Management</h1>
        <p>Review and remove unsafe or inappropriate job posts.</p>
      </section>

      {message && <p className="upload-message">{message}</p>}

      {jobs.length === 0 ? (
        <EmptyState
          emoji="💼"
          title="No jobs found"
          description="Jobs will appear here when clients post them."
        />
      ) : (
        <section className="contracts-grid">
          {jobs.map((job) => (
            <div key={job.id} className="dark-card contract-card">
              <h2>{job.title || "Untitled Job"}</h2>

              <p>
                <strong>Category:</strong> {job.category || "General"}
              </p>

              <p>
                <strong>Budget:</strong> ZAR {job.budget || "N/A"}
              </p>

              <div className="contract-actions">
                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="primary-action-link"
                >
                  View Job
                </Link>

                <button
                  onClick={() => deleteJob(job.id)}
                  className="reject-btn"
                >
                  Delete Job
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}