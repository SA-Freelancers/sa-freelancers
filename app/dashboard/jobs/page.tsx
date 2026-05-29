"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function JobsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [category, setCategory] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs(data || []);
  };

  const createJob = async () => {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const { error } = await supabase.from("jobs").insert({
      client_id: user.id,
      title,
      description,
      budget: Number(budget),
      category,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Job created successfully!");
    setTitle("");
    setDescription("");
    setBudget("");
    setCategory("");
    loadJobs();
  };

  return (
    <div>
      <div style={hero}>
        <h1>Jobs Marketplace</h1>
        <p>Create jobs, browse opportunities, and connect with freelancers.</p>
      </div>

      <div style={formCard}>
        <h2>Post a New Job</h2>

        <input
          placeholder="Job title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={input}
        />

        <textarea
          placeholder="Job description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...input, minHeight: 120 }}
        />

        <input
          type="number"
          placeholder="Budget in ZAR"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          style={input}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={input}
        >
          <option value="">Select category</option>
          <option value="Web Development">Web Development</option>
          <option value="Graphic Design">Graphic Design</option>
          <option value="Writing">Writing</option>
          <option value="Video Editing">Video Editing</option>
          <option value="Marketing">Marketing</option>
          <option value="Engineering">Engineering</option>
        </select>

        <button onClick={createJob} style={primaryBtn}>
          Create Job
        </button>

        {message && <p>{message}</p>}
      </div>

      <h2 style={{ marginTop: 40 }}>Available Jobs</h2>

      <div style={grid}>
        {jobs.map((job) => (
          <div key={job.id} style={card}>
            <span style={badge}>{job.category || "General"}</span>

            <h3>{job.title}</h3>

            <p style={{ color: "#475569" }}>
              {job.description?.slice(0, 140)}
            </p>

            <p>
              <strong>Budget:</strong> ZAR {job.budget}
            </p>

            <Link href={`/dashboard/jobs/${job.id}`} style={linkBtn}>
              View Job
            </Link>

            <Link
              href={`/dashboard/client/jobs/${job.id}/applications`}
              style={outlineBtn}
            >
              Applications
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  color: "white",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const formCard = {
  background: "white",
  padding: 25,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const input = {
  width: "100%",
  padding: 13,
  marginBottom: 14,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
};

const primaryBtn = {
  padding: "12px 18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 22,
};

const card = {
  background: "white",
  padding: 24,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const badge = {
  display: "inline-block",
  background: "#dbeafe",
  color: "#1d4ed8",
  padding: "6px 10px",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: "bold",
};

const linkBtn = {
  display: "inline-block",
  marginTop: 15,
  marginRight: 10,
  padding: "10px 14px",
  background: "#2563eb",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
};

const outlineBtn = {
  display: "inline-block",
  marginTop: 15,
  padding: "10px 14px",
  background: "#f1f5f9",
  color: "#0f172a",
  borderRadius: 10,
  textDecoration: "none",
};