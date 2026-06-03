"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Job = {
  id: string;
  title?: string;
  category?: string;
  description?: string;
  budget?: number | string;
};

const blockedContactPattern =
  /(\bwhatsapp\b|\btelegram\b|\bcall me\b|\btext me\b|\bemail\b|\bgmail\b|\byahoo\b|\boutlook\b|\bicloud\b|@|\+?\d[\d\s-]{7,}\d|facebook|instagram|tiktok|discord|skype)/i;

export default function JobDetailsPage() {
  const params = useParams();
  const id = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [proposal, setProposal] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    setJob(data);
    setLoading(false);
  };

  const applyForJob = async () => {
    setMessage("");

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

  return (
    <main className="job-page">
      <section className="job-hero dark-card">
        <p className="dashboard-badge">{job.category || "General Job"}</p>

        <h1>{job.title || "Untitled Job"}</h1>

        <p>
          Review the project details and submit a professional proposal without
          sharing outside contact details.
        </p>
      </section>

      <section className="job-layout">
        <div className="dark-card job-card">
          <span className="marketplace-badge">
            {job.category || "General"}
          </span>

          <h2>Job Details</h2>

          <p className="job-description">
            {job.description || "No job description provided."}
          </p>

          <div className="job-budget-box">
            <span>Client Budget</span>
            <strong>ZAR {job.budget || "N/A"}</strong>
          </div>
        </div>

        <div className="dark-card job-card">
          <h2>Apply safely</h2>

          <p className="job-warning">
  🔒 For your safety and platform protection, external contact details
  including WhatsApp numbers, emails, social media usernames and phone
  numbers are not allowed before hiring.
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
      </section>
    </main>
  );
}