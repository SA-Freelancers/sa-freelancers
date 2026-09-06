"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/app/lib/supabase";


type Activity = {
  id: string;
  activity_type: string;
  title: string;
  description?: string | null;
  created_at?: string | null;
};


/* =========================================================
   HELPERS
   ========================================================= */

function getActivityIcon(
  type: string
) {
  switch (type) {
    case "job":
      return "💼";

    case "application":
      return "📩";

    case "hire":
      return "✅";

    case "review":
      return "⭐";

    case "payment":
      return "💳";

    case "milestone":
      return "🎯";

    case "payout":
      return "💰";

    default:
      return "⚡";
  }
}


function getActivityLabel(
  type: string
) {
  switch (type) {
    case "job":
      return "New Job";

    case "application":
      return "Application";

    case "hire":
      return "New Hire";

    case "review":
      return "New Review";

    case "payment":
      return "Payment";

    case "milestone":
      return "Milestone";

    case "payout":
      return "Payout";

    default:
      return "Marketplace";
  }
}


function getActivityClass(
  type: string
) {
  switch (type) {
    case "job":
      return "activity-job";

    case "application":
      return "activity-application";

    case "hire":
      return "activity-hire";

    case "review":
      return "activity-review";

    case "payment":
      return "activity-payment";

    case "milestone":
      return "activity-milestone";

    case "payout":
      return "activity-payout";

    default:
      return "activity-default";
  }
}


function formatActivityTime(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  const minutes =
    Math.floor(
      difference /
        60000
    );

  const hours =
    Math.floor(
      difference /
        3600000
    );

  const days =
    Math.floor(
      difference /
        86400000
    );


  if (
    minutes <
    1
  ) {
    return "Just now";
  }


  if (
    minutes <
    60
  ) {
    return `${minutes} min ago`;
  }


  if (
    hours <
    24
  ) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    } ago`;
  }


  if (
    days <
    7
  ) {
    return `${days} ${
      days === 1
        ? "day"
        : "days"
    } ago`;
  }


  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


/* =========================================================
   COMPONENT
   ========================================================= */

export default function MarketplaceActivity() {

  const [
    activities,
    setActivities,
  ] =
    useState<
      Activity[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  /* =========================================================
     LOAD ACTIVITIES
     ========================================================= */

  useEffect(() => {

    const loadActivities =
      async () => {

        try {

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "marketplace_activity"
              )
              .select("*")
              .order(
                "created_at",
                {
                  ascending: false,
                }
              )
              .limit(6);


          if (error) {

            console.error(
              "Marketplace activity loading error:",
              error
            );

            return;

          }


          setActivities(
            (
              data as Activity[]
            ) || []
          );

        } catch (
          error
        ) {

          console.error(
            "Marketplace activity unexpected error:",
            error
          );

        } finally {

          setLoading(
            false
          );

        }

      };


    void loadActivities();

  }, []);


  if (
    loading
  ) {
    return null;
  }


  if (
    activities.length ===
    0
  ) {
    return null;
  }


  /* =========================================================
     PAGE
     ========================================================= */

  return (

    <section className="home-section marketplace-activity-section">


      {/* HEADER */}

      <div className="home-section-header">

        <p className="dashboard-badge">
          Live Activity
        </p>

        <h2>
          What&apos;s happening on
          Freelance Hub SA
        </h2>

        <p className="marketplace-activity-subtitle">

          Recent marketplace activity
          from jobs, applications,
          hires and completed work.

        </p>

      </div>


      {/* LIVE INDICATOR */}

      <div className="marketplace-live-strip">

        <span className="marketplace-live-dot" />

        <strong>
          Marketplace Live
        </strong>

        <span>
          Recent activity from across
          the platform
        </span>

      </div>


      {/* FEED */}

      <div className="marketplace-activity-grid">

        {activities.map(
          (
            item
          ) => {

            const activityClass =
              getActivityClass(
                item.activity_type
              );

            const activityIcon =
              getActivityIcon(
                item.activity_type
              );

            const activityLabel =
              getActivityLabel(
                item.activity_type
              );

            const activityTime =
              formatActivityTime(
                item.created_at
              );


            return (

              <article
                key={
                  item.id
                }
                className={`marketplace-activity-card ${activityClass}`}
              >


                {/* ICON */}

                <div className="marketplace-activity-icon">

                  {activityIcon}

                </div>


                {/* CONTENT */}

                <div className="marketplace-activity-content">


                  <div className="marketplace-activity-top">

                    <span className="marketplace-activity-type">

                      {activityLabel}

                    </span>


                    {activityTime && (

                      <span className="marketplace-activity-time">

                        {activityTime}

                      </span>

                    )}

                  </div>


                  <h3>

                    {item.title}

                  </h3>


                  {item.description && (

                    <p>

                      {item.description}

                    </p>

                  )}


                </div>


              </article>

            );

          }
        )}

      </div>


    </section>

  );

}