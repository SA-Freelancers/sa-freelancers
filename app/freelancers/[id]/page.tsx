"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function FreelancerPublicProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
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

    setProfile(profileData);
    setReviews(reviewData || []);
    setLoading(false);
  };

  if (loading) return <p>Loading profile...</p>;

  if (!profile) return <p>Profile not found.</p>;

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "No ratings";

  return (
    <main style={{ maxWidth: 1100, margin: "40px auto", padding: 20 }}>
      <section style={hero}>
        <div>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              width={140}
              height={140}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid white",
              }}
            />
          ) : (
            <div style={avatar}>👤</div>
          )}
        </div>

        <div>
          <h1>{profile.full_name || "Freelancer"}</h1>
          <p style={{ fontSize: 18 }}>{profile.role || "Professional Freelancer"}</p>
          <p>⭐ {averageRating} ({reviews.length} reviews)</p>
        </div>
      </section>

      <div style={layout}>
        <section style={card}>
          <h2>About</h2>

          <p>
            <strong>Category:</strong> {profile.category || "N/A"}
          </p>

          <p style={{ color: "#475569", lineHeight: 1.7 }}>
            {profile.bio || "No bio added yet."}
          </p>

          <hr style={{ margin: "25px 0" }} />

          <h2>Documents</h2>

          {profile.cv_url && (
            <p>
              <a href={profile.cv_url} target="_blank" rel="noreferrer">
                View CV
              </a>
            </p>
          )}

          {profile.portfolio_url && (
            <p>
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer">
                View Portfolio
              </a>
            </p>
          )}

          {!profile.cv_url && !profile.portfolio_url && (
            <p>No documents uploaded yet.</p>
          )}
        </section>

        <section style={card}>
          <h2>Reviews</h2>

          {reviews.length === 0 && <p>No reviews yet.</p>}

          {reviews.map((review) => (
            <div key={review.id} style={reviewCard}>
              <p style={{ fontSize: 20 }}>
                {"⭐".repeat(review.rating)}
              </p>

              <p>{review.comment || "No comment provided."}</p>

              <small>
                {new Date(review.created_at).toLocaleDateString()}
              </small>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  color: "white",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
  display: "flex",
  alignItems: "center",
  gap: 25,
  flexWrap: "wrap" as const,
};

const avatar = {
  width: 140,
  height: 140,
  borderRadius: "50%",
  background: "white",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 55,
};

const layout = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 25,
};

const card = {
  background: "white",
  padding: 28,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const reviewCard = {
  background: "#f8fafc",
  padding: 18,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  marginBottom: 15,
};
