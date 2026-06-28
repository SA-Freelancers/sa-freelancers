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
  rating?: number;
  completed_jobs?: number;
  hourly_rate?: number;
  experience_years?: number;
  verified?: boolean;
  top_rated?: boolean;
  avatar_url?: string;
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
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "freelancer")
      .eq("suspended", false)
      .order("rating", { ascending: false });

    setFreelancers((data as Freelancer[]) || []);
    setLoading(false);
  };

  const filteredFreelancers = freelancers.filter((item) => {
    const text = `${item.full_name || ""} ${item.headline || ""} ${
      item.category || ""
    }`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesCategory = !category || item.category === category;

    return matchesSearch && matchesCategory;
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
                      {(item.full_name || "FH")
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
                      {item.headline || item.category || "Professional Freelancer"}
                    </p>
                  </div>
                </div>

                <div className="marketplace-badges" style={{ marginTop: 14 }}>
                  {item.verified && (
                    <span className="verified-badge">✔ Verified</span>
                  )}

                  {item.top_rated && (
                    <span className="top-rated-badge">★ Top Rated</span>
                  )}
                </div>

                <div className="job-meta">
                  <p className="job-meta-item">
                    <span>⭐ Rating</span>
                    <span>{item.rating || "New"}</span>
                  </p>

                  <p className="job-meta-item">
                    <span>💼 Projects</span>
                    <span>{item.completed_jobs || 0}</span>
                  </p>

                  <p className="job-meta-item">
                    <span>💰 Rate</span>
                    <span>R{item.hourly_rate || 250}/hr</span>
                  </p>
                </div>

                <div className="marketplace-actions">
                  <Link
                    href={`/freelancers/${item.id}`}
                    className="primary-action-link"
                  >
                    View Profile →
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