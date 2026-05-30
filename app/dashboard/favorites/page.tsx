"use client";

import EmptyState from "@/app/components/EmptyState";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("favorites")
      .select(`
        id,
        freelancer_id,
        job_id,
        profiles:freelancer_id (
          full_name,
          role,
          category
        ),
        jobs:job_id (
          title,
          category,
          budget
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setFavorites(data || []);
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from("favorites").delete().eq("id", favoriteId);

    setFavorites((prev) =>
      prev.filter((fav) => fav.id !== favoriteId)
    );
  };

  if (loading) return <p>Loading favorites...</p>;

  return (
    <div>
      <section className="hero-section" style={hero}>
        <h1>Favorites</h1>
        <p>View and manage saved freelancers and jobs.</p>
      </section>

      {favorites.length === 0 && (
  <EmptyState
    emoji="❤️"
    title="No favorites yet"
    description="Save freelancers and jobs from the search page."
    buttonText="Search Marketplace"
    buttonLink="/search"
  />
)}

      <div style={grid}>
        {favorites.map((fav) => (
          <div key={fav.id} className="dark-card" style={card}>
            {fav.freelancer_id && (
              <>
                <span style={badge}>Freelancer</span>

                <h3>{fav.profiles?.full_name || "Freelancer"}</h3>

                <p>
                  <strong>Role:</strong> {fav.profiles?.role || "N/A"}
                </p>

                <p>
                  <strong>Category:</strong> {fav.profiles?.category || "N/A"}
                </p>

                <Link href={`/freelancers/${fav.freelancer_id}`} style={blueBtn}>
                  View Freelancer
                </Link>
              </>
            )}

            {fav.job_id && (
              <>
                <span style={badge}>Job</span>

                <h3>{fav.jobs?.title || "Job"}</h3>

                <p>
                  <strong>Category:</strong> {fav.jobs?.category || "N/A"}
                </p>

                <p>
                  <strong>Budget:</strong> ZAR {fav.jobs?.budget || "N/A"}
                </p>

                <Link href={`/dashboard/jobs/${fav.job_id}`} style={blueBtn}>
                  View Job
                </Link>
              </>
            )}

            <button onClick={() => removeFavorite(fav.id)} style={redBtn}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 22,
};

const card = {
  padding: 24,
  borderRadius: 18,
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const emptyCard = {
  padding: 30,
  borderRadius: 18,
};

const badge = {
  display: "inline-block",
  background: "#dbeafe",
  color: "#1d4ed8",
  padding: "6px 10px",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: "bold",
};

const blueBtn = {
  display: "inline-block",
  marginTop: 15,
  marginRight: 10,
  padding: "10px 14px",
  background: "#2563eb",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
};

const redBtn = {
  marginTop: 15,
  padding: "10px 14px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
};