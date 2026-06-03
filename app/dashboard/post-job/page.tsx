"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function PostJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const containsUnsafeContact = (text: string) => {
  const lower = text.toLowerCase();

  return (
    lower.includes("whatsapp") ||
    lower.includes("@gmail.com") ||
    lower.includes("@outlook.com") ||
    lower.includes("@yahoo.com") ||
    /\d{10,}/.test(lower)
  );
};
  const handlePostJob = async () => {
    setLoading(true);
    setMessage("");

    // GET CURRENT USER
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }
if (
  containsUnsafeContact(title) ||
  containsUnsafeContact(description)
) {
  setMessage(
    "Please keep communication inside the platform. Phone numbers, emails and WhatsApp are not allowed."
  );

  setLoading(false);
  return;
}
    // INSERT JOB
    const { error } = await supabase.from("jobs").insert({
      client_id: user.id,
      title,
      description,
      budget: Number(budget),
      category,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Job posted successfully!");

    setTimeout(() => {
      router.push("/dashboard/jobs");
    }, 1500);

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h1>Post a Job</h1>

      <input
        type="text"
        placeholder="Job Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ padding: 10 }}
      />

      <textarea
        placeholder="Job Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{
          padding: 10,
          minHeight: 120,
        }}
      />

      <input
        type="number"
        placeholder="Budget"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        style={{ padding: 10 }}
      />

      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ padding: 10 }}
      />

      <button
        onClick={handlePostJob}
        disabled={loading}
        style={{
          padding: 12,
          backgroundColor: "black",
          color: "white",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Posting..." : "Post Job"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}