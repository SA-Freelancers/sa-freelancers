"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { supabase } from "@/app/lib/supabase";

type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function FreelancerPublicProfilePage() {
  const { id } = useParams();

  const [profile, setProfile] =
    useState<any>(null);

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      // PROFILE
      const {
        data: profileData,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // REVIEWS
      const {
        data: reviewData,
      } = await supabase
        .from("reviews")
        .select("*")
        .eq("freelancer_id", id)
        .order("created_at", {
          ascending: false,
        });

      if (reviewData) {
        setReviews(reviewData);
      }

      setLoading(false);
    };

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <p style={{ padding: 20 }}>
        Loading profile...
      </p>
    );
  }

  if (!profile) {
    return <p>Profile not found.</p>;
  }

  // AVERAGE RATING
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) =>
              sum + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : "No ratings";

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "40px auto",
      }}
    >
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 20,
        }}
      >
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="Profile"
            width={140}
            height={140}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: 20,
            }}
          />
        )}

        <h1>{profile.full_name}</h1>

        <p>
          <strong>Role:</strong>{" "}
          {profile.role}
        </p>

        <p>
          <strong>Bio:</strong>
        </p>

        <p>
          {profile.bio ||
            "No bio yet."}
        </p>

        <hr
          style={{
            margin: "25px 0",
          }}
        />

        <h2>Rating</h2>

        <p>
          ⭐ {averageRating} (
          {reviews.length} reviews)
        </p>

        <hr
          style={{
            margin: "25px 0",
          }}
        />

        <h2>
          Portfolio & Documents
        </h2>

        {profile.cv_url && (
          <p>
            <a
              href={profile.cv_url}
              target="_blank"
              rel="noreferrer"
            >
              View CV
            </a>
          </p>
        )}

        {profile.portfolio_url && (
          <p>
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noreferrer"
            >
              View Portfolio
            </a>
          </p>
        )}

        <hr
          style={{
            margin: "25px 0",
          }}
        />

        <h2>Reviews</h2>

        {reviews.length === 0 && (
          <p>No reviews yet.</p>
        )}

        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              border:
                "1px solid #eee",

              padding: 15,

              borderRadius: 8,

              marginBottom: 15,
            }}
          >
            <p>
              {"⭐".repeat(
                review.rating
              )}
            </p>

            <p>{review.comment}</p>

            <small>
              {new Date(
                review.created_at
              ).toLocaleDateString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}