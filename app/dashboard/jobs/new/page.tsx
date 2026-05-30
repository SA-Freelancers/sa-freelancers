"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function NewJobPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  const postJob = async () => {
    setMessage("");

    if (!title.trim() || !category || !budget || !description.trim()) {
      setMessage("Please fill in all fields.");
      return;
    }

    setPosting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setPosting(false);
      return;
    }

    const { error } = await supabase.from("jobs").insert({
      client_id: user.id,
      title,
      category,
      budget: Number(budget),
      description,
      status: "open",
    });

    if (error) {
      setMessage(error.message);
      setPosting(false);
      return;
    }

    setMessage("Job posted successfully!");
    setTitle("");
    setCategory("");
    setBudget("");
    setDescription("");
    setPosting(false);
  };

  return (
    <main className="job-page">
      <section className="job-hero dark-card">
        <p className="dashboard-badge">Post Job</p>
        <h1>Create a new project</h1>
        <p>Describe your project clearly so freelancers can send strong proposals.</p>
      </section>

      <section className="dark-card job-card">
        <label className="form-label">Job Title</label>
        <input
          className="form-input"
          placeholder="Example: Build a business website"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="form-label">Category</label>
        <select
          className="form-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select category</option>
          <option value="Web Development">Web Development</option>
          <option value="Graphic Design">Graphic Design</option>
          <option value="Writing">Writing</option>
          <option value="Video Editing">Video Editing</option>
          <option value="Marketing">Marketing</option>
          <option value="Engineering">Engineering</option>
          <option value="Fitting & Turning">Fitting & Turning</option>
        </select>

        <label className="form-label">Budget</label>
        <input
          className="form-input"
          type="number"
          placeholder="Example: 2500"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />

        <label className="form-label">Description</label>
        <textarea
          className="form-input proposal-textarea"
          placeholder="Explain what you need, timeline, skills required and expected result..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={postJob}
          disabled={posting}
          className="primary-action-btn"
        >
          {posting ? "Posting..." : "Post Job"}
        </button>

        {message && <p className="upload-message">{message}</p>}
      </section>
    </main>
  );
}