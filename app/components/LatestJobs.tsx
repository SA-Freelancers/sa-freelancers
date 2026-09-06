"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "@/app/lib/supabase";


type Job = {
  id: string;

  title?: string | null;
  description?: string | null;
  budget?: number | string | null;
  category?: string | null;
  created_at?: string | null;

  applications?: {
    id: string;
  }[];
};


/* =========================================================
   HELPERS
   ========================================================= */

function formatBudget(
  value:
    | number
    | string
    | null
    | undefined
) {

  const amount =
    Number(value || 0);

  return `R${amount.toLocaleString(
    "en-ZA"
  )}`;

}


function formatDate(
  value?:
    | string
    | null
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

export default function LatestJobs() {

  const [
    jobs,
    setJobs,
  ] =
    useState<Job[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  /* =========================================================
     LOAD JOBS
     ========================================================= */

  useEffect(() => {

    const loadJobs =
      async () => {

        try {

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "jobs"
              )
              .select(
                `
                *,
                applications (
                  id
                )
              `
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              )
              .limit(6);


          if (error) {

            console.error(
              "Latest jobs loading error:",
              error
            );

            return;

          }


          setJobs(
            (
              data as Job[]
            ) || []
          );

        } catch (
          error
        ) {

          console.error(
            "Latest jobs unexpected error:",
            error
          );

        } finally {

          setLoading(
            false
          );

        }

      };


    void loadJobs();

  }, []);


  if (
    loading
  ) {

    return null;

  }


  if (
    jobs.length ===
    0
  ) {

    return null;

  }


  /* =========================================================
     PAGE
     ========================================================= */

  return (

    <section className="home-section latest-jobs-section">


      {/* HEADER */}

      <div className="home-section-header">

        <p className="dashboard-badge">
          Latest Opportunities
        </p>

        <h2>
          Find your next project
        </h2>

        <p className="latest-jobs-subtitle">

          Explore fresh freelance
          opportunities from
          businesses looking for
          skilled professionals.

        </p>

      </div>


      {/* GRID */}

      <div className="latest-jobs-grid">

        {jobs.map(
          (
            job
          ) => {

            const applicationCount =
              job.applications
                ?.length ||
              0;

            const postedDate =
              formatDate(
                job.created_at
              );


            return (

              <article
                key={
                  job.id
                }
                className="latest-job-card"
              >


                {/* TOP ROW */}

                <div className="latest-job-top">

                  <span className="latest-job-category">

                    📂{" "}
                    {
                      job.category ||
                      "General"
                    }

                  </span>


                  <span className="latest-job-status">

                    ● New

                  </span>

                </div>


                {/* TITLE */}

                <h3 className="latest-job-title">

                  {
                    job.title ||
                    "Untitled Job"
                  }

                </h3>


                {/* DESCRIPTION */}

                <p className="latest-job-description">

                  {
                    job.description
                      ?.trim()
                      .slice(
                        0,
                        135
                      ) ||
                    "No description yet."
                  }

                  {job.description &&
                    job.description
                      .trim()
                      .length >
                      135 &&
                    "..."}

                </p>


                {/* BUDGET */}

                <div className="latest-job-budget">

                  <span>
                    Project Budget
                  </span>

                  <strong>

                    {
                      formatBudget(
                        job.budget
                      )
                    }

                  </strong>

                </div>


                {/* META */}

                <div className="latest-job-meta">

                  <span>

                    👥{" "}
                    {
                      applicationCount
                    }{" "}
                    {
                      applicationCount ===
                      1
                        ? "application"
                        : "applications"
                    }

                  </span>


                  {postedDate && (

                    <span>

                      📅{" "}
                      {
                        postedDate
                      }

                    </span>

                  )}

                </div>


                {/* ACTION */}

                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="latest-job-button"
                >

                  View Opportunity

                  <span>
                    →
                  </span>

                </Link>


              </article>

            );

          }
        )}

      </div>


      {/* FOOTER */}

      <div className="latest-jobs-footer">

        <Link
          href="/search"
          className="latest-jobs-view-all"
        >

          Browse All Opportunities

          <span>
            →
          </span>

        </Link>

      </div>


    </section>

  );

}