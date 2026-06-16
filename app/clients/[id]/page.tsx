"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Profile = {
  id: string;
  full_name?: string;
  bio?: string;
};

type ClientReview = {
  id: string;
  rating: number;
  comment?: string;
  created_at?: string;
};

export default function ClientProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientProfile();
  }, [id]);

  const loadClientProfile = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, bio")
      .eq("id", id)
      .eq("role", "client")
      .single();

    const { data: reviewData } = await supabase
      .from("client_reviews")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    setProfile(profileData as Profile);
    setReviews((reviewData as ClientReview[]) || []);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!profile) {
    return (
      <main className="profile-page">
        <EmptyState
          emoji="👤"
          title="Client not found"
          description="This client profile could not be found."
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
        <div className="profile-avatar-placeholder">🏢</div>

        <div className="profile-hero-content">
          <p className="dashboard-badge">Client Profile</p>

          <h1 className="profile-name">
            {profile.full_name || "Client"}
          </h1>

          <div className="profile-rating">
            ⭐ {averageRating} ({reviews.length} reviews)
          </div>
        </div>
      </section>

      <section className="profile-layout">
        <div className="dark-card profile-card">
          <h2>About Client</h2>
          <p>{profile.bio || "No client bio added yet."}</p>
        </div>

        <div className="dark-card profile-card">
          <h2>Client Reviews</h2>

          {reviews.length === 0 ? (
            <EmptyState
              emoji="⭐"
              title="No client reviews yet"
              description="Reviews from freelancers will appear here."
            />
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <p>{"⭐".repeat(review.rating)}</p>
                  <p>{review.comment || "No comment provided."}</p>
                  <small>
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString("en-ZA")
                      : ""}
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