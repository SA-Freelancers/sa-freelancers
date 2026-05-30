"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Favorite = {
  id: string;
  job_id?: string;
  freelancer_id?: string;
  jobs?: {
    id: string;
    title?: string;
    description?: string;
    budget?: number | string;
    category?: string;
  };
  profiles?: {
    id: string;
    full_name?: string;
    role?: string;
    category?: string;
    bio?: string;
  };
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
        profiles (
          id,
          full_name,
          role,
          category,
          bio
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

setFavorites((data as unknown as Favorite[]) || []);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="favorites-page">
      <section className="favorites-hero dark-card">
        <p className="dashboard-badge">Saved Items</p>

        <h1>Your favorites</h1>

        <p>
          View jobs and freelancers you saved from the marketplace.
        </p>
      </section>

      {message && <p className="search-message">{message}</p>}

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
          {favorites.map((favorite) => {
            const job = favorite.jobs;
            const freelancer = favorite.profiles;

            return (
              <div key={favorite.id} className="dark-card marketplace-card">
                <span className="marketplace-badge">
                  {job ? "Saved Job" : "Saved Freelancer"}
                </span>

                {job && (
                  <>
                    <h3>{job.title || "Untitled Job"}</h3>
                    <p>{job.description?.slice(0, 140) || "No description."}</p>
                    <p>
                      <strong>Budget:</strong> ZAR {job.budget || "N/A"}
                    </p>

                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="primary-action-link"
                    >
                      View Job
                    </Link>
                  </>
                )}

                {freelancer && (
                  <>
                    <h3>{freelancer.full_name || "Unnamed Freelancer"}</h3>
                    <p>
                      <strong>Role:</strong> {freelancer.role || "N/A"}
                    </p>
                    <p>{freelancer.bio?.slice(0, 140) || "No bio yet."}</p>

                    <Link
                      href={`/freelancers/${freelancer.id}`}
                      className="primary-action-link"
                    >
                      View Profile
                    </Link>
                  </>
                )}
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}