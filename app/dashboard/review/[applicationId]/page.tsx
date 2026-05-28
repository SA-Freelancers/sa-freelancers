"use client";

import { useState } from "react";

import { useParams } from "next/navigation";

import { supabase } from "@/app/lib/supabase";

export default function ReviewPage() {
  const { applicationId } = useParams();

  const [rating, setRating] = useState(5);

  const [comment, setComment] = useState("");

  const [message, setMessage] = useState("");

  const submitReview = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // GET APPLICATION
    const { data: application } = await supabase
      .from("applications")
      .select("freelancer_id")
      .eq("id", applicationId)
      .single();

    if (!application) {
      setMessage("Application not found.");
      return;
    }

    const { error } = await supabase
      .from("reviews")
      .insert({
        freelancer_id:
          application.freelancer_id,

        client_id: user.id,

        application_id: applicationId,

        rating,

        comment,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Review submitted!");

    setComment("");
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
      }}
    >
      <h1>Leave Review</h1>

      <label>Rating</label>

      <select
        value={rating}
        onChange={(e) =>
          setRating(Number(e.target.value))
        }
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 15,
        }}
      >
        <option value={5}>5 Stars</option>
        <option value={4}>4 Stars</option>
        <option value={3}>3 Stars</option>
        <option value={2}>2 Stars</option>
        <option value={1}>1 Star</option>
      </select>

      <textarea
        placeholder="Write review..."
        value={comment}
        onChange={(e) =>
          setComment(e.target.value)
        }
        style={{
          width: "100%",
          minHeight: 120,
          padding: 10,
          marginBottom: 15,
        }}
      />

      <button
        onClick={submitReview}
        style={{
          padding: "12px 18px",
          backgroundColor: "black",
          color: "white",
          borderRadius: 6,
          border: "none",
        }}
      >
        Submit Review
      </button>

      {message && (
        <p style={{ marginTop: 15 }}>
          {message}
        </p>
      )}
    </div>
  );
}