"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "@/app/lib/supabase";

import {
  calculateProfileCompleteness,
  type ProfileCompletenessProfile,
} from "@/app/lib/profileCompleteness";


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

  top_rated?: boolean | null;
  email_verified?: boolean | null;

  city?: string | null;
  province?: string | null;
  country?: string | null;
  location?: string | null;

  years_experience?: number | null;
  hourly_rate?: number | null;

  skills?:
    | string[]
    | string
    | null;

  education?: string | null;

  certifications?:
    | string[]
    | string
    | null;

  cv_url?: string | null;
  portfolio_url?: string | null;

  suspended?: boolean | null;
  is_demo?: boolean | null;

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
      // Not JSON.
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
  freelancer: Freelancer
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
    if (
      freelancer.location
        ?.trim()
    ) {
      return freelancer.location
        .trim();
    }

    return "South Africa";
  }

  return parts.join(", ");
}


/* =========================================================
   DAILY HASH
   ========================================================= */

function createDailyHash(
  dateKey: string,
  freelancerId: string
) {
  const value =
    `${dateKey}-${freelancerId}`;

  let hash =
    2166136261;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^=
      value.charCodeAt(
        index
      );

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return hash >>> 0;
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
     DAILY FEATURED FREELANCERS

     Eligibility:
     - Real freelancer accounts
     - Not suspended
     - Not demo accounts
     - Strong public profile
     - Profile image may be:
         1. Uploaded personal picture
         2. Built-in Freelance Hub SA avatar
     - Portfolio project counts as portfolio
     - Same six freelancers during one SA calendar day
     - New deterministic selection the following day
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadFreelancers =
      async () => {
        try {
          /* ===============================================
             LOAD FREELANCERS
             =============================================== */

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
              .eq(
                "is_demo",
                false
              );

          if (error) {
            console.error(
              "Featured freelancers loading error:",
              error
            );

            return;
          }


          const allFreelancers =
            (
              (data as Freelancer[]) ||
              []
            );


          if (
            allFreelancers.length ===
            0
          ) {
            if (mounted) {
              setFreelancers(
                []
              );
            }

            return;
          }


          /* ===============================================
             LOAD PORTFOLIO PROJECTS

             A freelancer may satisfy the portfolio
             requirement either through portfolio_url
             or through portfolio_projects.
             =============================================== */

          const freelancerIds =
            allFreelancers.map(
              (freelancer) =>
                freelancer.id
            );


          const {
            data:
              portfolioRows,
            error:
              portfolioError,
          } =
            await supabase
              .from(
                "portfolio_projects"
              )
              .select(
                "freelancer_id"
              )
              .in(
                "freelancer_id",
                freelancerIds
              );


          if (
            portfolioError
          ) {
            console.error(
              "Featured freelancer portfolio loading error:",
              portfolioError
            );

            return;
          }


          const freelancersWithProjects =
            new Set<string>();


          for (
            const project of
              portfolioRows || []
          ) {
            if (
              project.freelancer_id
            ) {
              freelancersWithProjects.add(
                project.freelancer_id
              );
            }
          }


          /* ===============================================
             FEATURED PROFILE ELIGIBILITY

             IMPORTANT:
             avatar_url can contain either:

             - Supabase uploaded image URL
             - /avatars/avatar-XX.png

             Both count as a valid profile image.
             No identity-document verification is required.
             =============================================== */

          const eligibleFreelancers =
            allFreelancers.filter(
              (freelancer) => {
                const result =
                  calculateProfileCompleteness({
                    ...(freelancer as ProfileCompletenessProfile),

                    portfolio_project_exists:
                      freelancersWithProjects.has(
                        freelancer.id
                      ),
                  });


                /*
                 * CV, education and certifications
                 * continue to count toward the full
                 * profile-completion score.
                 *
                 * They are not required for homepage
                 * Featured Freelancer eligibility.
                 *
                 * Identity verification is also NOT
                 * required.
                 */

                return (
                  result.checks.fullName &&
                  result.checks.photo &&
                  result.checks.headline &&
                  result.checks.bio &&
                  result.checks.category &&
                  result.checks.location &&
                  result.checks.experience &&
                  result.checks.hourlyRate &&
                  result.checks.skills &&
                  result.checks.portfolio
                );
              }
            );


          /* ===============================================
             DAILY DATE KEY

             Use South African calendar date rather
             than randomising on every refresh.
             =============================================== */

          const saDate =
            new Intl.DateTimeFormat(
              "en-CA",
              {
                timeZone:
                  "Africa/Johannesburg",

                year:
                  "numeric",

                month:
                  "2-digit",

                day:
                  "2-digit",
              }
            ).format(
              new Date()
            );


          /* ===============================================
             DAILY ROTATION

             Everyone sees the same deterministic
             selection for the current SA date.
             =============================================== */

          const dailyFreelancers =
            [
              ...eligibleFreelancers,
            ]
              .sort(
                (
                  freelancerA,
                  freelancerB
                ) =>
                  createDailyHash(
                    saDate,
                    freelancerA.id
                  ) -
                  createDailyHash(
                    saDate,
                    freelancerB.id
                  )
              )
              .slice(
                0,
                6
              );


          if (mounted) {
            setFreelancers(
              dailyFreelancers
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Featured freelancers unexpected error:",
            error
          );
        } finally {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      };


    void loadFreelancers();


    return () => {
      mounted = false;
    };
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

                  {/* PROFILE IMAGE */}

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
          href="/freelancers"
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