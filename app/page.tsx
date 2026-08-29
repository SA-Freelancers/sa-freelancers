"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import LatestJobs from "@/app/components/LatestJobs";
import FeaturedFreelancers from "@/app/components/FeaturedFreelancers";
import PlatformStats from "@/app/components/PlatformStats";
import MarketplaceActivity from "@/app/components/MarketplaceActivity";
import TrendingCategories from "@/app/components/TrendingCategories";

import {
  supabase,
} from "@/app/lib/supabase";

const services = [
  "Web Development",
  "Graphic Design",
  "Writing",
  "Marketing",
  "Video Editing",
  "Engineering",
];

export default function HomePage() {
  const [
    userRole,
    setUserRole,
  ] = useState("");

  const [
    loggedIn,
    setLoggedIn,
  ] = useState(false);

  const [
    authReady,
    setAuthReady,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUserRole =
      async () => {
        try {
          const {
            data:
              sessionData,
            error:
              sessionError,
          } =
            await supabase.auth.getSession();

          if (
            sessionError
          ) {
            console.error(
              "Homepage session error:",
              sessionError
            );
          }

          const user =
            sessionData
              .session
              ?.user;

          if (!user) {
            if (
              mounted
            ) {
              setLoggedIn(
                false
              );

              setUserRole(
                ""
              );
            }

            return;
          }

          if (
            mounted
          ) {
            setLoggedIn(
              true
            );
          }

          const {
            data:
              profile,
            error:
              profileError,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                "role"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            console.error(
              "Homepage profile error:",
              profileError
            );
          }

          if (
            mounted
          ) {
            setUserRole(
              profile
                ?.role ||
                ""
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Homepage authentication loading error:",
            error
          );

          if (
            mounted
          ) {
            setLoggedIn(
              false
            );

            setUserRole(
              ""
            );
          }
        } finally {
          if (
            mounted
          ) {
            setAuthReady(
              true
            );
          }
        }
      };

    void loadUserRole();

    const {
      data:
        authListener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session
        ) => {
          if (
            !mounted
          ) {
            return;
          }

          const user =
            session?.user;

          if (!user) {
            setLoggedIn(
              false
            );

            setUserRole(
              ""
            );

            setAuthReady(
              true
            );

            return;
          }

          setLoggedIn(
            true
          );

          try {
            const {
              data:
                profile,
            } =
              await supabase
                .from(
                  "profiles"
                )
                .select(
                  "role"
                )
                .eq(
                  "id",
                  user.id
                )
                .maybeSingle();

            if (
              mounted
            ) {
              setUserRole(
                profile
                  ?.role ||
                  ""
              );
            }
          } catch (
            error
          ) {
            console.error(
              "Homepage role refresh error:",
              error
            );
          } finally {
            if (
              mounted
            ) {
              setAuthReady(
                true
              );
            }
          }
        }
      );

    return () => {
      mounted = false;

      authListener
        .subscription
        .unsubscribe();
    };
  }, []);

  const renderHeroButtons =
    () => {
      if (
        !authReady
      ) {
        return (
          <div
            className="home-auth-placeholder"
            aria-hidden="true"
          >
            Loading...
          </div>
        );
      }

      if (
        !loggedIn
      ) {
        return (
          <>
            <Link
              href="/register"
              className="home-primary-btn"
            >
              Hire Freelancers
            </Link>

            <Link
              href="/search"
              className="home-secondary-btn"
            >
              Find Work
            </Link>
          </>
        );
      }

      if (
        userRole ===
        "client"
      ) {
        return (
          <>
            <Link
              href="/dashboard/post-job"
              className="home-primary-btn"
            >
              Post Job
            </Link>

            <Link
              href="/dashboard/jobs"
              className="home-secondary-btn"
            >
              My Jobs
            </Link>
          </>
        );
      }

      if (
        userRole ===
        "freelancer"
      ) {
        return (
          <>
            <Link
              href="/search"
              className="home-primary-btn"
            >
              Marketplace
            </Link>

            <Link
              href="/dashboard/contracts"
              className="home-secondary-btn"
            >
              Contracts
            </Link>
          </>
        );
      }

      return (
        <Link
          href="/dashboard"
          className="home-primary-btn"
        >
          Dashboard
        </Link>
      );
    };

  return (
    <main className="home-page">
      {/* ==================================================
          HERO
      ================================================== */}

      <section className="home-hero">
        <div className="home-hero-content">
          <p className="dashboard-badge">
            Freelance Hub SA
          </p>

          <h1>
            South Africa&apos;s
            trusted freelance
            marketplace
            <span>
              {" "}
              for skilled
              work.
            </span>
          </h1>

          <p>
            Hire skilled
            freelancers,
            find quality
            projects,
            manage
            contracts,
            build reviews
            and work
            safely on one
            South African
            platform.
          </p>

          <div className="home-actions">
            {renderHeroButtons()}
          </div>

          <div
            className="home-feature-badges"
            style={{
              display:
                "flex",

              gap: 12,

              flexWrap:
                "wrap",

              justifyContent:
                "center",

              marginTop:
                22,

              width:
                "100%",
            }}
          >
            <span className="hero-feature-badge">
              ✓ Secure
              Contracts
            </span>

            <span className="hero-feature-badge">
              ✓ Verified
              Profiles
            </span>

            <span className="hero-feature-badge">
              ★ Trusted
              Reviews
            </span>

            <span className="hero-feature-badge">
              🇿🇦 South
              African Talent
            </span>
          </div>
        </div>
      </section>

      {/* ==================================================
          PLATFORM STATS
      ================================================== */}

      <PlatformStats />

      {/* ==================================================
          WHY FREELANCE HUB SA
      ================================================== */}

      <section
        className="dark-card home-benefits-section"
      >
        <h2>
          Why Freelance
          Hub SA?
        </h2>

        <div className="home-benefits-grid">
          <div>
            <h3>
              ✔ Verified
              Profiles
            </h3>

            <p>
              Build trust
              through
              professional
              freelancer
              accounts.
            </p>
          </div>

          <div>
            <h3>
              🔒 Secure
              Platform
            </h3>

            <p>
              Keep
              communication,
              contracts and
              reviews inside
              the platform.
            </p>
          </div>

          <div>
            <h3>
              ⭐ Reviews &
              Ratings
            </h3>

            <p>
              Transparent
              feedback from
              clients and
              freelancers.
            </p>
          </div>

          <div>
            <h3>
              🇿🇦 South
              African Focus
            </h3>

            <p>
              Built for
              local
              businesses,
              freelancers
              and
              opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          HOW IT WORKS
      ================================================== */}

      <section className="home-section">
        <div className="home-section-header">
          <p className="dashboard-badge">
            How It Works
          </p>

          <h2>
            Simple steps
            to get work
            done
          </h2>
        </div>

        <div className="home-grid">
          <div className="dark-card home-card">
            <h3>
              1. Post a Job
            </h3>

            <p>
              Create a
              project with
              your budget,
              category and
              full details.
            </p>
          </div>

          <div className="dark-card home-card">
            <h3>
              2. Review
              Proposals
            </h3>

            <p>
              Compare
              freelancers
              by skills,
              pricing,
              profiles and
              reviews.
            </p>
          </div>

          <div className="dark-card home-card">
            <h3>
              3. Hire &
              Manage
            </h3>

            <p>
              Use
              contracts,
              messages and
              reviews to
              complete work
              safely.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          FEATURED FREELANCERS
      ================================================== */}

      <FeaturedFreelancers />

      {/* ==================================================
          LATEST JOBS
      ================================================== */}

      <LatestJobs />

      {/* ==================================================
          MARKETPLACE ACTIVITY
      ================================================== */}

      <MarketplaceActivity />

      {/* ==================================================
          TRENDING CATEGORIES
      ================================================== */}

      <TrendingCategories />

      {/* ==================================================
          POPULAR SERVICES
      ================================================== */}

      <section className="home-section">
        <div className="home-section-header">
          <p className="dashboard-badge">
            Popular
            Services
          </p>

          <h2>
            Find skills
            for every
            project
          </h2>
        </div>

        <div className="home-grid">
          {services.map(
            (
              item
            ) => (
              <div
                key={
                  item
                }
                className="dark-card home-card"
              >
                <h3>
                  {item}
                </h3>

                <p>
                  Find
                  skilled
                  freelancers
                  for{" "}
                  {item
                    .toLowerCase()}{" "}
                  projects.
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* ==================================================
          TRUST & SAFETY
      ================================================== */}

      <section className="home-section">
        <div className="home-section-header">
          <p className="dashboard-badge">
            Trust &
            Safety
          </p>

          <h2>
            Built to keep
            work inside
            the platform
          </h2>
        </div>

        <div className="home-grid">
          <div className="dark-card home-card">
            <h3>
              No
              Off-Platform
              Contact
              Before Hiring
            </h3>

            <p>
              Proposals
              discourage
              phone
              numbers,
              WhatsApp and
              email sharing
              before a
              client hires.
            </p>
          </div>

          <div className="dark-card home-card">
            <h3>
              Safer
              Proposal Flow
            </h3>

            <p>
              Freelancers
              apply with a
              budget and
              cover message
              while clients
              review
              proposals
              from the
              dashboard.
            </p>
          </div>

          <div className="dark-card home-card">
            <h3>
              Platform-Based
              Trust
            </h3>

            <p>
              Profiles,
              reviews,
              uploads,
              favorites
              and
              notifications
              help users
              make better
              hiring
              decisions.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          CTA
      ================================================== */}

      {authReady &&
        !loggedIn && (
          <section className="home-cta dark-card">
            <h2>
              Ready to
              build your
              next
              project?
            </h2>

            <p>
              Join South
              Africa&apos;s
              growing
              freelance
              marketplace
              today.
            </p>

            <Link
              href="/register"
              className="home-primary-btn"
            >
              Create Free
              Account
            </Link>
          </section>
        )}
    </main>
  );
}