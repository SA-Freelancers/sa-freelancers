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


/* =========================================================
   POPULAR SERVICES
   ========================================================= */

const services = [
  "Web Development",
  "Graphic Design",
  "Writing",
  "Marketing",
  "Video Editing",
  "Engineering",
];


/* =========================================================
   MOVING CATEGORY TICKER
   ========================================================= */

const movingCategories = [
  "CAD Drafting",
  "Mechanical Design",
  "Web Development",
  "Graphic Design",
  "Engineering",
  "Digital Marketing",
  "Video Editing",
  "Copywriting",
  "UI / UX Design",
  "Data Analysis",
  "Bookkeeping",
  "Virtual Assistance",
];


/* =========================================================
   ROTATING HERO FREELANCERS
   ========================================================= */

const rotatingFreelancers = [
  {
    initials: "NM",
    name: "Nomsa Mokoena",
    role: "Graphic Designer",
    rating: "4.9",
  },
  {
    initials: "SD",
    name: "Sipho Dlamini",
    role: "Web Developer",
    rating: "5.0",
  },
  {
    initials: "LM",
    name: "Lerato Molefe",
    role: "Virtual Assistant",
    rating: "4.8",
  },
  {
    initials: "KN",
    name: "Kagiso Ndlovu",
    role: "Mechanical Designer",
    rating: "4.9",
  },
];


/* =========================================================
   ROTATING MARKETPLACE EVENTS
   ========================================================= */

const marketplaceEvents = [
  {
    project: {
      label: "New Project",
      title: "Mechanical CAD Drawing",
      value: "ZAR 6,500",
    },

    payment: {
      label: "Milestone",
      title: "Payment Secured",
      value: "ZAR 3,250",
    },

    activity: {
      label: "Project Update",
      title: "Freelancer Hired",
      value: "Contract Active",
    },
  },

  {
    project: {
      label: "New Project",
      title: "WordPress Website",
      value: "ZAR 8,000",
    },

    payment: {
      label: "Payment",
      title: "Milestone Funded",
      value: "ZAR 4,000",
    },

    activity: {
      label: "Marketplace",
      title: "Proposal Accepted",
      value: "Work Starting",
    },
  },

  {
    project: {
      label: "New Project",
      title: "Company Logo Design",
      value: "ZAR 2,200",
    },

    payment: {
      label: "Client Update",
      title: "Work Approved",
      value: "Payment Ready",
    },

    activity: {
      label: "Project Update",
      title: "Project Completed",
      value: "★★★★★",
    },
  },

  {
    project: {
      label: "New Project",
      title: "Electrical Drawing",
      value: "ZAR 5,800",
    },

    payment: {
      label: "Payout",
      title: "Freelancer Paid",
      value: "ZAR 5,220",
    },

    activity: {
      label: "Marketplace",
      title: "New Review",
      value: "★★★★★",
    },
  },
];


/* =========================================================
   DAILY MOTIVATION
   ========================================================= */

const dailyQuotes = [
  {
    quote:
      "It always seems impossible until it’s done.",
    person:
      "Nelson Mandela",
    role:
      "Leader & Statesman",
    icon:
      "🇿🇦",
  },

  {
    quote:
      "Nothing will work unless you do.",
    person:
      "Maya Angelou",
    role:
      "Author & Poet",
    icon:
      "✍️",
  },

  {
    quote:
      "The way to get started is to quit talking and begin doing.",
    person:
      "Walt Disney",
    role:
      "Entrepreneur & Creator",
    icon:
      "🎬",
  },

  {
    quote:
      "Whether you think you can, or you think you can’t, you’re right.",
    person:
      "Henry Ford",
    role:
      "Industrial Pioneer",
    icon:
      "⚙️",
  },

  {
    quote:
      "Great things in business are never done by one person.",
    person:
      "Steve Jobs",
    role:
      "Entrepreneur & Innovator",
    icon:
      "💡",
  },

  {
    quote:
      "Genius is one percent inspiration and ninety-nine percent perspiration.",
    person:
      "Thomas Edison",
    role:
      "Inventor",
    icon:
      "💡",
  },

  {
    quote:
      "Doing the best at this moment puts you in the best place for the next moment.",
    person:
      "Oprah Winfrey",
    role:
      "Entrepreneur & Media Leader",
    icon:
      "🌟",
  },
];


