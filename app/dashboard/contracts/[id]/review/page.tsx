"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Contract = {
  id: string;
  freelancer_id?: string;
  client_id?: string;
  project_title?: string;
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();

  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadContract();
  }, []);

  const loadContract = async () => {
    const { data } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    setContract((data as Contract) || null);
    setLoading(false);
  };

  const submitReview = async () => {
    if (!contract) return;

    setSubmitting(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      contract_id: contractId,
      freelancer_id: contract.freelancer_id,
      client_id: user.id,
      rating,
      comment,
    });

    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }

    await supabase.from("contract_activity").insert({
      contract_id: contractId,
      action: `Client left a ${rating}-star review`,
    });

    setMessage("Review submitted successfully!");
    setSubmitting(false);

    setTimeout(() => {
      router.push(`/dashboard/contracts/${contractId}`);
    }, 1200);
  };

  if (loading) return <LoadingSkeleton />;

  if (!contract) {
    return (
      <main className="contracts-page">
        <div className="dark-card contract-card">
          <h1>Contract not found</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Review Freelancer</p>

        <h1>{contract.project_title || "Project Review"}</h1>

        <p>Leave a professional rating and review.</p>
      </section>

      <section className="dark-card hire-card">
        <label className="form-label">Rating</label>

        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="form-input"
        >
          <option value={5}>⭐⭐⭐⭐⭐ - Excellent</option>
          <option value={4}>⭐⭐⭐⭐ - Very Good</option>
          <option value={3}>⭐⭐⭐ - Good</option>
          <option value={2}>⭐⭐ - Poor</option>
          <option value={1}>⭐ - Very Poor</option>
        </select>

        <label className="form-label">Review Comment</label>

        <textarea
          placeholder="Share your experience working with this freelancer..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="form-input proposal-textarea"
        />

        <button
          onClick={submitReview}
          disabled={submitting}
          className="primary-action-btn"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>

        {message && <p className="upload-message">{message}</p>}
      </section>
    </main>
  );
}