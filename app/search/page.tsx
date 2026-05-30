"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import EmptyState from "../components/EmptyState";

type Profile = {
  id: string;
  full_name?: string;
  role?: string;
  bio?: string;
  category?: string;
};

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
  const [freelancers, setFreelancers] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: freelancerData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setFreelancers(freelancerData || []);

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs(jobsData || []);
  };

  const saveFreelancer = async (freelancerId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      freelancer_id: freelancerId,
    });

    setMessage(error ? error.message : "Freelancer saved!");
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

  const filteredFreelancers = freelancers.filter((freelancer) => {
    const text = `${freelancer.full_name || ""} ${freelancer.role || ""} ${
      freelancer.bio || ""
    }`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || freelancer.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredJobs = jobs.filter((job) => {
    const text = `${job.title || ""} ${job.description || ""}`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || job.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="search-page">
      <section className="search-hero dark-card">
        <p className="dashboard-badge">Marketplace</p>

        <h1>Find freelancers and opportunities faster</h1>

        <p>
          Search skilled freelancers, available jobs, services and categories in
          one clean marketplace.
        </p>
      </section>

      <section className="dark-card search-filter-card">
        {message && <p className="search-message">{message}</p>}

        <input
          type="text"
          placeholder="Search freelancers, jobs, skills..."
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
          <option value="Graphic Design">Graphic Design</option>
          <option value="Writing">Writing</option>
          <option value="Video Editing">Video Editing</option>
          <option value="Marketing">Marketing</option>
          <option value="Engineering">Engineering</option>
          <option value="Fitting & Turning">Fitting & Turning</option>
        </select>
      </section>

      <section className="search-section">
        <h2>Freelancers</h2>

        {filteredFreelancers.length === 0 ? (
          <EmptyState
            emoji="👤"
            title="No freelancers found"
            description="Try another keyword or category."
          />
        ) : (
          <div className="marketplace-grid">
            {filteredFreelancers.map((freelancer) => (
              <div key={freelancer.id} className="dark-card marketplace-card">
                <span className="marketplace-badge">
                  {freelancer.category || "Freelancer"}
                </span>

                <h3>{freelancer.full_name || "Unnamed Freelancer"}</h3>

                <p>
                  <strong>Role:</strong> {freelancer.role || "N/A"}
                </p>

                <p>{freelancer.bio?.slice(0, 120) || "No bio yet."}</p>

                <div className="marketplace-actions">
                  <Link
                    href={`/freelancers/${freelancer.id}`}
                    className="primary-action-link"
                  >
                    View Profile
                  </Link>

                  <button
                    onClick={() => saveFreelancer(freelancer.id)}
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

      <section className="search-section">
        <h2>Jobs</h2>

        {filteredJobs.length === 0 ? (
          <EmptyState
            emoji="💼"
            title="No jobs found"
            description="Try another keyword or category."
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
                    View Job
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