"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "@/app/lib/supabase";


type Review = {
  rating: number;
};


type Freelancer = {
  id: string;

  full_name?: string | null;
  headline?: string | null;
  category?: string | null;
  bio?: string | null;
  avatar_url?: string | null;

  verified?: boolean | null;
  verification_status?:
    | "not_submitted"
    | "pending"
    | "verified"
    | "rejected"
    | null;

  top_rated?: boolean | null;
  email_verified?: boolean | null;

  city?: string | null;
  province?: string | null;
  country?: string | null;

  hourly_rate?: number | null;

  skills?:
    | string[]
    | string
    | null;

  reviews?: Review[];
};


/* =========================================================
   HELPERS
   ========================================================= */

function getInitials(
  name?: string | null
) {

  if (!name?.trim()) {
    return "FH";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}


function normaliseSkills(
  value:
    | string[]
    | string
    | null
    | undefined
): string[] {

  if (
    Array.isArray(
      value
    )
  ) {

    return value
      .filter(
        (
          item
        ): item is string =>
          typeof item ===
            "string" &&
          item
            .trim()
            .length >
            0
      )
      .map(
        (item) =>
          item.trim()
      );

  }

  if (
    typeof value ===
    "string"
  ) {

    const trimmed =
      value.trim();

    if (!trimmed) {
      return [];
    }

    try {

      const parsed:
        unknown =
          JSON.parse(
            trimmed
          );

      if (
        Array.isArray(
          parsed
        )
      ) {

        return parsed
          .filter(
            (
              item
            ): item is string =>
              typeof item ===
                "string" &&
              item
                .trim()
                .length >
                0
          )
          .map(
            (item) =>
              item.trim()
          );

      }

    } catch {
      // Not JSON, so continue as comma-separated text.
    }

    return trimmed
      .split(",")
      .map(
        (item) =>
          item.trim()
      )
      .filter(
        Boolean
      );

  }

  return [];
}


function getLocation(
  freelancer:
    Freelancer
) {

  const parts = [
    freelancer.city,
    freelancer.province,
    freelancer.country,
  ].filter(
    (
      value
    ): value is string =>
      typeof value ===
        "string" &&
      value
        .trim()
        .length >
        0
  );

  if (
    parts.length === 0
  ) {

    return "South Africa";

  }

  return parts.join(", ");
}


/* =========================================================
   COMPONENT
   ========================================================= */

export default function FeaturedFreelancers() {

  const [
    freelancers,
    setFreelancers,
  ] =
    useState<
      Freelancer[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  /* =========================================================
     LOAD FREELANCERS
     ========================================================= */

  useEffect(() => {

    const loadFreelancers =
      async () => {

        try {

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                `
                *,
                reviews!reviews_freelancer_id_fkey (
    rating
                )
              `
              )
              .eq(
                "role",
                "freelancer"
              )
              .eq(
                "suspended",
                false
              )
              .order(
                "top_rated",
                {
                  ascending:
                    false,
                }
              )
              .limit(6);


          if (error) {

            console.error(
              "Featured freelancers loading error:",
              error
            );

            return;

          }


          setFreelancers(
            (
              data as
                Freelancer[]
            ) || []
          );

        } catch (
          error
        ) {

          console.error(
            "Featured freelancers unexpected error:",
            error
          );

        } finally {

          setLoading(
            false
          );

        }

      };


    void loadFreelancers();

  }, []);


  /* =========================================================
     AVERAGE RATING
     ========================================================= */

  const getAverageRating =
    (
      reviews?: Review[]
    ) => {

      if (
        !reviews ||
        reviews.length ===
          0
      ) {

        return null;

      }

      const total =
        reviews.reduce(
          (
            sum,
            review
          ) =>
            sum +
            Number(
              review.rating ||
                0
            ),
          0
        );

      return (
        total /
        reviews.length
      ).toFixed(1);

    };


  if (
    loading
  ) {

    return null;

  }


  if (
    freelancers.length ===
    0
  ) {

    return null;

  }


  /* =========================================================
     PAGE
     ========================================================= */

  return (

    <section className="home-section featured-freelancers-section">


      {/* HEADER */}

      <div className="home-section-header">

        <p className="dashboard-badge">
          Featured Freelancers
        </p>

        <h2>
          Hire skilled South
          African talent
        </h2>

        <p className="featured-freelancers-subtitle">

          Discover professionals
          ready to help bring your
          next project to life.

        </p>

      </div>


      {/* GRID */}

      <div className="featured-freelancers-grid">

        {freelancers.map(
          (
            freelancer
          ) => {

            const rating =
              getAverageRating(
                freelancer.reviews
              );

            const skills =
              normaliseSkills(
                freelancer.skills
              ).slice(
                0,
                3
              );

            const isVerified =
              freelancer
                .verification_status ===
                "verified" ||
              freelancer
                .verified ===
                true;

            const location =
              getLocation(
                freelancer
              );


            return (

              <article
                key={
                  freelancer.id
                }
                className="featured-freelancer-card"
              >


                {/* TOP */}

                <div className="featured-freelancer-top">


                  {/* AVATAR */}

                  <div className="featured-freelancer-avatar-wrap">

                    {freelancer.avatar_url ? (

                      <img
                        src={
                          freelancer.avatar_url
                        }
                        alt={
                          freelancer.full_name ||
                          "Freelancer"
                        }
                        className="featured-freelancer-avatar"
                      />

                    ) : (

                      <div className="featured-freelancer-avatar featured-freelancer-avatar-fallback">

                        {getInitials(
                          freelancer.full_name
                        )}

                      </div>

                    )}


                    {isVerified && (

                      <span
                        className="featured-freelancer-verified-icon"
                        title="Identity Verified"
                      >
                        ✓
                      </span>

                    )}

                  </div>


                  {/* RATE */}

                  {typeof freelancer.hourly_rate ===
                    "number" &&
                    freelancer.hourly_rate >
                      0 && (

                      <div className="featured-freelancer-rate">

                        <strong>
                          R
                          {
                            freelancer.hourly_rate
                          }
                        </strong>

                        <span>
                          /hr
                        </span>

                      </div>

                    )}

                </div>


                {/* IDENTITY */}

                <div className="featured-freelancer-identity">

                  <h3>

                    {
                      freelancer.full_name ||
                      "Freelancer"
                    }

                  </h3>


                  <p className="featured-freelancer-headline">

                    {
                      freelancer.headline ||
                      freelancer.category ||
                      "Professional Freelancer"
                    }

                  </p>


                  <p className="featured-freelancer-location">

                    📍 {location}

                  </p>

                </div>


                {/* RATING */}

                <div className="featured-freelancer-rating-row">

                  {rating ? (

                    <>

                      <span className="featured-freelancer-stars">
                        ★
                      </span>

                      <strong>
                        {rating}
                      </strong>

                      <span>

                        (
                        {
                          freelancer.reviews
                            ?.length ||
                          0
                        }{" "}
                        {
                          freelancer.reviews
                            ?.length ===
                          1
                            ? "review"
                            : "reviews"
                        }
                        )

                      </span>

                    </>

                  ) : (

                    <span className="featured-freelancer-no-rating">

                      New freelancer

                    </span>

                  )}

                </div>


                {/* BIO */}

                <p className="featured-freelancer-bio">

                  {
                    freelancer.bio
                      ?.trim()
                      .slice(
                        0,
                        125
                      ) ||
                    "Professional freelancer ready to help with your next project."
                  }

                  {freelancer.bio &&
                    freelancer.bio
                      .trim()
                      .length >
                      125 &&
                    "..."}

                </p>


                {/* SKILLS */}

                {skills.length >
                  0 && (

                  <div className="featured-freelancer-skills">

                    {skills.map(
                      (
                        skill
                      ) => (

                        <span
                          key={
                            skill
                          }
                        >
                          {skill}
                        </span>

                      )
                    )}

                  </div>

                )}


                {/* BADGES */}

                <div className="featured-freelancer-badges">

                  {isVerified && (

                    <span className="featured-badge verified">

                      ✓ Identity Verified

                    </span>

                  )}


                  {freelancer.email_verified && (

                    <span className="featured-badge email">

                      ✓ Email Verified

                    </span>

                  )}


                  {freelancer.top_rated && (

                    <span className="featured-badge top-rated">

                      ★ Top Rated

                    </span>

                  )}

                </div>


                {/* ACTION */}

                <Link
                  href={`/freelancers/${freelancer.id}`}
                  className="featured-freelancer-button"
                >

                  View Profile

                  <span>
                    →
                  </span>

                </Link>


              </article>

            );

          }
        )}

      </div>


      {/* VIEW MORE */}

      <div className="featured-freelancers-footer">

        <Link
          href="/search"
          className="featured-view-all"
        >

          Browse All Freelancers

          <span>
            →
          </span>

        </Link>

      </div>


    </section>

  );

}