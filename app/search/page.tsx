"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: freelancerData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (freelancerData) setFreelancers(freelancerData);

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (jobsData) setJobs(jobsData);
  };

  const saveFreelancer = async (freelancerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

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
    const { data: { user } } = await supabase.auth.getUser();

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
    const matchesSearch = `${freelancer.full_name} ${freelancer.role} ${freelancer.bio}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      !selectedCategory || freelancer.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = `${job.title} ${job.description}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory = !selectedCategory || job.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ maxWidth: 1300, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 36, marginBottom: 20 }}>Search Marketplace</h1>

      {message && <p>{message}</p>}

      <input
        type="text"
        placeholder="Search freelancers, jobs, skills..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle}
      />

      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        style={inputStyle}
      >
        <option value="">All Categories</option>
        <option value="Web Development">Web Development</option>
        <option value="Graphic Design">Graphic Design</option>
        <option value="Writing">Writing</option>
        <option value="Video Editing">Video Editing</option>
        <option value="Marketing">Marketing</option>
        <option value="Engineering">Engineering</option>
      </select>

      <section style={{ marginTop: 40, marginBottom: 70 }}>
        <h2>Freelancers</h2>

        <div style={gridStyle}>
          {filteredFreelancers.map((freelancer) => (
            <div key={freelancer.id} style={cardStyle}>
              <h3>{freelancer.full_name}</h3>
              <p><strong>Role:</strong> {freelancer.role}</p>
              <p><strong>Category:</strong> {freelancer.category}</p>
              <p>{freelancer.bio?.slice(0, 120) || "No bio yet."}</p>

              <Link href={`/freelancers/${freelancer.id}`} style={buttonStyle}>
                View Profile
              </Link>

              <button
                onClick={() => saveFreelancer(freelancer.id)}
                style={favoriteButton}
              >
                ❤️ Save
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Jobs</h2>

        <div style={gridStyle}>
          {filteredJobs.map((job) => (
            <div key={job.id} style={cardStyle}>
              <h3>{job.title}</h3>
              <p><strong>Category:</strong> {job.category}</p>
              <p>{job.description?.slice(0, 140)}</p>
              <p><strong>Budget:</strong> ZAR {job.budget}</p>

              <Link href={`/dashboard/jobs/${job.id}`} style={buttonStyle}>
                View Job
              </Link>

              <button onClick={() => saveJob(job.id)} style={favoriteButton}>
                ❤️ Save
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 14,
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
  marginBottom: 15,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
};

const cardStyle = {
  backgroundColor: "white",
  padding: 24,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const buttonStyle = {
  display: "inline-block",
  marginTop: 15,
  marginRight: 10,
  padding: "10px 14px",
  backgroundColor: "#2563eb",
  color: "white",
  borderRadius: 8,
  textDecoration: "none",
};

const favoriteButton = {
  marginTop: 15,
  padding: "10px 14px",
  backgroundColor: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};