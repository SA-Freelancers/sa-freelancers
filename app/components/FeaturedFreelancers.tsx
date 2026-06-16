"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Freelancer = {
  id: string;
  full_name?: string;
  category?: string;
  bio?: string;
  avatar_url?: string;
  verified?: boolean;
  top_rated?: boolean;
  email_verified?: boolean;
  reviews?: {
    rating: number;
  }[];
};

export default function FeaturedFreelancers() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);

  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select(
        `
        *,
        reviews (
          rating
        )
      `
      )
      .eq("role", "freelancer")
      .eq("suspended", false)
      .order("top_rated", { ascending: false })
      .limit(6);

    setFreelancers((data as Freelancer[]) || []);
  };

  const getAverageRating = (reviews?: { rating: number }[]) => {
    if (!reviews || reviews.length === 0) return "No ratings";

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  if (freelancers.length === 0) return null;

  return (
    <section className="home-section">
      <div className="home-section-header">
        <p className="dashboard-badge">Featured Freelancers</p>
        <h2>Hire skilled South African talent</h2>
      </div>

      <div className="home-grid">
        {freelancers.map((freelancer) => (
          <div key={freelancer.id} className="dark-card home-card">
            <div className="profile-preview-placeholder">
              {freelancer.avatar_url ? (
                <img
                  src={freelancer.avatar_url}
                  alt={freelancer.full_name || "Freelancer"}
                  className="profile-preview-avatar"
                />
              ) : (
                "👤"
              )}
            </div>

            <h3>{freelancer.full_name || "Freelancer"}</h3>

            <p>
              <strong>Category:</strong>{" "}
              {freelancer.category || "General Freelancer"}
            </p>

            <p>
              ⭐ {getAverageRating(freelancer.reviews)} (
              {freelancer.reviews?.length || 0} reviews)
            </p>

            <p>{freelancer.bio?.slice(0, 120) || "Professional freelancer."}</p>

            <div className="marketplace-badges">
              {freelancer.email_verified && (
                <span className="verified-badge">✔ Email Verified</span>
              )}

              {freelancer.verified && (
                <span className="verified-badge">✔ Verified</span>
              )}

              {freelancer.top_rated && (
                <span className="top-rated-badge">★ Top Rated</span>
              )}
            </div>

            <Link
              href={`/freelancers/${freelancer.id}`}
              className="primary-action-link"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}