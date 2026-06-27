"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
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
  applications?: { id: string }[];
};

const blockedContactPattern =
  /(\bwhatsapp\b|\btelegram\b|\bcall me\b|\btext me\b|\bemail\b|\bgmail\b|\byahoo\b|\boutlook\b|\bicloud\b|@|\+?\d[\d\s-]{7,}\d|facebook|instagram|tiktok|discord|skype)/i;

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [proposal, setProposal] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadJob();
  }, [id]);

  const getPostedTime = (date?: string) => {
    if (!date) return "-";

    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);

    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    const weeks = Math.floor(days / 7);

    if (weeks === 1) return "1 week ago";
    return `${weeks} weeks ago`;
  };

  const loadJob = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_admin")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role || "");
      setIsAdmin(profile?.is_admin || false);
    }

    const { data } = await supabase
      .from("jobs")
      .select(
        `
        *,
        applications (
          id
        )
      `
      )
      .eq("id", id)
      .single();

    setJob(data as Job);
    setLoading(false);
  };

  const deleteJob = async () => {
    if (!job) return;

    const canDelete = isAdmin || job.client_id === userId;

    if (!canDelete) {
      setMessage("You are not allowed to delete this job.");
      return;
    }

    const confirmDelete = confirm(
      "Are you sure you want to delete this job? This cannot be undone."
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("jobs").delete().eq("id", job.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Job deleted successfully.");

    setTimeout(() => {
      router.push(userRole === "client" ? "/dashboard/jobs" : "/dashboard/admin");
    }, 800);
  };

  const applyForJob = async () => {
    setMessage("");

    if (userRole !== "freelancer") {
      setMessage("Only freelancers can apply for jobs.");
      return;
    }

    if (!proposal.trim()) {
      setMessage("Please write a short proposal first.");
      return;
    }

    if (!price || Number(price) <= 0) {
      setMessage("Please enter a valid proposed price.");
      return;
    }

    if (blockedContactPattern.test(proposal)) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("moderation_logs").insert({
        user_id: user?.id || null,
        source: "job_application",
        content: proposal,
        reason: "Blocked contact details in proposal",
      });

      setMessage(
        "Please do not share phone numbers, WhatsApp, email addresses, social media, or contact details before hiring."
      );

      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("suspended")
      .eq("id", user.id)
      .single();

    if (profile?.suspended) {
      setMessage("Your account has been suspended. You cannot apply for jobs.");
      setSubmitting(false);
      return;
    }

    const { data: existingApplication } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", id)
      .eq("freelancer_id", user.id)
      .maybeSingle();

    if (existingApplication) {
      setMessage("You have already applied for this job.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("applications").insert({
      job_id: id,
      freelancer_id: user.id,
      cover_message: proposal,
      proposed_budget: Number(price),
      status: "pending",
    });

    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }

    setMessage("Application submitted successfully!");
    setProposal("");
    setPrice("");
    setSubmitting(false);
    loadJob();
  };

  if (loading) return <LoadingSkeleton />;

  if (!job) {
    return (
      <main className="job-page">
        <EmptyState
          emoji="💼"
          title="Job not found"
          description="This job could not be found."
          buttonText="Browse Marketplace"
          buttonLink="/search"
        />
      </main>
    );
  }

  const isOwner = job.client_id === userId;
  const canManageJob = isOwner || isAdmin;

  return (
    <main className="job-page">
      <section className="job-hero dark-card">
        <div className="marketplace-badges">
          <span className="marketplace-badge">
            {job.category || "General Job"}
          </span>

          {job.featured && (
            <span className="top-rated-badge">⭐ Featured</span>
          )}

          {job.urgent && (
            <span className="verified-badge">🔥 Urgent</span>
          )}

          {job.high_paying && (
            <span className="top-rated-badge">💎 High Paying</span>
          )}
        </div>

        <h1>{job.title || "Untitled Job"}</h1>

        <p>
          Review the project details, submit a professional proposal and keep
          communication safely inside Freelance Hub SA.
        </p>
      </section>

      <section className="job-layout">
        <div className="dark-card job-card">
          <h2>Project Overview</h2>

          <div className="job-meta">
            <p>
              💰 <strong>Budget</strong>
              <br />
              R{Number(job.budget || 0).toLocaleString("en-ZA")}
            </p>

            <p>
              👥 <strong>Applicants</strong>
              <br />
              {job.applications?.length || 0}
            </p>

            <p>
              🌍 <strong>Location</strong>
              <br />
              {job.location || "Remote"}
            </p>

            <p>
              🕒 <strong>Posted</strong>
              <br />
              {getPostedTime(job.created_at)}
            </p>
          </div>

          <div className="profile-divider" />

          <h2>Job Details</h2>

          <p className="job-description">
            {job.description || "No job description provided."}
          </p>

          <div className="profile-divider" />

          <h2>Client Trust</h2>

          <div className="marketplace-badges">
            <span className="verified-badge">🛡 Verified Client</span>
            <span className="verified-badge">🌍 Remote Project</span>
            <span className="top-rated-badge">⭐ Platform Protected</span>
          </div>

          {canManageJob && (
            <div className="contract-actions" style={{ marginTop: 24 }}>
              {isOwner && (
                <Link
                  href={`/dashboard/jobs/${job.id}/edit`}
                  className="primary-action-link"
                >
                  Edit Job
                </Link>
              )}

              <button onClick={deleteJob} className="reject-btn">
                Delete Job
              </button>
            </div>
          )}
        </div>

        {userRole === "freelancer" && (
          <div className="dark-card job-card">
            <h2>Apply safely</h2>

            <p className="job-warning">
              🔒 For your safety and platform protection, external contact
              details including WhatsApp numbers, emails, social media usernames
              and phone numbers are not allowed before hiring.
            </p>

            <label className="form-label">Your Proposal</label>

            <textarea
              placeholder="Explain your experience, timeline, and how you will solve the client’s problem..."
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              className="form-input proposal-textarea"
            />

            <label className="form-label">Your Proposed Price</label>

            <input
              type="number"
              placeholder="Example: 2500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="form-input"
            />

            <button
              onClick={applyForJob}
              disabled={submitting}
              className="primary-action-btn"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>

            {message && <p className="upload-message">{message}</p>}
          </div>
        )}

        {userRole === "client" && (
          <div className="dark-card job-card">
            <h2>Client View</h2>
            <p>
              {isOwner
                ? "You can edit or delete this job from the job details section."
                : "Only the job owner can edit this job."}
            </p>
          </div>
        )}

        {isAdmin && userRole !== "client" && (
          <div className="dark-card job-card">
            <h2>Admin Controls</h2>
            <p>Admins can delete inappropriate or unsafe job posts.</p>
          </div>
        )}
      </section>
    </main>
  );
}