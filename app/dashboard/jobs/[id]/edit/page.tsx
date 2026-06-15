"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadJob();
  }, []);

  const loadJob = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (!job) {
      router.push("/dashboard/jobs");
      return;
    }

    if (job.client_id !== user.id) {
      router.push("/dashboard/jobs");
      return;
    }

    setTitle(job.title || "");
    setCategory(job.category || "");
    setDescription(job.description || "");
    setBudget(String(job.budget || ""));

    setLoading(false);
  };

  const saveJob = async () => {
    setMessage("");

    if (!title.trim()) {
      setMessage("Job title is required.");
      return;
    }

    if (!description.trim()) {
      setMessage("Job description is required.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("jobs")
      .update({
        title,
        category,
        description,
        budget: Number(budget),
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Job updated successfully.");

    setTimeout(() => {
      router.push(`/dashboard/jobs/${id}`);
    }, 1000);

    setSaving(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="job-page">
      <section className="job-hero dark-card">
        <p className="dashboard-badge">Edit Job</p>

        <h1>Update Job Post</h1>

        <p>Edit your job information below.</p>
      </section>

      <section className="dark-card job-card">
        <label className="form-label">Job Title</label>

        <input
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="form-label">Category</label>

        <input
          className="form-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <label className="form-label">Budget (ZAR)</label>

        <input
          type="number"
          className="form-input"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />

        <label className="form-label">Description</label>

        <textarea
          className="form-input proposal-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={saveJob}
          disabled={saving}
          className="primary-action-btn"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {message && (
          <p className="upload-message">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}