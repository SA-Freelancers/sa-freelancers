"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function ReviewPage() {
  const params = useParams();
  const applicationId = params.applicationId as string;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  const submitReview = async () => {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const { data: application } = await supabase
      .from("applications")
      .select("freelancer_id")
      .eq("id", applicationId)
      .single();

    if (!application) {
      setMessage("Application not found.");
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

  return (
    <div>
      <section className="hero-section" style={hero}>
        <h1>Leave a Review</h1>
        <p>Rate the freelancer and help other clients make better decisions.</p>
      </section>

      <div className="dark-card" style={card}>
        <label style={label}>Rating</label>

        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          style={input}
        >
          <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
          <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
          <option value={3}>⭐⭐⭐ 3 Stars</option>
          <option value={2}>⭐⭐ 2 Stars</option>
          <option value={1}>⭐ 1 Star</option>
        </select>

        <label style={label}>Review Comment</label>

        <textarea
          placeholder="Write your review..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ ...input, minHeight: 140 }}
        />

        <button onClick={submitReview} style={primaryBtn}>
          Submit Review
        </button>

        {message && <p style={messageBox}>{message}</p>}
      </div>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #7c3aed)",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const card = {
  padding: 30,
  borderRadius: 18,
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
  maxWidth: 700,
};

const label = {
  display: "block",
  fontWeight: "bold",
  marginBottom: 8,
};

const input = {
  width: "100%",
  padding: 13,
  marginBottom: 18,
  borderRadius: 10,
};

const primaryBtn = {
  padding: "12px 18px",
  background: "#7c3aed",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
};

const messageBox = {
  marginTop: 18,
  background: "#ecfdf5",
  color: "#166534",
  padding: 14,
  borderRadius: 12,
};