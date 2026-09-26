"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "@/app/lib/supabase";

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
  const [
    jobs,
    setJobs,
  ] = useState<Job[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    allowed,
    setAllowed,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    void loadJobs();
  }, []);

  // ==================================================
  // LOAD ADMIN JOBS
  // ==================================================

  const loadJobs =
    async () => {
      setLoading(true);

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setAllowed(false);
        setLoading(false);

        return;
      }

      const {
        data:
          profile,
        error:
          profileError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "is_admin"
          )
          .eq(
            "id",
            user.id
          )
          .single();

      if (
        profileError
      ) {
        console.error(
          "Admin profile loading error:",
          profileError
        );

        setAllowed(false);
        setLoading(false);

        return;
      }

      if (
        profile?.is_admin !==
        true
      ) {
        setAllowed(false);
        setLoading(false);

        return;
      }

      setAllowed(true);

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "jobs"
          )
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (error) {
        console.error(
          "Admin jobs loading error:",
          error
        );

        setMessage(
          "Unable to load jobs."
        );

        setJobs([]);

        setLoading(false);

        return;
      }

      setJobs(
        (data as Job[]) ||
          []
      );

      setLoading(false);
    };

  // ==================================================
  // DELETE JOB
  // ==================================================

  const deleteJob =
    async (
      jobId: string
    ) => {
      const confirmDelete =
        window.confirm(
          "Delete this job permanently?"
        );

      if (
        !confirmDelete
      ) {
        return;
      }

      setMessage("");

      const {
        error,
      } =
        await supabase
          .from(
            "jobs"
          )
          .delete()
          .eq(
            "id",
            jobId
          );

      if (error) {
        setMessage(
          error.message
        );

        return;
      }

      setMessage(
        "Job deleted successfully."
      );

      setJobs(
        (
          previousJobs
        ) =>
          previousJobs.filter(
            (job) =>
              job.id !==
              jobId
          )
      );
    };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <LoadingSkeleton />
    );
  }

  // ==================================================
  // ACCESS RESTRICTED
  // ==================================================

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">
            Admin
          </p>

          <h1>
            Access Restricted
          </h1>

          <p>
            Only admins can
            manage jobs.
          </p>
        </section>
      </main>
    );
  }

  // ==================================================
  // ADMIN JOB MANAGEMENT
  // ==================================================

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Admin Jobs
        </p>

        <h1>
          Job Management
        </h1>

        <p>
          Review and remove
          unsafe or
          inappropriate job
          posts.
        </p>
      </section>

      {message && (
        <p className="upload-message">
          {message}
        </p>
      )}

      {jobs.length ===
      0 ? (
        <EmptyState
          emoji="💼"
          title="No jobs found"
          description="Jobs will appear here when clients post them."
        />
      ) : (
        <section className="contracts-grid">
          {jobs.map(
            (job) => (
              <div
                key={
                  job.id
                }
                className="dark-card contract-card"
              >
                <h2>
                  {job.title ||
                    "Untitled Job"}
                </h2>

                <p>
                  <strong>
                    Category:
                  </strong>{" "}
                  {job.category ||
                    "General"}
                </p>

                <p>
                  <strong>
                    Budget:
                  </strong>{" "}
                  ZAR{" "}
                  {job.budget ??
                    "N/A"}
                </p>

                <div className="contract-actions">
                  <Link
                    href={`/dashboard/admin/jobs/${job.id}`}
                    className="primary-action-link"
                  >
                    View Job
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      deleteJob(
                        job.id
                      )
                    }
                    className="reject-btn"
                  >
                    Delete Job
                  </button>
                </div>
              </div>
            )
          )}
        </section>
      )}
    </main>
  );
}