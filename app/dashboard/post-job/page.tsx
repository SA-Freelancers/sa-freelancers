"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const containsUnsafeContact = (text: string) => {
  const lower = text.toLowerCase();

  return (
    lower.includes("whatsapp") ||
    lower.includes("telegram") ||
    lower.includes("call me") ||
    lower.includes("text me") ||
    lower.includes("@gmail.com") ||
    lower.includes("@outlook.com") ||
    lower.includes("@yahoo.com") ||
    lower.includes("@icloud.com") ||
    lower.includes("facebook") ||
    lower.includes("instagram") ||
    lower.includes("tiktok") ||
    lower.includes("discord") ||
    lower.includes("skype") ||
    /\+?\d[\d\s-]{7,}\d/.test(lower)
  );
};

export default function PostJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePostJob = async () => {
    setLoading(true);
    setMessage("");

    if (!title.trim() || !description.trim() || !budget || !category.trim()) {
      setMessage("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (Number(budget) <= 0) {
      setMessage("Please enter a valid budget.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("suspended")
      .eq("id", user.id)
      .single();

    if (profile?.suspended) {
      setMessage("Your account has been suspended. You cannot post jobs.");
      setLoading(false);
      return;
    }

    if (containsUnsafeContact(title) || containsUnsafeContact(description)) {
      await supabase.from("moderation_logs").insert({
        user_id: user.id,
        source: "job_post",
        content: `${title}\n\n${description}`,
        reason: "Blocked contact details in job post",
      });

      setMessage(
        "Please keep communication inside the platform. Phone numbers, emails, WhatsApp and social media are not allowed."
      );

      setLoading(false);
      return;
    }

    const { error } = await supabase.from("jobs").insert({
      client_id: user.id,
      title,
      description,
      budget: Number(budget),
      category,
      status: "open",
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Job posted successfully!");

    setTimeout(() => {
      router.push("/dashboard/jobs");
    }, 1200);

    setLoading(false);
  };

  return (
    <main className="job-page">
      <section className="job-hero dark-card">
        <p className="dashboard-badge">Post Job</p>

        <h1>Create a new project</h1>

        <p>
          Post your project and receive professional freelancer proposals safely
          inside the platform.
        </p>
      </section>

      <section className="dark-card job-card">
        <p className="job-warning">
          🔒 Please do not include WhatsApp, phone numbers, emails or social
          media links. Keep communication inside the platform.
        </p>

        <label className="form-label">Job Title</label>
        <input
          type="text"
          placeholder="Example: Build a business website"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
        />

        <label className="form-label">Job Description</label>
        <textarea
          placeholder="Describe the project, timeline, expected deliverables and skills required..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-input proposal-textarea"
        />

        <label className="form-label">Budget</label>
        <input
          type="number"
          placeholder="Example: 2500"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="form-input"
        />

        <label className="form-label">Category</label>
        <input
          type="text"
          placeholder="Example: Web Development"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-input"
        />

        <button
          onClick={handlePostJob}
          disabled={loading}
          className="primary-action-btn"
        >
          {loading ? "Posting..." : "Post Job"}
        </button>

        {message && <p className="upload-message">{message}</p>}
      </section>
    </main>
  );
}