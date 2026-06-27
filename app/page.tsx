"use client";

import LatestJobs from "@/app/components/LatestJobs";
import FeaturedFreelancers from "@/app/components/FeaturedFreelancers";
import PlatformStats from "@/app/components/PlatformStats";
import MarketplaceActivity from "@/app/components/MarketplaceActivity";
import TrendingCategories from "@/app/components/TrendingCategories";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

const services = [
  "Web Development",
  "Graphic Design",
  "Writing",
  "Marketing",
  "Video Editing",
  "Engineering",
];

export default function HomePage() {
  const [userRole, setUserRole] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoggedIn(false);
      return;
    }

    setLoggedIn(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setUserRole(profile?.role || "");
  };

  const renderHeroButtons = () => {
    if (!loggedIn) {
      return (
        <>
          <Link href="/register" className="home-primary-btn">
            Hire Freelancers
          </Link>

          <Link href="/search" className="home-secondary-btn">
            Find Work
          </Link>
        </>
      );
    }

    if (userRole === "client") {
      return (
        <>
          <Link href="/dashboard/post-job" className="home-primary-btn">
            Post Job
          </Link>

          <Link href="/dashboard/jobs" className="home-secondary-btn">
            My Jobs
          </Link>
        </>
      );
    }

    if (userRole === "freelancer") {
      return (
        <>
          <Link href="/search" className="home-primary-btn">
            Marketplace
          </Link>

          <Link href="/dashboard/contracts" className="home-secondary-btn">
            Contracts
          </Link>
        </>
      );
    }

    return (
      <Link href="/dashboard" className="home-primary-btn">
        Dashboard
      </Link>
    );
  };

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="dashboard-badge">Freelance Hub SA</p>

          <h1>
            South Africa&apos;s trusted freelance marketplace
            <span> for skilled work.</span>
          </h1>

          <p>
            Hire skilled freelancers, find quality projects, manage contracts,
            build reviews and work safely on one South African platform.
          </p>

          <div className="home-actions">{renderHeroButtons()}</div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 22,
            }}
          >
            <span className="verified-badge">✔ Secure Contracts</span>
            <span className="verified-badge">✔ Verified Profiles</span>
            <span className="top-rated-badge">★ Trusted Reviews</span>
            <span className="verified-badge">🇿🇦 South African Talent</span>
          </div>
        </div>
      </section>

      <PlatformStats />

      <section
        className="dark-card"
        style={{
          padding: "30px",
          marginTop: "30px",
          textAlign: "center",
        }}
      >
        <h2>Why Freelance Hub SA?</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div>
            <h3>✔ Verified Profiles</h3>
            <p>Build trust through professional freelancer accounts.</p>
          </div>

          <div>
            <h3>🔒 Secure Platform</h3>
            <p>Keep communication, contracts and reviews inside the platform.</p>
          </div>

          <div>
            <h3>⭐ Reviews & Ratings</h3>
            <p>Transparent feedback from clients and freelancers.</p>
          </div>

          <div>
            <h3>🇿🇦 South African Focus</h3>
            <p>Built for local businesses, freelancers and opportunities.</p>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-header">
          <p className="dashboard-badge">How It Works</p>
          <h2>Simple steps to get work done</h2>
        </div>

        <div className="home-grid">
          <div className="dark-card home-card">
            <h3>1. Post a Job</h3>
            <p>Create a project with your budget, category and full details.</p>
          </div>

          <div className="dark-card home-card">
            <h3>2. Review Proposals</h3>
            <p>Compare freelancers by skills, pricing, profiles and reviews.</p>
          </div>

          <div className="dark-card home-card">
            <h3>3. Hire & Manage</h3>
            <p>Use contracts, messages and reviews to complete work safely.</p>
          </div>
        </div>
      </section>

      <FeaturedFreelancers />
      <LatestJobs />

      <section className="home-section">
        <div className="home-section-header">
          <p className="dashboard-badge">Popular Services</p>
          <h2>Find skills for every project</h2>
        </div>

        <div className="home-grid">
          {services.map((item) => (
            <div key={item} className="dark-card home-card">
              <h3>{item}</h3>
              <p>Find skilled freelancers for {item.toLowerCase()} projects.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-header">
          <p className="dashboard-badge">Trust & Safety</p>
          <h2>Built to keep work inside the platform</h2>
        </div>

        <div className="home-grid">
          <div className="dark-card home-card">
            <h3>No Off-Platform Contact Before Hiring</h3>
            <p>
              Proposals discourage phone numbers, WhatsApp and email sharing
              before a client hires.
            </p>
          </div>

          <div className="dark-card home-card">
            <h3>Safer Proposal Flow</h3>
            <p>
              Freelancers apply with a budget and cover message while clients
              review proposals from the dashboard.
            </p>
          </div>

          <div className="dark-card home-card">
            <h3>Platform-Based Trust</h3>
            <p>
              Profiles, reviews, uploads, favorites and notifications help users
              make better hiring decisions.
            </p>
          </div>
        </div>
      </section>

      {!loggedIn && (
        <section className="home-cta dark-card">
          <h2>Ready to build your next project?</h2>
          <p>Join South Africa&apos;s growing freelance marketplace today.</p>

          <Link href="/register" className="home-primary-btn">
            Create Free Account
          </Link>
        </section>
      )}
    </main>
  );
}