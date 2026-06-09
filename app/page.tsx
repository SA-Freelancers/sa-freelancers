"use client";

import LatestJobs from "@/app/components/LatestJobs";
import FeaturedFreelancers from "@/app/components/FeaturedFreelancers";
import PlatformStats from "@/app/components/PlatformStats";
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
          <Link href="/search" className="home-primary-btn">
  Find Work
</Link>

          <Link href="/login" className="home-secondary-btn">
            Login
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
          <p className="dashboard-badge">South Africa's Trusted Freelance Marketplace</p>
<h1>
  South Africa&apos;s freelance marketplace
  <span> for trusted work.</span>
</h1>

<p>
  Connect with skilled South African freelancers, post jobs, apply for projects,
  manage contracts and build professional working relationships safely.
</p>

          <div className="home-actions">{renderHeroButtons()}</div>
        </div>
      </section>

      <PlatformStats />
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
          <p className="dashboard-badge">How It Works</p>
          <h2>Simple steps to get work done</h2>
        </div>

        <div className="home-grid">
          <div className="dark-card home-card">
            <h3>1. Post a Job</h3>
            <p>Create a project with your budget, category and full details.</p>
          </div>

          <div className="dark-card home-card">
            <h3>2. Get Proposals</h3>
            <p>Freelancers apply with pricing, skills and cover messages.</p>
          </div>

          <div className="dark-card home-card">
            <h3>3. Hire & Manage</h3>
            <p>Choose the best freelancer and manage progress from dashboard.</p>
          </div>
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
              Proposals are checked to discourage phone numbers, WhatsApp and
              email sharing before a client hires.
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
          <p>Join South Africa’s growing freelance marketplace today.</p>

          <Link href="/register" className="home-primary-btn">
            Create Free Account
          </Link>
        </section>
      )}
    </main>
  );
}