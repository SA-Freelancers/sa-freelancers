"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Profile = {
  id: string;
  full_name?: string;
  role?: string;
  bio?: string;
  category?: string;
  avatar_url?: string;
  cv_url?: string;
  portfolio_url?: string;
  verified?: boolean;
  top_rated?: boolean;
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

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

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

  if (!profile) {
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

          <div className="marketplace-badges">
            {profile.verified && (
              <span className="verified-badge">
                ✔ Verified
              </span>
            )}

            {profile.top_rated && (
              <span className="top-rated-badge">
                ★ Top Rated
              </span>
            )}
          </div>
          <div style={{ marginTop: 20 }}>
  <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
  <a href={`/hire/${profile.id}`} className="primary-action-link">
    Hire Freelancer
  </a>

  <a href={`/freelancers/${profile.id}/report`} className="reject-btn">
    Report User
  </a>
</div>
</div>
<a
  href={`/freelancers/${profile.id}/report`}
  className="reject-btn"
>
  Report User
</a>
          <p className="profile-role">
            {profile.role || "Professional Freelancer"}
          </p>

          <div className="profile-rating">
            ⭐ {averageRating} ({reviews.length} reviews)
          </div>
        </div>
      </section>

      <section className="profile-layout">
        <div className="dark-card profile-card">
          <h2>About</h2>

          <p className="profile-bio">
            {profile.bio || "No bio added yet."}
          </p>

          <div className="profile-divider" />

          <h2>Documents</h2>

          <div className="profile-documents">
            {profile.cv_url && (
              <a href={profile.cv_url} target="_blank" rel="noreferrer">
                View CV
              </a>
            )}

            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer">
                View Portfolio
              </a>
            )}

            {!profile.cv_url && !profile.portfolio_url && (
              <p>No documents uploaded yet.</p>
            )}
          </div>
        </div>

        <div className="dark-card profile-card">
          <h2>Reviews</h2>

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
                    {new Date(review.created_at).toLocaleDateString()}
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