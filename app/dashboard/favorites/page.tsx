"use client";

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

    const { data, error } = await supabase
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

    if (!error && data) {
      setFavorites(data);
    }

    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from("favorites").delete().eq("id", favoriteId);
    setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId));
  };

  if (loading) return <p>Loading favorites...</p>;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <h1>My Favorites</h1>

      {favorites.length === 0 && <p>No favorites saved yet.</p>}

      {favorites.map((fav) => (
        <div
          key={fav.id}
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 10,
            marginBottom: 15,
            border: "1px solid #ddd",
          }}
        >
          {fav.freelancer_id && (
            <>
              <h3>{fav.profiles?.full_name}</h3>
              <p>{fav.profiles?.role}</p>
              <p>{fav.profiles?.category}</p>

              <Link href={`/freelancers/${fav.freelancer_id}`}>
                View Freelancer
              </Link>
            </>
          )}

          {fav.job_id && (
            <>
              <h3>{fav.jobs?.title}</h3>
              <p>{fav.jobs?.category}</p>
              <p>ZAR {fav.jobs?.budget}</p>

              <Link href={`/dashboard/jobs/${fav.job_id}`}>
                View Job
              </Link>
            </>
          )}

          <br />

          <button
            onClick={() => removeFavorite(fav.id)}
            style={{
              marginTop: 12,
              padding: "8px 12px",
              backgroundColor: "red",
              color: "white",
              border: "none",
              borderRadius: 6,
            }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}