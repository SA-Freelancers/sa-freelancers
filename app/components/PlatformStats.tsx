"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  supabase,
} from "@/app/lib/supabase";

type MarketplaceStats = {
  freelancers: number;
  clients: number;
  jobs_posted: number;
  applications_sent: number;
};

const emptyStats: MarketplaceStats = {
  freelancers: 0,
  clients: 0,
  jobs_posted: 0,
  applications_sent: 0,
};

const CACHE_KEY =
  "freelancehubsa_public_marketplace_stats";

const CACHE_TIME_KEY =
  "freelancehubsa_public_marketplace_stats_time";

const CACHE_MAX_AGE =
  5 * 60 * 1000;

export default function PlatformStats() {
  const [
    stats,
    setStats,
  ] =
    useState<MarketplaceStats>(
      emptyStats
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    hasLoadedOnce,
    setHasLoadedOnce,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const mountedRef =
    useRef(true);

  // ==================================================
  // READ CACHE
  // ==================================================

  const readCachedStats =
    useCallback(() => {
      try {
        const cached =
          localStorage.getItem(
            CACHE_KEY
          );

        const cachedTime =
          localStorage.getItem(
            CACHE_TIME_KEY
          );

        if (
          !cached ||
          !cachedTime
        ) {
          return false;
        }

        const parsedTime =
          Number(
            cachedTime
          );

        if (
          !Number.isFinite(
            parsedTime
          )
        ) {
          return false;
        }

        const age =
          Date.now() -
          parsedTime;

        if (
          age >
          CACHE_MAX_AGE
        ) {
          return false;
        }

        const parsed =
          JSON.parse(
            cached
          ) as Partial<MarketplaceStats>;

        const cachedStats: MarketplaceStats =
          {
            freelancers:
              Number(
                parsed.freelancers ??
                  0
              ),

            clients:
              Number(
                parsed.clients ??
                  0
              ),

            jobs_posted:
              Number(
                parsed.jobs_posted ??
                  0
              ),

            applications_sent:
              Number(
                parsed.applications_sent ??
                  0
              ),
          };

        setStats(
          cachedStats
        );

        setLoading(
          false
        );

        setHasLoadedOnce(
          true
        );

        return true;
      } catch (
        error
      ) {
        console.error(
          "Failed to read marketplace statistics cache:",
          error
        );

        return false;
      }
    }, []);

  // ==================================================
  // SAVE CACHE
  // ==================================================

  const saveCachedStats =
    useCallback(
      (
        newStats:
          MarketplaceStats
      ) => {
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify(
              newStats
            )
          );

          localStorage.setItem(
            CACHE_TIME_KEY,
            String(
              Date.now()
            )
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to cache marketplace statistics:",
            error
          );
        }
      },
      []
    );

  // ==================================================
  // LOAD STATS
  // ==================================================

  const loadStats =
    useCallback(
      async (
        showLoading = false
      ) => {
        if (
          showLoading &&
          !hasLoadedOnce
        ) {
          setLoading(
            true
          );
        }

        setErrorMessage(
          ""
        );

        try {
          const {
            data,
            error,
          } =
            await supabase.rpc(
              "get_public_marketplace_stats"
            );

          if (
            error
          ) {
            throw error;
          }

          const result =
            Array.isArray(
              data
            )
              ? data[0]
              : data;

          if (
            !result
          ) {
            throw new Error(
              "No marketplace statistics were returned."
            );
          }

          const newStats: MarketplaceStats =
            {
              freelancers:
                Number(
                  result.freelancers ??
                    0
                ),

              clients:
                Number(
                  result.clients ??
                    0
                ),

              jobs_posted:
                Number(
                  result.jobs_posted ??
                    0
                ),

              applications_sent:
                Number(
                  result.applications_sent ??
                    0
                ),
            };

          if (
            !mountedRef.current
          ) {
            return;
          }

          setStats(
            newStats
          );

          setHasLoadedOnce(
            true
          );

          setLoading(
            false
          );

          saveCachedStats(
            newStats
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to load marketplace statistics:",
            error
          );

          if (
            !mountedRef.current
          ) {
            return;
          }

          setLoading(
            false
          );

          setErrorMessage(
            "Live marketplace statistics are temporarily unavailable."
          );
        }
      },
      [
        hasLoadedOnce,
        saveCachedStats,
      ]
    );

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    mountedRef.current =
      true;

    const hadCache =
      readCachedStats();

    void loadStats(
      !hadCache
    );

    const interval =
      window.setInterval(
        () => {
          void loadStats(
            false
          );
        },
        60_000
      );

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadStats(
            false
          );
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      mountedRef.current =
        false;

      window.clearInterval(
        interval
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    loadStats,
    readCachedStats,
  ]);

  // ==================================================
  // CARDS
  // ==================================================

  const cards = [
    {
      label:
        "Freelancers",

      value:
        stats.freelancers,
    },

    {
      label:
        "Clients",

      value:
        stats.clients,
    },

    {
      label:
        "Jobs Posted",

      value:
        stats.jobs_posted,
    },

    {
      label:
        "Applications Sent",

      value:
        stats.applications_sent,
    },
  ];

  return (
    <section className="platform-stats-section">
      <div className="platform-stats-grid">
        {cards.map(
          (
            card
          ) => (
            <article
              key={
                card.label
              }
              className="platform-stat-card"
            >
              <strong className="platform-stat-value">
                {loading &&
                !hasLoadedOnce
                  ? "..."
                  : card.value.toLocaleString(
                      "en-ZA"
                    )}
              </strong>

              <span className="platform-stat-label">
                {
                  card.label
                }
              </span>
            </article>
          )
        )}
      </div>

      {errorMessage && (
        <p className="platform-stats-error">
          {
            errorMessage
          }
        </p>
      )}
    </section>
  );
}