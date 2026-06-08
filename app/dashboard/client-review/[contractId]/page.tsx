"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function ClientReviewPage() {
  const params = useParams();
  const contractId = params.contractId as string;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  const submitReview = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const { data: contract } = await supabase
      .from("contracts")
      .select("client_id")
      .eq("id", contractId)
      .single();

    if (!contract) {
      setMessage("Contract not found.");
      return;
    }

    const { error } = await supabase
      .from("client_reviews")
      .insert({
        freelancer_id: user.id,
        client_id: contract.client_id,
        contract_id: contractId,
        rating,
        comment,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Client review submitted successfully!");
  };

  return (
    <main className="contracts-page">
      <section className="dark-card contract-card">
        <h1>Review Client</h1>

        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="form-input"
        >
          <option value={5}>⭐⭐⭐⭐⭐</option>
          <option value={4}>⭐⭐⭐⭐</option>
          <option value={3}>⭐⭐⭐</option>
          <option value={2}>⭐⭐</option>
          <option value={1}>⭐</option>
        </select>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="form-input proposal-textarea"
          placeholder="Review the client..."
        />

        <button
          onClick={submitReview}
          className="primary-action-btn"
        >
          Submit Review
        </button>

        {message && (
          <p className="upload-message">{message}</p>
        )}
      </section>
    </main>
  );
}