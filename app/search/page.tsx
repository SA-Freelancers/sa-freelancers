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
  created_at?: string;
  applications?: { id: string }[];
};

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [activeSearch, setActiveSearch] = useState("");

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
  .select(`
    *,
    applications (
      id
    )
  `)
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

  const clearFilters = () => {
    setSearch("");
    setActiveSearch("");
    setSelectedCategory("");
    setMinBudget("");
    setSortBy("newest");
  };

  const filteredJobs = jobs
    .filter((job) => {
      const text = `${job.title || ""} ${job.description || ""} ${
        job.category || ""
      }`.toLowerCase();

      const matchesSearch = text.includes(activeSearch.toLowerCase());

      const matchesCategory =
        !selectedCategory || job.category === selectedCategory;

      const jobBudget = Number(job.budget || 0);
      const matchesBudget = !minBudget || jobBudget >= Number(minBudget);

      return matchesSearch && matchesCategory && matchesBudget;
    })
    .sort((a, b) => {
      if (sortBy === "budget-high") {
        return Number(b.budget || 0) - Number(a.budget || 0);
      }

      if (sortBy === "budget-low") {
        return Number(a.budget || 0) - Number(b.budget || 0);
      }

      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
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
        Browse available projects, filter by budget and category, send
        professional proposals, and get hired by clients looking for your
        skills.
      </p>
    </section>

    <section className="dark-card search-filter-card">
      {message && <p className="search-message">{message}</p>}

      <div className="search-filters-grid">

  <input
    type="text"
    placeholder="🔍 Search jobs, skills, project titles..."
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
    <option value="Engineering">Engineering</option>
    <option value="CAD Drafting">CAD Drafting</option>
    <option value="Web Development">Web Development</option>
    <option value="Graphic Design">Graphic Design</option>
    <option value="Writing">Writing</option>
    <option value="Marketing">Marketing</option>
    <option value="Video Editing">Video Editing</option>
    <option value="Virtual Assistant">Virtual Assistant</option>
  </select>

  <input
    type="number"
    placeholder="Minimum Budget"
    value={minBudget}
    onChange={(e) => setMinBudget(e.target.value)}
    className="form-input"
  />

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="form-input"
  >
    <option value="newest">Newest First</option>
    <option value="budget-high">Highest Budget</option>
    <option value="budget-low">Lowest Budget</option>
  </select>

</div>

<div className="search-buttons">

  <button
    onClick={() => setActiveSearch(search)}
    className="primary-action-btn"
  >
    🔍 Search Jobs
  </button>

  <button
    onClick={clearFilters}
    className="secondary-action-btn"
  >
    Clear Filters
  </button>

</div>
    </section>

    <section className="search-section">
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 20,
  }}
>
  <h2>Available Opportunities</h2>

  <p>
    <strong>{filteredJobs.length}</strong> Jobs Found
  </p>
</div>

      {filteredJobs.length === 0 ? (
        <EmptyState
          emoji="💼"
          title="No jobs found"
          description="Try another keyword, category or budget. New jobs will appear here when clients post projects."
        />
      ) : (
        <div className="marketplace-grid">
          {filteredJobs.map((job) => (
            <div key={job.id} className="dark-card marketplace-card">
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
      flexWrap: "wrap",
    }}
  >
    <span className="marketplace-badge">
      {job.category || "General"}
    </span>

    {Number(job.budget || 0) >= 15000 && (
  <span className="top-rated-badge">💎 High Paying</span>
)}

{Number(job.budget || 0) >= 10000 && Number(job.budget || 0) < 15000 && (
  <span className="top-rated-badge">⭐ Featured</span>
)}

{job.created_at &&
  new Date(job.created_at).getTime() >
    Date.now() - 1000 * 60 * 60 * 24 && (
    <span className="verified-badge">🔥 Urgent</span>
  )}
  </div>

  <h3>{job.title || "Untitled Job"}</h3>

  <p>{job.description?.slice(0, 140) || "No description yet."}</p>

  <div className="job-meta">
    <p>
      💰 <strong>Budget</strong>
      <br />
      R{Number(job.budget || 0).toLocaleString("en-ZA")}
    </p>

    <p>
      👥 <strong>Applicants</strong>
      <br />
      {job.applications?.length || 0}
    </p>

    <p>
      📅 <strong>Posted</strong>
      <br />
      {job.created_at
        ? new Date(job.created_at).toLocaleDateString("en-ZA")
        : "-"}
    </p>
  </div>

  <div className="marketplace-actions">
    <Link
      href={`/dashboard/jobs/${job.id}`}
      className="primary-action-link"
    >
      View Details →
    </Link>

    <button
      onClick={() => saveJob(job.id)}
      className="danger-action-btn"
    >
      🤍 Save Job
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