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
};

export default function FeaturedFreelancers() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);

  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "freelancer")
      .eq("suspended", false)
      .order("top_rated", { ascending: false })
      .limit(6);

    setFreelancers((data as Freelancer[]) || []);
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
            <h3>{freelancer.full_name || "Freelancer"}</h3>

            <p>{freelancer.category || "General Freelancer"}</p>

            <p>{freelancer.bio?.slice(0, 100) || "Professional freelancer."}</p>

            {freelancer.verified && <p className="verified-badge">✔ Verified</p>}

            {freelancer.top_rated && (
              <p className="top-rated-badge">★ Top Rated</p>
            )}

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