/* =========================================================
   HOME PAGE
   ========================================================= */

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

  const [
    quoteIndex,
    setQuoteIndex,
  ] = useState(0);

  const [
    freelancerIndex,
    setFreelancerIndex,
  ] = useState(0);

  const [
    marketplaceEventIndex,
    setMarketplaceEventIndex,
  ] = useState(0);


  /* =========================================================
     DAILY QUOTE
     ========================================================= */

  useEffect(() => {

    const now =
      new Date();

    const start =
      new Date(
        now.getFullYear(),
        0,
        0
      );

    const difference =
      now.getTime() -
      start.getTime();

    const day =
      Math.floor(
        difference /
          86400000
      );

    setQuoteIndex(
      day %
        dailyQuotes.length
    );

  }, []);


  /* =========================================================
     ROTATING FREELANCER
     ========================================================= */

  useEffect(() => {

    const interval =
      setInterval(() => {

        setFreelancerIndex(
          (current) =>
            (current + 1) %
            rotatingFreelancers.length
        );

      }, 4000);

    return () => {
      clearInterval(interval);
    };

  }, []);


  /* =========================================================
     ROTATING MARKETPLACE EVENTS
     ========================================================= */

  useEffect(() => {

    const interval =
      setInterval(() => {

        setMarketplaceEventIndex(
          (current) =>
            (current + 1) %
            marketplaceEvents.length
        );

      }, 5000);

    return () => {
      clearInterval(interval);
    };

  }, []);


  /* =========================================================
     AUTH / USER ROLE
     ========================================================= */

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


  /* =========================================================
     HERO BUTTONS
     ========================================================= */

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


  /* =========================================================
     FINAL CTA
     ========================================================= */

  const renderFinalCTA =
    () => {

      if (!authReady) {
        return null;
      }


      if (!loggedIn) {

        return (
          <section className="home-cta dark-card">

            <p className="dashboard-badge">
              Start Today
            </p>

            <h2>
              Your next opportunity
              starts here.
            </h2>

            <p>
              Join Freelance Hub SA
              and connect with skilled
              South African freelancers
              and businesses.
            </p>

            <div className="home-actions home-cta-actions">

              <Link
                href="/register"
                className="home-primary-btn"
              >
                Create Free Account
              </Link>

              <Link
                href="/search"
                className="home-secondary-btn"
              >
                Browse Marketplace
              </Link>

            </div>

          </section>
        );

      }


      if (
        userRole ===
        "client"
      ) {

        return (
          <section className="home-cta dark-card">

            <p className="dashboard-badge">
              Ready to Hire?
            </p>

            <h2>
              Turn your next idea
              into a real project.
            </h2>

            <p>
              Post your project and
              connect with skilled
              freelancers across
              South Africa.
            </p>

            <div className="home-actions home-cta-actions">

              <Link
                href="/dashboard/post-job"
                className="home-primary-btn"
              >
                Post a Project
              </Link>

              <Link
                href="/freelancers"
                className="home-secondary-btn"
              >
                Find Freelancers
              </Link>

            </div>

          </section>
        );

      }


      if (
        userRole ===
        "freelancer"
      ) {

        return (
          <section className="home-cta dark-card">

            <p className="dashboard-badge">
              Find Your Next Project
            </p>

            <h2>
              Your skills can become
              your next opportunity.
            </h2>

            <p>
              Discover projects,
              build your reputation
              and grow your freelance
              career on Freelance Hub SA.
            </p>

            <div className="home-actions home-cta-actions">

              <Link
                href="/search"
                className="home-primary-btn"
              >
                Find Work
              </Link>

              <Link
                href="/dashboard/profile"
                className="home-secondary-btn"
              >
                View My Profile
              </Link>

            </div>

          </section>
        );

      }


      return (
        <section className="home-cta dark-card">

          <h2>
            Welcome to
            Freelance Hub SA.
          </h2>

          <p>
            Manage your work,
            opportunities and account
            from your dashboard.
          </p>

          <Link
            href="/dashboard"
            className="home-primary-btn"
          >
            Open Dashboard
          </Link>

        </section>
      );

    };


  /* =========================================================
     ACTIVE DATA
     ========================================================= */

  const todayQuote =
    dailyQuotes[
      quoteIndex
    ];

  const featuredFreelancer =
    rotatingFreelancers[
      freelancerIndex
    ];

  const marketplaceEvent =
    marketplaceEvents[
      marketplaceEventIndex
    ];


  /* =========================================================
     PAGE
     ========================================================= */

  return (

    <main className="home-page home-live-page">


      {/* ==================================================
          LIVE HERO
      ================================================== */}

      <section className="home-live-hero">


        <div
          className="home-hero-orb home-orb-one"
        />

        <div
          className="home-hero-orb home-orb-two"
        />

        <div
          className="home-hero-orb home-orb-three"
        />


        <div className="home-live-hero-inner">


          {/* LEFT SIDE */}

          <div className="home-live-copy">


            <div className="home-live-badge">

              <span className="home-live-dot" />

              South Africa&apos;s
              freelance marketplace

            </div>


            <h1>
              Turn skills into
              <span>
                {" "}
                opportunity.
              </span>
            </h1>


            <p className="home-live-subtitle">

              Hire trusted South
              African freelancers,
              discover new work,
              manage milestones,
              make secure payments
              and build your
              reputation — all in
              one marketplace.

            </p>


            <div className="home-actions home-live-actions">

              {renderHeroButtons()}

            </div>


            <div className="home-live-trust">

              <span>
                ✓ Verified Talent
              </span>

              <span>
                🔒 Secure Payments
              </span>

              <span>
                ⭐ Trusted Reviews
              </span>

              <span>
                🇿🇦 Built for SA
              </span>

            </div>


          </div>


          {/* RIGHT SIDE */}

          <div className="home-marketplace-stage">


            <div className="home-stage-glow" />


            {/* ROTATING FREELANCER */}

            <div className="home-floating-card home-card-profile">

              <div
                className="home-floating-avatar"
                key={
                  featuredFreelancer.initials
                }
              >
                {
                  featuredFreelancer.initials
                }
              </div>


              <div
                className="home-rotating-freelancer-info"
                key={
                  featuredFreelancer.name
                }
              >

                <strong>
                  {
                    featuredFreelancer.name
                  }
                </strong>

                <small>
                  {
                    featuredFreelancer.role
                  }
                </small>

              </div>


              <span className="home-floating-rating">

                ★{" "}
                {
                  featuredFreelancer.rating
                }

              </span>

            </div>


            {/* ROTATING PROJECT */}

            <div
              className="home-floating-card home-card-job"
              key={
                `project-${marketplaceEventIndex}`
              }
            >

              <span className="home-floating-icon">
                💼
              </span>

              <div>

                <small>
                  {
                    marketplaceEvent
                      .project
                      .label
                  }
                </small>

                <strong>
                  {
                    marketplaceEvent
                      .project
                      .title
                  }
                </strong>

                <span>
                  {
                    marketplaceEvent
                      .project
                      .value
                  }
                </span>

              </div>

            </div>


            {/* ROTATING PAYMENT */}

            <div
              className="home-floating-card home-card-payment"
              key={
                `payment-${marketplaceEventIndex}`
              }
            >

              <span className="home-floating-icon">
                ✓
              </span>

              <div>

                <small>
                  {
                    marketplaceEvent
                      .payment
                      .label
                  }
                </small>

                <strong>
                  {
                    marketplaceEvent
                      .payment
                      .title
                  }
                </strong>

                <span>
                  {
                    marketplaceEvent
                      .payment
                      .value
                  }
                </span>

              </div>

            </div>


            {/* ROTATING ACTIVITY */}

            <div
              className="home-floating-card home-card-hired"
              key={
                `activity-${marketplaceEventIndex}`
              }
            >

              <span className="home-floating-icon">
                🤝
              </span>

              <div>

                <small>
                  {
                    marketplaceEvent
                      .activity
                      .label
                  }
                </small>

                <strong>
                  {
                    marketplaceEvent
                      .activity
                      .title
                  }
                </strong>

                <span>
                  {
                    marketplaceEvent
                      .activity
                      .value
                  }
                </span>

              </div>

            </div>


            {/* CENTRAL MARKETPLACE */}

            <div className="home-marketplace-core">

              <span className="home-core-logo">
                FH
              </span>

              <strong>
                Freelance Hub SA
              </strong>

              <small>
                Trusted Work
              </small>

              <div className="home-core-status">

                <span />

                Marketplace Live

              </div>

            </div>


          </div>


        </div>


      </section>


      {/* ==================================================
          MOVING CATEGORIES
      ================================================== */}

      <section className="home-category-ticker">

        <div className="home-category-track">

          {[
            ...movingCategories,
            ...movingCategories,
          ].map(
            (
              category,
              index
            ) => (

              <span
                key={
                  `${category}-${index}`
                }
              >

                {category}

                <b>
                  ✦
                </b>

              </span>

            )
          )}

        </div>

      </section>


      {/* ==================================================
          PLATFORM STATS
      ================================================== */}

      <PlatformStats />


      {/* ==================================================
          DAILY MOTIVATION
      ================================================== */}

      <section className="home-motivation-section">

        <div className="home-motivation-card">


          <div className="home-motivation-label">

            ✨ Daily Motivation

          </div>


          <div className="home-quote-mark">

            “

          </div>


          <blockquote>

            {todayQuote.quote}

          </blockquote>


          <div className="home-quote-person">

            <div className="home-quote-icon">

              {todayQuote.icon}

            </div>


            <div>

              <strong>
                {todayQuote.person}
              </strong>

              <span>
                {todayQuote.role}
              </span>

            </div>

          </div>


          <p className="home-quote-message">

            A new thought every
            day for freelancers,
            creators and businesses
            building something
            better.

          </p>


        </div>

      </section>


            {/* ==================================================
          WHY FREELANCE HUB SA
      ================================================== */}

      <section className="home-section why-fhsa-section">

        <div className="home-section-header">

          <p className="dashboard-badge">
            Why Freelance Hub SA?
          </p>

          <h2>
            Built to make freelance work
            more trusted, structured
            and local
          </h2>

          <p>
            Freelance Hub SA brings
            clients and freelancers
            together in one platform
            designed around trust,
            clear project workflows
            and South African opportunities.
          </p>

        </div>


        <div className="why-fhsa-grid">


          <article className="why-fhsa-card">

            <div className="why-fhsa-icon">
              ✔
            </div>

            <span className="why-fhsa-label">
              Trust
            </span>

            <h3>
              Verified Profiles
            </h3>

            <p>
              Identity verification
              and complete professional
              profiles help clients
              make more informed hiring
              decisions.
            </p>

          </article>


          <article className="why-fhsa-card">

            <div className="why-fhsa-icon">
              🔒
            </div>

            <span className="why-fhsa-label">
              Protection
            </span>

            <h3>
              Secure Platform
            </h3>

            <p>
              Messages, contracts,
              milestones, payments
              and payout records stay
              connected to the project
              workflow.
            </p>

          </article>


          <article className="why-fhsa-card">

            <div className="why-fhsa-icon">
              ⭐
            </div>

            <span className="why-fhsa-label">
              Reputation
            </span>

            <h3>
              Reviews & Ratings
            </h3>

            <p>
              Completed projects
              and client feedback
              help strong freelancers
              build credibility over time.
            </p>

          </article>


          <article className="why-fhsa-card why-fhsa-card-local">

            <div className="why-fhsa-icon">
              🇿🇦
            </div>

            <span className="why-fhsa-label">
              Local Focus
            </span>

            <h3>
              Built for South Africa
            </h3>

            <p>
              Discover local talent,
              local businesses and
              freelance opportunities
              across South Africa.
            </p>

          </article>


        </div>


        <div className="why-fhsa-strip">

          <div>
            <strong>
              One platform.
            </strong>

            <span>
              Find talent
            </span>
          </div>

          <b>→</b>

          <div>
            <strong>
              One workflow.
            </strong>

            <span>
              Manage projects
            </span>
          </div>

          <b>→</b>

          <div>
            <strong>
              One marketplace.
            </strong>

            <span>
              Build reputation
            </span>
          </div>

        </div>

      </section>


            {/* ==================================================
          HOW IT WORKS
      ================================================== */}

      <section className="home-section how-it-works-section">

        <div className="home-section-header">

          <p className="dashboard-badge">
            How It Works
          </p>

          <h2>
            From idea to completed
            project
          </h2>

          <p>
            Freelance Hub SA keeps the
            full project journey clear,
            from finding the right person
            to completing the work and
            releasing payment.
          </p>

        </div>


        <div className="how-it-works-grid">


          <article className="how-it-works-card">

            <div className="how-step-number">
              01
            </div>

            <div className="how-step-icon">
              💼
            </div>

            <h3>
              Post or Find Work
            </h3>

            <p>
              Clients create projects
              while freelancers discover
              opportunities that match
              their skills and experience.
            </p>

          </article>


          <div className="how-step-connector">
            →
          </div>


          <article className="how-it-works-card">

            <div className="how-step-number">
              02
            </div>

            <div className="how-step-icon">
              🤝
            </div>

            <h3>
              Hire & Agree
            </h3>

            <p>
              Review freelancer profiles,
              proposals and pricing before
              agreeing on the project and
              starting the contract.
            </p>

          </article>


          <div className="how-step-connector">
            →
          </div>


          <article className="how-it-works-card">

            <div className="how-step-number">
              03
            </div>

            <div className="how-step-icon">
              🔒
            </div>

            <h3>
              Fund Milestones
            </h3>

            <p>
              Break the project into
              milestones and securely
              fund approved work through
              the platform.
            </p>

          </article>


          <div className="how-step-connector">
            →
          </div>


          <article className="how-it-works-card">

            <div className="how-step-number">
              04
            </div>

            <div className="how-step-icon">
              ✓
            </div>

            <h3>
              Deliver & Get Paid
            </h3>

            <p>
              Freelancers submit completed
              work, clients approve it and
              payouts are recorded through
              the platform.
            </p>

          </article>


        </div>


        <div className="how-it-works-footer">

          {!loggedIn ? (

            <>
              <Link
                href="/register"
                className="home-primary-btn"
              >
                Get Started
              </Link>

              <Link
                href="/search"
                className="home-secondary-btn"
              >
                Browse Marketplace
              </Link>
            </>

          ) : (

            <Link
              href="/dashboard"
              className="home-primary-btn"
            >
              Open Dashboard
            </Link>

          )}

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

      <section className="home-section popular-services-section">

        <div className="home-section-header">

          <p className="dashboard-badge">
            Popular Services
          </p>

          <h2>
            Find the right skill
            for your project
          </h2>

          <p>
            Explore some of the
            most common services
            clients hire for on
            Freelance Hub SA.
          </p>

        </div>


        <div className="popular-services-grid">

          {services.map(
            (
              item,
              index
            ) => {

              const icons = [
                "💻",
                "🎨",
                "✍️",
                "📣",
                "🎬",
                "⚙️",
              ];

              return (

                <Link
  key={item}
  href={`/freelancers?category=${encodeURIComponent(item)}`}
  className="popular-service-card"
>

                  <div className="popular-service-icon">

                    {
                      icons[
                        index %
                        icons.length
                      ]
                    }

                  </div>

                  <div className="popular-service-content">

                    <h3>
                      {item}
                    </h3>

                    <p>
                      Find skilled
                      professionals for{" "}
                      {
                        item
                          .toLowerCase()
                      }{" "}
                      projects.
                    </p>

                  </div>

                  <span className="popular-service-arrow">
                    →
                  </span>

                </Link>

              );

            }
          )}

        </div>


        <div className="popular-services-footer">

          <Link
            href="/freelancers"
            className="popular-services-view-all"
          >
            Browse All Services
            <span>→</span>
          </Link>

        </div>

      </section>



      {/* ==================================================
          TRUST & SAFETY
      ================================================== */}

      <section className="home-section trust-safety-section">

        <div className="home-section-header">

          <p className="dashboard-badge">
            Trust & Safety
          </p>

          <h2>
            Built for safer
            freelance work
          </h2>

          <p>
            Freelance Hub SA helps
            clients and freelancers
            work with more confidence
            through verification,
            secure payments and
            transparent reputation.
          </p>

        </div>


        <div className="trust-safety-grid">


          <article className="trust-safety-card">

            <div className="trust-safety-icon">
              🔒
            </div>

            <div>

              <span className="trust-safety-label">
                Payments
              </span>

              <h3>
                Secure Milestone Payments
              </h3>

              <p>
                Milestone payments,
                payment history and
                payout records remain
                tracked inside the
                platform from funding
                through completion.
              </p>

            </div>

          </article>


          <article className="trust-safety-card">

            <div className="trust-safety-icon">
              ✔
            </div>

            <div>

              <span className="trust-safety-label">
                Verification
              </span>

              <h3>
                Identity Verification
              </h3>

              <p>
                Freelancer identity
                verification helps
                clients recognise
                profiles that have
                completed the platform
                verification process.
              </p>

            </div>

          </article>


          <article className="trust-safety-card">

            <div className="trust-safety-icon">
              ⭐
            </div>

            <div>

              <span className="trust-safety-label">
                Reputation
              </span>

              <h3>
                Reviews & Ratings
              </h3>

              <p>
                Completed projects and
                client feedback help
                freelancers build a
                visible professional
                reputation over time.
              </p>

            </div>

          </article>


          <article className="trust-safety-card">

            <div className="trust-safety-icon">
              📋
            </div>

            <div>

              <span className="trust-safety-label">
                Workflow
              </span>

              <h3>
                Contracts & Milestones
              </h3>

              <p>
                Hiring, milestone
                approval, work
                submission and payment
                progress can be tracked
                through one structured
                project workflow.
              </p>

            </div>

          </article>


        </div>


        <div className="trust-safety-note">

          <span>
            🇿🇦
          </span>

          <p>
            Designed around the needs
            of South African clients,
            freelancers and businesses.
          </p>

        </div>

      </section>


      {/* ==================================================
          FINAL ROLE-AWARE CTA
      ================================================== */}

      {renderFinalCTA()}


    </main>

  );

}