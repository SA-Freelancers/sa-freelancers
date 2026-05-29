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
    const text = `${freelancer.full_name} ${freelancer.role} ${freelancer.bio}`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesCategory =
      !selectedCategory || freelancer.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const filteredJobs = jobs.filter((job) => {
    const text = `${job.title} ${job.description}`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesCategory =
      !selectedCategory || job.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main style={{ maxWidth: 1300, margin: "40px auto", padding: 20 }}>
      <section style={hero}>
        <h1>Search Marketplace</h1>
        <p>Find freelancers, jobs, services, skills, and opportunities.</p>
      </section>

      <section style={filterCard}>
        {message && <p>{message}</p>}

        <input
          type="text"
          placeholder="Search freelancers, jobs, skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={input}
        >
          <option value="">All Categories</option>
          <option value="Web Development">Web Development</option>
          <option value="Graphic Design">Graphic Design</option>
          <option value="Writing">Writing</option>
          <option value="Video Editing">Video Editing</option>
          <option value="Marketing">Marketing</option>
          <option value="Engineering">Engineering</option>
        </select>
      </section>

      <section style={{ marginTop: 45 }}>
        <h2>Freelancers</h2>

        <div style={grid}>
          {filteredFreelancers.map((freelancer) => (
            <div key={freelancer.id} style={card}>
              {freelancer.avatar_url && (
                <img
                  src={freelancer.avatar_url}
                  alt="Avatar"
                  width={90}
                  height={90}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: 15,
                  }}
                />
              )}

              <span style={badge}>{freelancer.category || "Freelancer"}</span>

              <h3>{freelancer.full_name || "Unnamed Freelancer"}</h3>

              <p>
                <strong>Role:</strong> {freelancer.role || "N/A"}
              </p>

              <p style={{ color: "#475569" }}>
                {freelancer.bio?.slice(0, 120) || "No bio yet."}
              </p>

              <Link href={`/freelancers/${freelancer.id}`} style={blueBtn}>
                View Profile
              </Link>

              <button onClick={() => saveFreelancer(freelancer.id)} style={redBtn}>
                ❤️ Save
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 60 }}>
        <h2>Jobs</h2>

        <div style={grid}>
          {filteredJobs.map((job) => (
            <div key={job.id} style={card}>
              <span style={badge}>{job.category || "General"}</span>

              <h3>{job.title}</h3>

              <p style={{ color: "#475569" }}>
                {job.description?.slice(0, 140)}
              </p>

              <p>
                <strong>Budget:</strong> ZAR {job.budget}
              </p>

              <Link href={`/dashboard/jobs/${job.id}`} style={blueBtn}>
                View Job
              </Link>

              <button onClick={() => saveJob(job.id)} style={redBtn}>
                ❤️ Save
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  color: "white",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const filterCard = {
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

const blueBtn = {
  display: "inline-block",
  marginTop: 15,
  marginRight: 10,
  padding: "10px 14px",
  background: "#2563eb",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
};

const redBtn = {
  marginTop: 15,
  padding: "10px 14px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
};