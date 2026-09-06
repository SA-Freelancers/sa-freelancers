"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/app/lib/supabase";


type Category = {
  category: string;
  jobs_count: number;
};


/* =========================================================
   HELPERS
   ========================================================= */

function getCategoryIcon(
  category: string
) {
  const value =
    category.toLowerCase();

  if (
    value.includes("web") ||
    value.includes("software") ||
    value.includes("developer")
  ) {
    return "💻";
  }

  if (
    value.includes("graphic") ||
    value.includes("design") ||
    value.includes("ui") ||
    value.includes("ux")
  ) {
    return "🎨";
  }

  if (
    value.includes("engineering") ||
    value.includes("mechanical") ||
    value.includes("cad") ||
    value.includes("draft")
  ) {
    return "⚙️";
  }

  if (
    value.includes("writing") ||
    value.includes("copy")
  ) {
    return "✍️";
  }

  if (
    value.includes("marketing") ||
    value.includes("social")
  ) {
    return "📣";
  }

  if (
    value.includes("video") ||
    value.includes("animation")
  ) {
    return "🎬";
  }

  if (
    value.includes("finance") ||
    value.includes("bookkeeping") ||
    value.includes("account")
  ) {
    return "📊";
  }

  if (
    value.includes("assistant") ||
    value.includes("admin")
  ) {
    return "🗂️";
  }

  return "🔥";
}


/* =========================================================
   COMPONENT
   ========================================================= */

export default function TrendingCategories() {

  const [
    categories,
    setCategories,
  ] =
    useState<
      Category[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  /* =========================================================
     LOAD CATEGORIES
     ========================================================= */

  useEffect(() => {

    const loadCategories =
      async () => {

        try {

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "trending_categories"
              )
              .select("*");


          if (error) {

            console.error(
              "Trending categories loading error:",
              error
            );

            return;

          }


          const sorted =
            (
              data as
                Category[]
            ) || [];


          sorted.sort(
            (
              a,
              b
            ) =>
              Number(
                b.jobs_count ||
                  0
              ) -
              Number(
                a.jobs_count ||
                  0
              )
          );


          setCategories(
            sorted
          );

        } catch (
          error
        ) {

          console.error(
            "Trending categories unexpected error:",
            error
          );

        } finally {

          setLoading(
            false
          );

        }

      };


    void loadCategories();

  }, []);


  if (
    loading
  ) {
    return null;
  }


  if (
    categories.length ===
    0
  ) {
    return null;
  }


  /* =========================================================
     PAGE
     ========================================================= */

  return (

    <section className="home-section trending-categories-section">


      {/* HEADER */}

      <div className="home-section-header">

        <p className="dashboard-badge">
          Trending Categories
        </p>

        <h2>
          Popular skills on
          Freelance Hub SA
        </h2>

        <p className="trending-categories-subtitle">

          Explore the areas where
          clients are currently
          posting the most
          opportunities.

        </p>

      </div>


      {/* GRID */}

      <div className="trending-categories-grid">

        {categories.map(
          (
            item,
            index
          ) => {

            const icon =
              getCategoryIcon(
                item.category
              );

            const count =
              Number(
                item.jobs_count ||
                  0
              );


            return (

              <article
                key={
                  item.category
                }
                className="trending-category-card"
              >


                <div className="trending-category-top">

                  <div className="trending-category-icon">

                    {icon}

                  </div>


                  <span className="trending-category-rank">

                    #{index + 1}

                  </span>

                </div>


                <div className="trending-category-content">

                  <h3>

                    {
                      item.category
                    }

                  </h3>


                  <p>

                    {count}{" "}
                    {
                      count === 1
                        ? "active opportunity"
                        : "active opportunities"
                    }

                  </p>

                </div>


                <div className="trending-category-footer">

                  <span>

                    Trending now

                  </span>

                  <span>
                    →
                  </span>

                </div>


              </article>

            );

          }
        )}

      </div>


    </section>

  );

}