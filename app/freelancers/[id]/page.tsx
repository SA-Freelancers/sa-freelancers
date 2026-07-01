"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";
import RecommendedJobs from "@/app/components/RecommendedJobs";
import ProfileCompleteness from "@/app/components/ProfileCompleteness";

type Profile = {
  id: string;

  full_name?: string;
  role?: string;

  headline?: string;
  bio?: string;
  category?: string;

  avatar_url?: string;
  cover_image?: string;

  location?: string;
  country?: string;

  availability?: string;
  response_time?: string;

  years_experience?: number;

  hourly_rate?: number;

  completed_projects?: number;

  repeat_clients?: number;

  completion_rate?: number;

  rating?: number;

  skills?: string[];

  languages?: string[];

  education?: string;

  certifications?: string[];

  linkedin_url?: string;

  website_url?: string;

  cv_url?: string;

  portfolio_url?: string;

  verified?: boolean;

  top_rated?: boolean;

  suspended?: boolean;

  email_verified?: boolean;

  created_at?: string;
};

type Review = {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
};

export default function FreelancerPublicProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  type PortfolioProject = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  software?: string;
  image_url?: string;
  project_url?: string;
};

const [portfolioProjects, setPortfolioProjects] =
  useState<PortfolioProject[]>([]);
  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("role", "freelancer")
      .single();

      const { data: portfolioData } = await supabase
  .from("portfolio_projects")
  .select("*")
  .eq("freelancer_id", id)
  .order("created_at", { ascending: false });

setPortfolioProjects(
  (portfolioData as PortfolioProject[]) || []
);

    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*")
      .eq("freelancer_id", id)
      .order("created_at", { ascending: false });

    setProfile(profileData as Profile);
    setReviews((reviewData as Review[]) || []);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!profile || profile.suspended) {
    return (
      <main className="profile-page">
        <EmptyState
          emoji="👤"
          title="Profile not found"
          description="This freelancer profile could not be found."
        />
      </main>
    );
  }

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "No ratings";

  return (
    <main className="profile-page">
      <section className="profile-hero dark-card">
        <div className="profile-avatar-wrap">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || "Freelancer profile"}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">👤</div>
          )}
        </div>

        <div className="profile-hero-content">
          <p className="dashboard-badge">
            {profile.category || "Professional Freelancer"}
          </p>

          <h1 className="profile-name">
            {profile.full_name || "Freelancer"}
          </h1>

          <p className="profile-role">
  {profile.headline || `South African ${profile.category || "Freelancer"}`}
</p>

<p className="profile-role">
  📍 {profile.location || "Remote"} • {profile.country || "South Africa"}
</p>

<p className="profile-role">
  ⚡ {profile.response_time || "Within 2 hours"} • {profile.availability || "Available"}
</p>

          <div className="marketplace-badges">
            {profile.email_verified && (
              <span className="verified-badge">✔ Email Verified</span>
            )}

            {profile.verified && (
              <span className="verified-badge">✔ Verified</span>
            )}

            {profile.top_rated && (
              <span className="top-rated-badge">★ Top Rated</span>
            )}

            <span className="rating-badge">
              ⭐ {averageRating} ({reviews.length} reviews)
            </span>
            <span className="verified-badge">
  💪 Profile Strength:{" "}
  {profile.skills?.length && profile.bio && profile.avatar_url
    ? "Excellent"
    : profile.bio
    ? "Good"
    : "Needs Completion"}
</span>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <a href={`/hire/${profile.id}`} className="primary-action-link">
              Hire Freelancer
            </a>

            <a href={`/freelancers/${profile.id}/report`} className="reject-btn">
              Report User
            </a>
          </div>
        </div>
      </section>

      <section className="profile-layout">
        <div className="dark-card profile-card">
          <h2>Professional Summary</h2>

          <p className="profile-bio">
            {profile.bio || "This freelancer has not added a bio yet."}
          </p>

          <div className="profile-divider" />

          <h2>Professional Details</h2>

<p><strong>Headline:</strong> {profile.headline || "Professional Freelancer"}</p>
<p><strong>Location:</strong> {profile.location || "Remote"}</p>
<p><strong>Country:</strong> {profile.country || "South Africa"}</p>
<p><strong>Availability:</strong> {profile.availability || "Available"}</p>
<p><strong>Response Time:</strong> {profile.response_time || "Within 2 hours"}</p>
<p><strong>Experience:</strong> {profile.years_experience || 1} Years</p>
<p><strong>Hourly Rate:</strong> R{profile.hourly_rate || 250}/hr</p>
<p><strong>Completed Projects:</strong> {profile.completed_projects || 0}</p>
<p><strong>Completion Rate:</strong> {profile.completion_rate || 100}%</p>
          <div className="profile-divider" />

          <h2>Documents & Portfolio</h2>

          <div className="profile-documents">
            {profile.cv_url && (
              <a href={profile.cv_url} target="_blank" rel="noreferrer">
                📄 View CV
              </a>
            )}

            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer">
                🖼️ View Portfolio
              </a>
            )}

            {!profile.cv_url && !profile.portfolio_url && (
              <p>No documents uploaded yet.</p>
            )}
          </div>
        </div>

        <div className="dark-card profile-card">
          <div className="profile-divider" />

<h2>Portfolio</h2>

{portfolioProjects.length === 0 ? (

<p>

No portfolio projects uploaded yet.

</p>

) : (

<div className="portfolio-grid">

{portfolioProjects.map((project)=>(

<div
key={project.id}
className="portfolio-card"
>

{project.image_url && (

<img
src={project.image_url}
alt={project.title}
className="portfolio-image"
/>

)}

<h3>{project.title}</h3>

<p>

{project.description}

</p>

<div className="marketplace-badges">

{project.category && (

<span className="marketplace-badge">

{project.category}

</span>

)}

{project.software && (

<span className="verified-badge">

{project.software}

</span>

)}

</div>

{project.project_url && (

<a

href={project.project_url}

target="_blank"

rel="noreferrer"

className="primary-action-link"

>

View Project

</a>

)}

</div>

))}

</div>

)}
          <h2>Client Reviews</h2>

          {reviews.length === 0 ? (
            <EmptyState
              emoji="⭐"
              title="No reviews yet"
              description="Client reviews will appear here once this freelancer receives feedback."
            />
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <p className="review-stars">
                    {"⭐".repeat(review.rating)}
                  </p>

                  <p>{review.comment || "No comment provided."}</p>

                  <small>
                    {new Date(review.created_at).toLocaleDateString("en-ZA")}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}