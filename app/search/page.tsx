"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Review = {
  rating?: number;
};

type Profile = {
  id: string;
  full_name?: string;
  role?: string;
  bio?: string;
  category?: string;
  verified?: boolean;
  top_rated?: boolean;
  suspended?: boolean;
  last_seen?: string;
  reviews?: Review[];
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
      setAllowed(false);
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
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const { data: freelancerData } = await supabase
      .from("profiles")
      .select(`
        *,
        reviews (
          rating
        )
      `)
      .order("created_at", { ascending: false });

    setFreelancers((freelancerData as Profile[]) || []);

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs((jobsData as Job[]) || []);
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

  const getAverageRating = (reviews?: Review[]) => {
    if (!reviews || reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => {
      return sum + (review.rating || 0);
    }, 0);

    return total / reviews.length;
  };

  const displayRating = (reviews?: Review[]) => {
    if (!reviews || reviews.length === 0) return "No ratings";

    return getAverageRating(reviews).toFixed(1);
  };

  const isOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;

    const fifteenMinutes = 1000 * 60 * 15;

    return (
      new Date().getTime() -
        new Date(lastSeen).getTime() <
      fifteenMinutes
    );
  };

  const getLastSeenText = (lastSeen?: string) => {
    if (!lastSeen) return "⚪ Offline";

    const diff =
      new Date().getTime() -
      new Date(lastSeen).getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 15) return "🟢 Online";

    if (minutes < 60) {
      return `⚪ Active ${minutes} min ago`;
    }

    if (hours < 24) {
      return `⚪ Active ${hours} hour(s) ago`;
    }

    return `⚪ Active ${days} day(s) ago`;
  };

  const filteredFreelancers = freelancers
    .filter((freelancer) => {
      const text = `${freelancer.full_name || ""} ${
        freelancer.role || ""
      } ${freelancer.bio || ""}`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesCategory =
        !selectedCategory ||
        freelancer.category === selectedCategory;

      return matchesSearch && matchesCategory && !freelancer.suspended;
    })
    .sort((a, b) => {
      if (b.top_rated !== a.top_rated) {
        return Number(b.top_rated) - Number(a.top_rated);
      }

      if (b.verified !== a.verified) {
        return Number(b.verified) - Number(a.verified);
      }

      return getAverageRating(b.reviews) - getAverageRating(a.reviews);
    });

  const filteredJobs = jobs.filter((job) => {
    const text = `${job.title || ""} ${
      job.description || ""
    }`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesCategory =
      !selectedCategory ||
      job.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Freelancer Area</p>
          <h1>Access Restricted</h1>
          <p>Only freelancers can access the Marketplace.</p>
        </section>
      </main>
    );
  }

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
        <h2>Freelancers</h2>

        {filteredFreelancers.length === 0 ? (
          <EmptyState
            emoji="👤"
            title="No freelancers found"
            description="Try another keyword or category."
          />
        ) : (
          <div className="marketplace-grid">
            {filteredFreelancers.map((freelancer) => {
              const reviewCount = freelancer.reviews?.length || 0;

              return (
                <div key={freelancer.id} className="dark-card marketplace-card">
                  <span className="marketplace-badge">
                    {freelancer.category || "Freelancer"}
                  </span>

                  <h3 className="marketplace-user-name">
                    {freelancer.full_name || "Unnamed Freelancer"}
                  </h3>

                  <div className="marketplace-badges">
                    {freelancer.verified && (
                      <span className="verified-badge small">✔ Verified</span>
                    )}

                    {freelancer.top_rated && (
                      <span className="top-rated-badge">★ Top Rated</span>
                    )}

                    <span className="rating-badge">
                      ⭐ {displayRating(freelancer.reviews)} ({reviewCount})
                    </span>
                  </div>

                  <p
                    className={`last-seen-text ${
                      isOnline(freelancer.last_seen) ? "online" : "offline"
                    }`}
                  >
                    {getLastSeenText(freelancer.last_seen)}
                  </p>

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
              );
            })}
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