"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Job = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  budget?: number | string;
};

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "freelancer") {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);
    await loadJobs();
    setLoading(false);
  };

  const loadJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs((data as Job[]) || []);
  };

  const saveJob = async (jobId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      job_id: jobId,
    });

    setMessage(error ? error.message : "Job saved!");
  };

  const filteredJobs = jobs.filter((job) => {
    const text = `${job.title || ""} ${job.description || ""}`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesCategory =
      !selectedCategory || job.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Freelancer Area</p>
          <h1>Access Restricted</h1>
          <p>Only freelancers can access job opportunities.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="search-page">
      <section className="search-hero dark-card">
        <p className="dashboard-badge">Freelancer Marketplace</p>

        <h1>Find paid job opportunities and grow your freelance career</h1>

        <p>
          Browse available projects, send professional proposals, and get hired
          by clients looking for your skills.
        </p>
      </section>

      <section className="dark-card search-filter-card">
        {message && <p className="search-message">{message}</p>}

        <input
          type="text"
          placeholder="Search jobs, skills, project titles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="form-input"
        >
          <option value="">All Categories</option>
          <option value="Web Development">Web Development</option>
          <option value="Mobile Development">Mobile Development</option>
          <option value="Graphic Design">Graphic Design</option>
          <option value="UI/UX Design">UI/UX Design</option>
          <option value="Writing">Writing</option>
          <option value="Video Editing">Video Editing</option>
          <option value="Digital Marketing">Digital Marketing</option>
          <option value="Engineering">Engineering</option>
          <option value="CAD Drafting">CAD Drafting</option>
          <option value="Fitting & Turning">Fitting & Turning</option>
          <option value="Data Entry">Data Entry</option>
          <option value="Virtual Assistant">Virtual Assistant</option>
        </select>
      </section>

      <section className="search-section">
        <h2>Available Opportunities</h2>

        {filteredJobs.length === 0 ? (
          <EmptyState
            emoji="💼"
            title="No jobs found"
            description="Try another keyword or category. New jobs will appear here when clients post projects."
          />
        ) : (
          <div className="marketplace-grid">
            {filteredJobs.map((job) => (
              <div key={job.id} className="dark-card marketplace-card">
                <span className="marketplace-badge">
                  {job.category || "General"}
                </span>

                <h3>{job.title || "Untitled Job"}</h3>

                <p>{job.description?.slice(0, 140) || "No description yet."}</p>

                <p>
                  <strong>Budget:</strong> ZAR {job.budget || "N/A"}
                </p>

                <div className="marketplace-actions">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="primary-action-link"
                  >
                    View & Apply
                  </Link>

                  <button
                    onClick={() => saveJob(job.id)}
                    className="danger-action-btn"
                  >
                    ❤️ Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}