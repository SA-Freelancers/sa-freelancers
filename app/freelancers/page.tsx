"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Freelancer = {
  id: string;
  full_name?: string;
  headline?: string;
  category?: string;
  bio?: string;
  rating?: number;
  completed_jobs?: number;
  completed_projects?: number;
  hourly_rate?: number;
  experience_years?: number;
  verified?: boolean;
  top_rated?: boolean;
  avatar_url?: string;
  avatar_initials?: string;
  is_demo?: boolean;
};

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async () => {
    const { data: realData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "freelancer")
      .eq("suspended", false)
      .order("rating", { ascending: false });

    const { data: demoData } = await supabase
      .from("demo_freelancers")
      .select("*");

    const realFreelancers = (realData as Freelancer[]) || [];

    const demoFreelancers = ((demoData as Freelancer[]) || []).map((item) => ({
      ...item,
      is_demo: true,
    }));

    setFreelancers([...realFreelancers, ...demoFreelancers]);
    setLoading(false);
  };

  const filteredFreelancers = freelancers.filter((item) => {
    const text = `${item.full_name || ""} ${item.headline || ""} ${
      item.category || ""
    }`.toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (!category || item.category === category)
    );
  });

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="search-page">
      <section className="search-hero dark-card">
        <p className="dashboard-badge">Browse Talent</p>
        <h1>Find skilled South African freelancers</h1>
        <p>
          Explore verified freelancers, compare experience, rates and skills,
          then hire safely through Freelance Hub SA.
        </p>
      </section>

      <section className="dark-card search-filter-card">
        <div className="search-filters-grid">
          <input
            type="text"
            placeholder="Search freelancers, skills, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
          <h2>Available Freelancers</h2>
          <p>
            <strong>{filteredFreelancers.length}</strong> Freelancers Found
          </p>
        </div>

        {filteredFreelancers.length === 0 ? (
          <EmptyState
            emoji="👥"
            title="No freelancers found"
            description="Try another search keyword or category."
          />
        ) : (
          <div className="marketplace-grid">
            {filteredFreelancers.map((item) => (
              <div key={item.id} className="dark-card marketplace-card">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.full_name || "Freelancer"}
                      className="profile-avatar"
                      style={{ width: 58, height: 58 }}
                    />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      {item.avatar_initials
                        ? item.avatar_initials
                        : (item.full_name || "FH")
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3 style={{ margin: 0, minHeight: "auto" }}>
                      {item.full_name || "Freelancer"}
                    </h3>
                    <p style={{ margin: 0 }}>
                      {item.headline ||
                        item.category ||
                        "Professional Freelancer"}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 12,
                    marginBottom: 12,
                  }}
                >
                  {item.verified && (
                    <span className="verified-badge">✔ Verified</span>
                  )}

                  {item.top_rated && (
                    <span className="top-rated-badge">⭐ Top Rated</span>
                  )}

                  <span className="marketplace-badge">
                    {item.category || "Professional"}
                  </span>

                  {item.is_demo && (
                    <span className="marketplace-badge">Demo Profile</span>
                  )}
                </div>

                <div className="job-meta">
                  <p className="job-meta-item">
                    <span>⭐ Rating</span>
                    <span>{item.rating || 4.8}</span>
                  </p>

                  <p className="job-meta-item">
                    <span>💼 Projects</span>
                    <span>
                      {item.completed_jobs || item.completed_projects || 0}
                    </span>
                  </p>

                  <p className="job-meta-item">
                    <span>💰 Rate</span>
                    <span>R{item.hourly_rate || 250}/hr</span>
                  </p>
                </div>

                <p
                  style={{
                    color: "#64748b",
                    fontSize: ".9rem",
                    marginTop: 10,
                    marginBottom: 16,
                  }}
                >
                  {item.experience_years || 1} years experience
                </p>

                <div className="marketplace-actions">
                  <Link
                    href={
                      item.is_demo
                        ? "/freelancers"
                        : `/freelancers/${item.id}`
                    }
                    className="primary-action-link"
                  >
                    View Profile
                  </Link>

                  <Link
                    href="/dashboard/post-job"
                    className="secondary-action-btn"
                  >
                    Invite to Job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}