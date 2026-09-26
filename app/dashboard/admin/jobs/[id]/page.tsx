"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

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
  description?: string;
  budget?: number | string;
  client_id?: string;
  created_at?: string;
  location?: string;
  featured?: boolean;
  urgent?: boolean;
  high_paying?: boolean;

  applications?: {
    id: string;
  }[];
};

export default function AdminJobDetailsPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const id =
    params.id as string;

  const [
    job,
    setJob,
  ] =
    useState<Job | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    allowed,
    setAllowed,
  ] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  useEffect(() => {
    void loadJob();
  }, [id]);

  // ==================================================
  // FORMAT POSTED TIME
  // ==================================================

  const getPostedTime = (
    date?: string
  ) => {
    if (!date) {
      return "-";
    }

    const now =
      new Date();

    const posted =
      new Date(date);

    const diffMs =
      now.getTime() -
      posted.getTime();

    const hours =
      Math.floor(
        diffMs /
          (1000 *
            60 *
            60)
      );

    if (hours < 1) {
      return "Just now";
    }

    if (hours < 24) {
      return `${hours} hour${
        hours > 1
          ? "s"
          : ""
      } ago`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    if (days === 1) {
      return "Yesterday";
    }

    if (days < 7) {
      return `${days} days ago`;
    }

    const weeks =
      Math.floor(
        days / 7
      );

    if (weeks === 1) {
      return "1 week ago";
    }

    return `${weeks} weeks ago`;
  };

  // ==================================================
  // LOAD ADMIN + JOB
  // ==================================================

  const loadJob =
    async () => {
      setLoading(true);
      setMessage("");

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

      // ----------------------------------------------
      // Verify admin access
      // ----------------------------------------------

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

      // ----------------------------------------------
      // Load job
      // ----------------------------------------------

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "jobs"
          )
          .select(
            `
            *,
            applications (
              id
            )
          `
          )
          .eq(
            "id",
            id
          )
          .single();

      if (error) {
        console.error(
          "Admin job loading error:",
          error
        );

        setJob(null);
        setLoading(false);

        return;
      }

      setJob(
        data as Job
      );

      setLoading(false);
    };

  // ==================================================
  // DELETE JOB
  // ==================================================

  const deleteJob =
    async () => {
      if (
        !job ||
        deleting
      ) {
        return;
      }

      const confirmDelete =
        window.confirm(
          "Are you sure you want to permanently delete this job? This cannot be undone."
        );

      if (
        !confirmDelete
      ) {
        return;
      }

      setDeleting(true);
      setMessage("");

      // Re-check admin status before destructive action.

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setMessage(
          "Your session has expired. Please log in again."
        );

        setDeleting(false);

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
        profileError ||
        profile?.is_admin !==
          true
      ) {
        setMessage(
          "Administrator access is required."
        );

        setDeleting(false);

        return;
      }

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
            job.id
          );

      if (error) {
        setMessage(
          error.message
        );

        setDeleting(false);

        return;
      }

      setMessage(
        "Job deleted successfully."
      );

      setTimeout(
        () => {
          router.push(
            "/dashboard/admin/jobs"
          );
        },
        700
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
      <main className="job-page">
        <section className="job-hero dark-card">
          <div className="marketplace-badges">
            <span className="marketplace-badge">
              Admin
            </span>
          </div>

          <h1>
            Access Restricted
          </h1>

          <p>
            Only administrators
            can access this page.
          </p>

          <div
            className="contract-actions"
            style={{
              marginTop: 24,
            }}
          >
            <Link
              href="/dashboard"
              className="primary-action-link"
            >
              Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ==================================================
  // JOB NOT FOUND
  // ==================================================

  if (!job) {
    return (
      <main className="job-page">
        <EmptyState
          emoji="💼"
          title="Job not found"
          description="This job could not be found or may have been removed."
          buttonText="Back to Admin Jobs"
          buttonLink="/dashboard/admin/jobs"
        />
      </main>
    );
  }

  // ==================================================
  // ADMIN JOB DETAILS
  // ==================================================

  return (
    <main className="job-page">

      {/* ==============================================
          HEADER
          ============================================== */}

      <section className="job-hero dark-card">

        <div className="marketplace-badges">

          <span className="marketplace-badge">
            🛡️ Admin Job Review
          </span>

          <span className="marketplace-badge">
            {job.category ||
              "General Job"}
          </span>

          {job.featured && (
            <span className="top-rated-badge">
              ⭐ Featured
            </span>
          )}

          {job.urgent && (
            <span className="verified-badge">
              🔥 Urgent
            </span>
          )}

          {job.high_paying && (
            <span className="top-rated-badge">
              💎 High Paying
            </span>
          )}

        </div>

        <h1>
          {job.title ||
            "Untitled Job"}
        </h1>

        <p>
          Review this job post
          as an administrator.
          Admin actions remain
          inside the Admin
          Platform.
        </p>

      </section>

      {/* ==============================================
          CONTENT
          ============================================== */}

      <section className="job-layout">

        <div className="dark-card job-card">

          <h2>
            Project Overview
          </h2>

          <div className="job-meta">

            <p>
              💰{" "}
              <strong>
                Budget
              </strong>

              <br />

              R
              {Number(
                job.budget ||
                  0
              ).toLocaleString(
                "en-ZA"
              )}
            </p>

            <p>
              👥{" "}
              <strong>
                Applicants
              </strong>

              <br />

              {job
                .applications
                ?.length ||
                0}
            </p>

            <p>
              🌍{" "}
              <strong>
                Location
              </strong>

              <br />

              {job.location ||
                "Remote"}
            </p>

            <p>
              🕒{" "}
              <strong>
                Posted
              </strong>

              <br />

              {getPostedTime(
                job.created_at
              )}
            </p>

          </div>

          <div className="profile-divider" />

          <h2>
            Job Details
          </h2>

          <p className="job-description">
            {job.description ||
              "No job description provided."}
          </p>

          <div className="profile-divider" />

          <h2>
            Administrative Information
          </h2>

          <div className="job-meta">

            <p>
              🆔{" "}
              <strong>
                Job ID
              </strong>

              <br />

              {job.id}
            </p>

            <p>
              👤{" "}
              <strong>
                Client ID
              </strong>

              <br />

              {job.client_id ||
                "-"}
            </p>

          </div>

          <div className="profile-divider" />

          {/* ==========================================
              ADMIN ACTIONS
              ========================================== */}

          <div
            className="contract-actions"
            style={{
              marginTop: 24,
            }}
          >

            <Link
              href="/dashboard/admin/jobs"
              className="primary-action-link"
            >
              ← Back to Admin Jobs
            </Link>

            <button
              type="button"
              onClick={
                deleteJob
              }
              disabled={
                deleting
              }
              className="reject-btn"
            >
              {deleting
                ? "Deleting..."
                : "Delete Job"}
            </button>

          </div>

          {message && (
            <p
              className="upload-message"
              style={{
                marginTop: 18,
              }}
            >
              {message}
            </p>
          )}

        </div>

        {/* ============================================
            ADMIN SIDE PANEL
            ============================================ */}

        <div className="dark-card job-card">

          <h2>
            🛡️ Admin Review
          </h2>

          <p>
            This is the
            administrator view of
            the job.
          </p>

          <div className="profile-divider" />

          <p>
            You can inspect the
            job information and
            remove the post if it
            violates platform
            rules.
          </p>

          <div className="profile-divider" />

          <p className="job-warning">
            Deleting a job is a
            permanent action.
            Confirm that the post
            should be removed
            before deleting it.
          </p>

          <div
            className="contract-actions"
            style={{
              marginTop: 24,
            }}
          >

            <Link
              href="/dashboard/admin"
              className="primary-action-link"
            >
              Admin Dashboard
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}