"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Application = {
  id: string;
  freelancer_id?: string;
  job_id?: string;
  status?: string;
};

export default function ReviewPage() {
  const params = useParams();
  const applicationId = params.applicationId as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    loadReviewAccess();
  }, []);

  const loadReviewAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setLoading(false);
      return;
    }

    const { data: appData } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (!appData) {
      setMessage("Application not found.");
      setLoading(false);
      return;
    }

    setApplication(appData as Application);

    const { data: project } = await supabase
      .from("projects")
      .select("id, status, payment_status, client_id")
      .eq("application_id", applicationId)
      .eq("client_id", user.id)
      .single();

    if (
      project &&
      (project.status === "completed" || project.payment_status === "paid")
    ) {
      setCanReview(true);
    }

    setLoading(false);
  };

  const submitReview = async () => {
    setMessage("");

    if (!canReview) {
      setMessage("You can only review after the project is completed or paid.");
      return;
    }

    if (!application?.freelancer_id) {
      setMessage("Freelancer not found.");
      return;
    }

    if (!comment.trim()) {
      setMessage("Please write a short review comment.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("application_id", applicationId)
      .eq("client_id", user.id)
      .maybeSingle();

    if (existingReview) {
      setMessage("You have already reviewed this freelancer.");
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      freelancer_id: application.freelancer_id,
      client_id: user.id,
      application_id: applicationId,
      rating,
      comment,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Review submitted successfully!");
    setComment("");
    setRating(5);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Review</p>

        <h1>Leave a Review</h1>

        <p>
          Rate the freelancer after the project is completed or payment has been
          made.
        </p>
      </section>

      <section className="dark-card contract-card">
        {!canReview && (
          <p className="upload-message">
            Reviews are only available after a project is completed or paid.
          </p>
        )}

        <label className="form-label">Rating</label>

        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="form-input"
          disabled={!canReview}
        >
          <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
          <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
          <option value={3}>⭐⭐⭐ 3 Stars</option>
          <option value={2}>⭐⭐ 2 Stars</option>
          <option value={1}>⭐ 1 Star</option>
        </select>

        <label className="form-label">Review Comment</label>

        <textarea
          placeholder="Write your review..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="form-input proposal-textarea"
          disabled={!canReview}
        />

        <button
          onClick={submitReview}
          disabled={!canReview}
          className="primary-action-btn"
        >
          Submit Review
        </button>

        {message && <p className="upload-message">{message}</p>}
      </section>
    </main>
  );
}