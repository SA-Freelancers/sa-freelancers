"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Favorite = {
  id: string;
  job_id?: string | null;
  freelancer_id?: string | null;

  jobs?: {
    id: string;
    title?: string;
    description?: string;
    budget?: number | string;
    category?: string;
  } | null;

  profiles?: {
    id: string;
    full_name?: string;
    role?: string;
    category?: string;
    bio?: string;
  } | null;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  // =========================================================
  // LOAD FAVORITES
  // =========================================================

  const loadFavorites = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please login first.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select(
        `
        id,
        job_id,
        freelancer_id,

        jobs (
          id,
          title,
          description,
          budget,
          category
        ),

        profiles:profiles!favorites_freelancer_id_fkey (
          id,
          full_name,
          role,
          category,
          bio
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Favorites loading error:",
        error
      );

      setMessage(error.message);
      setLoading(false);
      return;
    }

    setFavorites(
      (data as unknown as Favorite[]) || []
    );

    setLoading(false);
  };

  // =========================================================
  // REMOVE FAVORITE
  // =========================================================

  const removeFavorite = async (
    favoriteId: string
  ) => {
    if (removingId) {
      return;
    }

    setMessage("");
    setRemovingId(favoriteId);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage(
          "Please login first."
        );
        return;
      }

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId)
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Favorite removal error:",
          error
        );

        setMessage(
          error.message
        );

        return;
      }

      setFavorites((current) =>
        current.filter(
          (favorite) =>
            favorite.id !== favoriteId
        )
      );

      setMessage(
        "Removed from favorites."
      );
    } finally {
      setRemovingId(null);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return <LoadingSkeleton />;
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="favorites-page">
      <section className="favorites-hero dark-card">
        <p className="dashboard-badge">
          Saved Items
        </p>

        <h1>Your favorites</h1>

        <p>
          View jobs and freelancers you saved from the marketplace.
        </p>
      </section>

      {message && (
        <p className="search-message">
          {message}
        </p>
      )}

      {favorites.length === 0 ? (
        <EmptyState
          emoji="❤️"
          title="No favorites yet"
          description="Saved jobs and freelancers will appear here."
          buttonText="Browse Marketplace"
          buttonLink="/search"
        />
      ) : (
        <section className="marketplace-grid">
          {favorites.map(
            (favorite) => {
              const job =
                favorite.jobs;

              const freelancer =
                favorite.profiles;

              return (
                <div
                  key={favorite.id}
                  className="dark-card marketplace-card"
                >
                  <span className="marketplace-badge">
                    {job
                      ? "Saved Job"
                      : "Saved Freelancer"}
                  </span>

                  {/* =====================================
                      SAVED JOB
                      ===================================== */}

                  {job && (
                    <>
                      <h3>
                        {job.title ||
                          "Untitled Job"}
                      </h3>

                      <p>
                        {job.description?.slice(
                          0,
                          140
                        ) ||
                          "No description."}
                      </p>

                      <p>
                        <strong>
                          Budget:
                        </strong>{" "}
                        ZAR{" "}
                        {job.budget ||
                          "N/A"}
                      </p>

                      <div
                        className="contract-actions"
                        style={{
                          marginTop: 18,
                        }}
                      >
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="primary-action-link"
                        >
                          View Job
                        </Link>

                        <button
                          type="button"
                          className="reject-btn"
                          disabled={
                            removingId ===
                            favorite.id
                          }
                          onClick={() =>
                            removeFavorite(
                              favorite.id
                            )
                          }
                        >
                          {removingId ===
                          favorite.id
                            ? "Removing..."
                            : "Remove Favorite"}
                        </button>
                      </div>
                    </>
                  )}

                  {/* =====================================
                      SAVED FREELANCER
                      ===================================== */}

                  {freelancer && (
                    <>
                      <h3>
                        {freelancer.full_name ||
                          "Unnamed Freelancer"}
                      </h3>

                      <p>
                        <strong>
                          Role:
                        </strong>{" "}
                        {freelancer.role ||
                          "N/A"}
                      </p>

                      <p>
                        {freelancer.bio?.slice(
                          0,
                          140
                        ) ||
                          "No bio yet."}
                      </p>

                      <div
                        className="contract-actions"
                        style={{
                          marginTop: 18,
                        }}
                      >
                        <Link
                          href={`/freelancers/${freelancer.id}`}
                          className="primary-action-link"
                        >
                          View Profile
                        </Link>

                        <button
                          type="button"
                          className="reject-btn"
                          disabled={
                            removingId ===
                            favorite.id
                          }
                          onClick={() =>
                            removeFavorite(
                              favorite.id
                            )
                          }
                        >
                          {removingId ===
                          favorite.id
                            ? "Removing..."
                            : "Remove Favorite"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            }
          )}
        </section>
      )}
    </main>
  );
}