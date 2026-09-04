"use client";

import EmptyState from "@/app/components/EmptyState";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import RecommendedJobs from "@/app/components/RecommendedJobs";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Profile = {
  id: string;

  full_name?: string | null;
  role?: string | null;

  headline?: string | null;
  bio?: string | null;
  category?: string | null;

  avatar_url?: string | null;
  cover_image?: string | null;

  location?: string | null;
  country?: string | null;

  availability?: string | null;
  response_time?: string | null;

  years_experience?: number | null;
  hourly_rate?: number | null;

  completed_projects?: number | null;
  repeat_clients?: number | null;
  completion_rate?: number | null;
  rating?: number | null;

  skills?: string[];
  languages?: string[];

  education?: string | null;
  certifications?: string[];

  linkedin_url?: string | null;
  website_url?: string | null;

  cv_url?: string | null;
  portfolio_url?: string | null;

  verified?: boolean | null;
  top_rated?: boolean | null;
  suspended?: boolean | null;
  email_verified?: boolean | null;

  created_at?: string | null;
};

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
};

type PortfolioProject = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  software?: string | null;
  image_url?: string | null;
  project_url?: string | null;
  created_at?: string | null;
  featured?: boolean | null;
};

/*
 * Convert Supabase values into a reliable string array.
 *
 * This handles:
 *
 * ["SolidWorks", "Inventor"]
 *
 * and:
 *
 * "SolidWorks, Inventor"
 *
 * and:
 *
 * '["SolidWorks","Inventor"]'
 */
function normaliseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    /*
     * First try JSON.
     */
    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (item): item is string =>
              typeof item === "string"
          )
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      /*
       * It was not JSON.
       */
    }

    /*
     * Fall back to comma-separated text.
     */
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export default function FreelancerPublicProfilePage() {
  const params = useParams();

  const id = params.id as string;

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [portfolioProjects, setPortfolioProjects] =
    useState<PortfolioProject[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    loadProfile();
  }, [id]);

  async function loadProfile() {
    setLoading(true);
    setErrorMessage("");

    try {
      /*
       * Load freelancer profile.
       */
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .eq("role", "freelancer")
        .single();

      if (profileError) {
        console.error(
          "Profile loading error:",
          profileError
        );

        setProfile(null);
        setErrorMessage(profileError.message);
        setLoading(false);
        return;
      }

      if (!profileData) {
        setProfile(null);
        setLoading(false);
        return;
      }

      /*
       * IMPORTANT:
       *
       * Supabase may return skills/languages/certifications
       * in a format that is not a JavaScript array.
       *
       * Normalize them before putting them into state.
       */
      const normalisedProfile: Profile = {
        ...(profileData as Profile),

        skills: normaliseStringArray(
          profileData.skills
        ),

        languages: normaliseStringArray(
          profileData.languages
        ),

        certifications: normaliseStringArray(
          profileData.certifications
        ),
      };

      /*
       * Load portfolio projects.
       */
      const {
        data: portfolioData,
        error: portfolioError,
      } = await supabase
        .from("portfolio_projects")
        .select("*")
        .eq("freelancer_id", id)
        .order("featured", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (portfolioError) {
        console.error(
          "Portfolio loading error:",
          portfolioError
        );
      }

      /*
       * Load reviews.
       */
      const {
        data: reviewData,
        error: reviewError,
      } = await supabase
        .from("reviews")
        .select("*")
        .eq("freelancer_id", id)
        .order("created_at", {
          ascending: false,
        });

      if (reviewError) {
        console.error(
          "Reviews loading error:",
          reviewError
        );
      }

      setProfile(normalisedProfile);

      setPortfolioProjects(
        (portfolioData as PortfolioProject[]) || []
      );

      setReviews(
        (reviewData as Review[]) || []
      );
    } catch (error) {
      console.error(
        "Unexpected freelancer profile error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load freelancer profile."
      );

      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  /*
   * Freelancer does not exist.
   */
  if (!profile) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">
            Freelancer Profile
          </p>

          <h1>Freelancer Not Found</h1>

          <p>
            This freelancer profile could not be
            found or is no longer available.
          </p>

          {errorMessage && (
            <p className="upload-message">
              {errorMessage}
            </p>
          )}

          <div
            style={{
              marginTop: 20,
            }}
          >
            <Link
              href="/freelancers"
              className="primary-action-link"
            >
              Browse Freelancers
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /*
   * Suspended freelancers should not have a
   * public profile.
   */
  if (profile.suspended) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">
            Freelancer Profile
          </p>

          <h1>Profile Unavailable</h1>

          <p>
            This freelancer profile is currently
            unavailable.
          </p>

          <div
            style={{
              marginTop: 20,
            }}
          >
            <Link
              href="/freelancers"
              className="primary-action-link"
            >
              Browse Freelancers
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /*
   * Calculate average review rating.
   */
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) =>
              sum + Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : "No ratings";

  /*
   * Profile completion.
   *
   * IMPORTANT:
   * These 10 requirements match the freelancer
   * Profile Completion card and Dashboard.
   */
  const profileCompletionChecks = [
    !!profile.full_name?.trim(),

    !!profile.headline?.trim(),

    !!profile.bio?.trim(),

    !!profile.category?.trim(),

    !!profile.avatar_url?.trim(),

    !!profile.cv_url?.trim(),

    !!profile.portfolio_url?.trim(),

    Array.isArray(profile.skills) &&
      profile.skills.length > 0,

    typeof profile.hourly_rate === "number" &&
      Number.isFinite(profile.hourly_rate) &&
      profile.hourly_rate > 0,

    typeof profile.years_experience === "number" &&
      Number.isFinite(profile.years_experience) &&
      profile.years_experience >= 0,
  ];

  const profileCompletionPercentage = Math.round(
    (profileCompletionChecks.filter(Boolean).length /
      profileCompletionChecks.length) *
      100
  );

  const profileStrength =
    profileCompletionPercentage === 100
      ? "Excellent"
      : profileCompletionPercentage >= 70
      ? "Good"
      : "Needs Improvement";

  /*
   * Make sure skills is ALWAYS an array.
   */
  const skills = Array.isArray(profile.skills)
    ? profile.skills
    : [];

  const languages = Array.isArray(
    profile.languages
  )
    ? profile.languages
    : [];

  const certifications = Array.isArray(
    profile.certifications
  )
    ? profile.certifications
    : [];

  return (
    <main className="contracts-page">

      {/* =====================================================
          PROFILE HERO
      ===================================================== */}

      <section
        className="dark-card profile-hero"
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >

        {profile.cover_image && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.25,
              backgroundImage: `url(${profile.cover_image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            gap: 25,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >

          {/* Avatar */}

          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={
                profile.full_name ||
                "Freelancer profile"
              }
              className="profile-avatar"
            />
          ) : (
            <div
              className="profile-avatar"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 60,
              }}
            >
              👤
            </div>
          )}

          {/* Main profile information */}

          <div className="profile-hero-content">

            <p className="dashboard-badge">
              {profile.category ||
                "Professional Freelancer"}
            </p>

            <h1 className="profile-name">
              {profile.full_name ||
                "Freelancer"}
            </h1>

            <p className="profile-role">
              {profile.headline ||
                `South African ${
                  profile.category ||
                  "Freelancer"
                }`}
            </p>

            {/* Badges */}

            <div className="marketplace-badges">

              {profile.email_verified && (
                <span className="verified-badge">
                  ✔ Email Verified
                </span>
              )}

              {profile.verified && (
                <span className="verified-badge">
                  ✔ Verified
                </span>
              )}

              <span className="verified-badge">
                💪 Profile Strength:{" "}
                {profileStrength} (
                {profileCompletionPercentage}%)
              </span>

              {profile.top_rated && (
                <span className="top-rated-badge">
                  ★ Top Rated
                </span>
              )}

            </div>

            {/* Location / availability */}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 15,
              }}
            >

              {profile.location && (
                <span>
                  📍 {profile.location}
                </span>
              )}

              {profile.country && (
                <span>
                  🌍 {profile.country}
                </span>
              )}

              {profile.availability && (
                <span>
                  🟢 {profile.availability}
                </span>
              )}

              {profile.response_time && (
                <span>
                  ⚡ {profile.response_time}
                </span>
              )}

            </div>

            {/* Actions */}

            <div
              style={{
                marginTop: 20,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >

              <Link
                href={`/hire/${profile.id}`}
                className="primary-action-link"
              >
                Hire Freelancer
              </Link>

              <Link
                href={`/freelancers/${profile.id}/report`}
                className="reject-btn"
              >
                Report User
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          PROFILE LAYOUT
      ===================================================== */}

      <section className="profile-layout">

        {/* ===================================================
            LEFT COLUMN
        =================================================== */}

        <div>

          {/* Professional Summary */}

          <div className="dark-card profile-card">

            <h2>
              Professional Summary
            </h2>

            <p className="profile-bio">
              {profile.bio ||
                "This freelancer has not added a bio yet."}
            </p>

            <div className="profile-divider" />

            <h2>
              Professional Details
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 15,
                marginTop: 15,
              }}
            >

              <div>
                <strong>
                  Experience
                </strong>

                <p>
                  {profile.years_experience ??
                    "Not specified"}

                  {profile.years_experience !==
                    null &&
                  profile.years_experience !==
                    undefined
                    ? " years"
                    : ""}
                </p>
              </div>

              <div>
                <strong>
                  Hourly Rate
                </strong>

                <p>
                  {profile.hourly_rate
                    ? `ZAR ${profile.hourly_rate}/hr`
                    : "Not specified"}
                </p>
              </div>

              <div>
                <strong>
                  Completed Projects
                </strong>

                <p>
                  {profile.completed_projects ??
                    0}
                </p>
              </div>

              <div>
                <strong>
                  Repeat Clients
                </strong>

                <p>
                  {profile.repeat_clients ??
                    0}
                </p>
              </div>

              <div>
                <strong>
                  Completion Rate
                </strong>

                <p>
                  {profile.completion_rate != null
                    ? `${profile.completion_rate}%`
                    : "Not specified"}
                </p>
              </div>

              <div>
                <strong>
                  Rating
                </strong>

                <p>
                  {averageRating === "No ratings"
                    ? "No ratings"
                    : `${averageRating} / 5`}
                </p>
              </div>

            </div>

          </div>

          {/* Skills */}

          <div
            className="dark-card profile-card"
            style={{
              marginTop: 20,
            }}
          >

            <h2>
              Skills
            </h2>

            {skills.length === 0 ? (
              <p>
                No skills have been added yet.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 15,
                }}
              >

                {skills.map(
                  (skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="verified-badge"
                    >
                      {skill}
                    </span>
                  )
                )}

              </div>
            )}

          </div>

          {/* Languages */}

          <div
            className="dark-card profile-card"
            style={{
              marginTop: 20,
            }}
          >

            <h2>
              Languages
            </h2>

            {languages.length === 0 ? (
              <p>
                No languages added yet.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 15,
                }}
              >

                {languages.map(
                  (language, index) => (
                    <span
                      key={`${language}-${index}`}
                      className="verified-badge"
                    >
                      {language}
                    </span>
                  )
                )}

              </div>
            )}

          </div>

          {/* Education */}

          <div
            className="dark-card profile-card"
            style={{
              marginTop: 20,
            }}
          >

            <h2>
              Education
            </h2>

            <p>
              {profile.education ||
                "No education information added yet."}
            </p>

          </div>

          {/* Certifications */}

          <div
            className="dark-card profile-card"
            style={{
              marginTop: 20,
            }}
          >

            <h2>
              Certifications
            </h2>

            {certifications.length === 0 ? (
              <p>
                No certifications added yet.
              </p>
            ) : (
              <ul>
                {certifications.map(
                  (
                    certification,
                    index
                  ) => (
                    <li
                      key={`${certification}-${index}`}
                    >
                      {certification}
                    </li>
                  )
                )}
              </ul>
            )}

          </div>

          {/* Documents */}

          <div
            className="dark-card profile-card"
            style={{
              marginTop: 20,
            }}
          >

            <h2>
              Documents & Portfolio
            </h2>

            <div className="profile-documents">

              {profile.cv_url && (
                <a
                  href={profile.cv_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  📄 View CV
                </a>
              )}

              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  🖼️ View Portfolio
                </a>
              )}

              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  💼 LinkedIn
                </a>
              )}

              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  🌐 Website
                </a>
              )}

              {!profile.cv_url &&
                !profile.portfolio_url &&
                !profile.linkedin_url &&
                !profile.website_url && (
                  <p>
                    No documents or external
                    links uploaded yet.
                  </p>
                )}

            </div>

          </div>

        </div>

        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}

        <div>

          {/* Portfolio */}

          <div className="dark-card profile-card">

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: 15,
                flexWrap: "wrap",
              }}
            >

              <h2>
                Portfolio
              </h2>

              <span className="dashboard-badge">
                {portfolioProjects.length}{" "}
                projects
              </span>

            </div>

            <div
              className="profile-divider"
            />

            {portfolioProjects.length ===
            0 ? (
              <p>
                No portfolio projects uploaded
                yet.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 20,
                }}
              >

                {portfolioProjects.map(
                  (project) => (
                    <article
                      key={project.id}
                      className="dark-card"
                      style={{
                        overflow: "hidden",
                      }}
                    >

                      {/* Project image */}

                      {project.image_url ? (
                        <img
                          src={
                            project.image_url
                          }
                          alt={
                            project.title
                          }
                          style={{
                            width: "100%",
                            height: 180,
                            objectFit:
                              "cover",
                            display:
                              "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: 180,
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontSize: 45,
                          }}
                        >
                          📁
                        </div>
                      )}

                      <div
                        style={{
                          padding: 18,
                        }}
                      >

                        {project.featured && (
                          <span className="top-rated-badge">
                            ★ Featured
                          </span>
                        )}

                        <h3
                          style={{
                            marginTop: 10,
                          }}
                        >
                          {project.title}
                        </h3>

                        {project.category && (
                          <p>
                            <strong>
                              Category:
                            </strong>{" "}
                            {
                              project.category
                            }
                          </p>
                        )}

                        {project.software && (
                          <p>
                            <strong>
                              Software:
                            </strong>{" "}
                            {
                              project.software
                            }
                          </p>
                        )}

                        {project.description && (
                          <p
                            className="profile-bio"
                          >
                            {
                              project.description
                            }
                          </p>
                        )}

                        {project.project_url && (
                          <div
                            style={{
                              marginTop: 15,
                            }}
                          >
                            <a
                              href={
                                project.project_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="primary-action-link"
                            >
                              View Project
                            </a>
                          </div>
                        )}

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

          </div>

          {/* Reviews */}

          <div
            className="dark-card profile-card"
            style={{
              marginTop: 20,
            }}
          >

            <h2>
              Client Reviews
            </h2>

            <div
              className="profile-divider"
            />

            {reviews.length === 0 ? (
              <EmptyState
                emoji="⭐"
                title="No reviews yet"
                description="Client reviews will appear here once this freelancer receives feedback."
              />
            ) : (
              <div className="reviews-list">

                {reviews.map(
                  (review) => (
                    <div
                      key={review.id}
                      className="review-card"
                    >

                      <p className="review-stars">
                        {"⭐".repeat(
                          Math.max(
                            0,
                            Math.min(
                              5,
                              Number(
                                review.rating ||
                                  0
                              )
                            )
                          )
                        )}
                      </p>

                      <p>
                        {review.comment ||
                          "No comment provided."}
                      </p>

                      <small>
                        {new Date(
                          review.created_at
                        ).toLocaleDateString(
                          "en-ZA"
                        )}
                      </small>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          RECOMMENDED JOBS
      ===================================================== */}

      <section
        className="dark-card profile-card"
        style={{
          marginTop: 25,
        }}
      >

        <h2>
          Recommended Jobs
        </h2>

        <p>
          Jobs that may match this
          freelancer&apos;s skills and category.
        </p>

        <RecommendedJobs />

      </section>

    </main>
  );
}