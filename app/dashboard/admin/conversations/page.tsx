"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "@/app/lib/supabase";

type Conversation = {
  application_id: string;
  application_status: string | null;

  job_id: string;
  job_title: string;
  job_status: string | null;

  client_id: string | null;
  client_name: string;

  freelancer_id: string;
  freelancer_name: string;

  message_count: number;
  safety_event_count: number;
  pending_flag_count: number;
  high_risk_flag_count: number;

  flagged: boolean;

  last_message: string | null;
  last_message_at: string | null;
  last_activity_at: string | null;
};

type Summary = {
  conversations: number;
  flaggedConversations: number;
  pendingFlags: number;
  totalMessages: number;
  totalSafetyEvents: number;
};

type ApiResponse = {
  success?: boolean;
  conversations?: Conversation[];
  summary?: Summary;
  error?: string;
};

type FilterType =
  | "all"
  | "flagged"
  | "pending"
  | "high-risk";

export default function AdminConversationsPage() {
  const [
    conversations,
    setConversations,
  ] = useState<Conversation[]>([]);

  const [
    summary,
    setSummary,
  ] = useState<Summary>({
    conversations: 0,
    flaggedConversations: 0,
    pendingFlags: 0,
    totalMessages: 0,
    totalSafetyEvents: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<FilterType>(
    "all"
  );

  // --------------------------------------------------
  // LOAD CONVERSATIONS
  // --------------------------------------------------

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    setLoading(true);
    setError("");

    try {
      const {
        data: sessionData,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        setError(
          "Please login again."
        );

        return;
      }

      const response =
        await fetch(
          "/api/admin/conversations",
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${sessionData.session.access_token}`,
            },

            cache: "no-store",
          }
        );

      const result:
        ApiResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.error ||
            "Unable to load conversations."
        );

        return;
      }

      setConversations(
        result.conversations ||
          []
      );

      if (result.summary) {
        setSummary(
          result.summary
        );
      }
    } catch (
      loadError
    ) {
      console.error(
        "Admin conversations page error:",
        loadError
      );

      setError(
        "Unable to load conversations."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // FILTER
  // --------------------------------------------------

  const filteredConversations =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return conversations.filter(
        (
          conversation
        ) => {
          if (
            filter ===
              "flagged" &&
            !conversation.flagged
          ) {
            return false;
          }

          if (
            filter ===
              "pending" &&
            conversation
              .pending_flag_count ===
              0
          ) {
            return false;
          }

          if (
            filter ===
              "high-risk" &&
            conversation
              .high_risk_flag_count ===
              0
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable =
            [
              conversation
                .client_name,

              conversation
                .freelancer_name,

              conversation
                .job_title,

              conversation
                .last_message,

              conversation
                .application_status,

              conversation
                .job_status,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      conversations,
      filter,
      search,
    ]);

  // --------------------------------------------------
  // DATE
  // --------------------------------------------------

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return "—";
    }

    return new Date(
      value
    ).toLocaleString(
      "en-ZA"
    );
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="contracts-page">
        <h1>
          Conversation Monitoring
        </h1>

        <p>
          Loading conversations...
        </p>
      </main>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="contracts-page">

      {/* HEADER */}

      <section
        style={header}
      >
        <div>
          <p
            style={
              eyebrow
            }
          >
            ADMINISTRATION
          </p>

          <h1
            style={{
              margin:
                "4px 0 8px",
            }}
          >
            Conversation Monitoring
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.75,
            }}
          >
            Review platform
            conversations and
            investigate safety
            events.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadConversations
          }
          style={
            refreshButton
          }
        >
          ↻ Refresh
        </button>
      </section>

      {/* ERROR */}

      {error && (
        <div
          style={
            errorBox
          }
        >
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <section
        style={
          statsGrid
        }
      >
        <StatCard
          label="Conversations"
          value={
            summary.conversations
          }
        />

        <StatCard
          label="Flagged Conversations"
          value={
            summary.flaggedConversations
          }
        />

        <StatCard
          label="Pending Safety Flags"
          value={
            summary.pendingFlags
          }
        />

        <StatCard
          label="Messages"
          value={
            summary.totalMessages
          }
        />

        <StatCard
          label="Safety Events"
          value={
            summary.totalSafetyEvents
          }
        />
      </section>

      {/* SEARCH + FILTER */}

      <section
        className="dark-card"
        style={
          controlCard
        }
      >
        <div
          style={
            searchRow
          }
        >
          <input
            type="text"
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search client, freelancer or job..."
            style={
              searchInput
            }
          />
        </div>

        <div
          style={
            filterRow
          }
        >
          <FilterButton
            label="All Conversations"
            active={
              filter ===
              "all"
            }
            onClick={() =>
              setFilter(
                "all"
              )
            }
          />

          <FilterButton
            label="Flagged"
            active={
              filter ===
              "flagged"
            }
            onClick={() =>
              setFilter(
                "flagged"
              )
            }
          />

          <FilterButton
            label="Pending Review"
            active={
              filter ===
              "pending"
            }
            onClick={() =>
              setFilter(
                "pending"
              )
            }
          />

          <FilterButton
            label="High Risk"
            active={
              filter ===
              "high-risk"
            }
            onClick={() =>
              setFilter(
                "high-risk"
              )
            }
          />
        </div>
      </section>

      {/* RESULTS HEADER */}

      <div
        style={
          resultsHeader
        }
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          Conversations
        </h2>

        <span
          style={{
            opacity: 0.7,
          }}
        >
          {
            filteredConversations.length
          }{" "}
          result
          {filteredConversations.length ===
          1
            ? ""
            : "s"}
        </span>
      </div>

      {/* EMPTY */}

      {filteredConversations.length ===
        0 && (
        <div
          className="dark-card"
          style={
            emptyCard
          }
        >
          <h3>
            No conversations
            found
          </h3>

          <p>
            No conversations
            match the selected
            filter.
          </p>
        </div>
      )}

      {/* CONVERSATIONS */}

      <section
        style={
          conversationList
        }
      >
        {filteredConversations.map(
          (
            conversation
          ) => (
            <article
              key={
                conversation.application_id
              }
              className="dark-card"
              style={
                conversationCard
              }
            >
              {/* TOP */}

              <div
                style={
                  conversationTop
                }
              >
                <div>
                  <h3
                    style={{
                      margin:
                        "0 0 6px",
                    }}
                  >
                    {
                      conversation.job_title
                    }
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      opacity:
                        0.65,
                    }}
                  >
                    Last activity:{" "}
                    {formatDate(
                      conversation.last_activity_at
                    )}
                  </p>
                </div>

                <SafetyBadge
                  conversation={
                    conversation
                  }
                />
              </div>

              {/* PEOPLE */}

              <div
                style={
                  peopleGrid
                }
              >
                <div>
                  <span
                    style={
                      smallLabel
                    }
                  >
                    CLIENT
                  </span>

                  <strong>
                    {
                      conversation.client_name
                    }
                  </strong>
                </div>

                <div>
                  <span
                    style={
                      smallLabel
                    }
                  >
                    FREELANCER
                  </span>

                  <strong>
                    {
                      conversation.freelancer_name
                    }
                  </strong>
                </div>

                <div>
                  <span
                    style={
                      smallLabel
                    }
                  >
                    MESSAGES
                  </span>

                  <strong>
                    {
                      conversation.message_count
                    }
                  </strong>
                </div>

                <div>
                  <span
                    style={
                      smallLabel
                    }
                  >
                    SAFETY EVENTS
                  </span>

                  <strong>
                    {
                      conversation.safety_event_count
                    }
                  </strong>
                </div>
              </div>

              {/* LAST MESSAGE */}

              <div
                style={
                  messagePreview
                }
              >
                <span
                  style={
                    smallLabel
                  }
                >
                  LAST MESSAGE
                </span>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                  }}
                >
                  {conversation.last_message ||
                    "No successful messages. Conversation contains safety events only."}
                </p>
              </div>

              {/* FLAG DETAILS */}

              {conversation.flagged && (
                <div
                  style={
                    flagSummary
                  }
                >
                  <strong>
                    ⚠ Safety review
                  </strong>

                  <span>
                    {
                      conversation.pending_flag_count
                    }{" "}
                    pending
                  </span>

                  <span>
                    {
                      conversation.high_risk_flag_count
                    }{" "}
                    high-risk
                  </span>
                </div>
              )}

              {/* ACTION */}

              <div
                style={
                  actionRow
                }
              >
                <Link
                  href={`/dashboard/admin/conversations/${conversation.application_id}`}
                  style={
                    viewButton
                  }
                >
                  View Conversation
                </Link>
              </div>
            </article>
          )
        )}
      </section>

      <p
        style={
          privacyNote
        }
      >
        Administrator access
        should only be used for
        safety, fraud prevention,
        support, dispute
        resolution and policy
        enforcement.
      </p>
    </main>
  );
}

// ==================================================
// COMPONENTS
// ==================================================

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="dark-card"
      style={
        statCard
      }
    >
      <span
        style={{
          opacity: 0.7,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display:
            "block",

          fontSize: 28,

          marginTop: 8,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      style={{
        ...filterButton,

        background:
          active
            ? "#2563eb"
            : "transparent",

        color:
          active
            ? "white"
            : "var(--text)",

        border:
          active
            ? "1px solid #2563eb"
            : "1px solid var(--border)",
      }}
    >
      {label}
    </button>
  );
}

function SafetyBadge({
  conversation,
}: {
  conversation:
    Conversation;
}) {
  if (
    conversation
      .high_risk_flag_count >
    0
  ) {
    return (
      <span
        style={{
          ...badge,
          background:
            "rgba(239,68,68,0.15)",
          border:
            "1px solid rgba(239,68,68,0.35)",
        }}
      >
        🔴 High Risk
      </span>
    );
  }

  if (
    conversation.flagged
  ) {
    return (
      <span
        style={{
          ...badge,
          background:
            "rgba(245,158,11,0.15)",
          border:
            "1px solid rgba(245,158,11,0.35)",
        }}
      >
        ⚠ Flagged
      </span>
    );
  }

  return (
    <span
      style={{
        ...badge,
        background:
          "rgba(34,197,94,0.12)",
        border:
          "1px solid rgba(34,197,94,0.30)",
      }}
    >
      ✓ Clear
    </span>
  );
}

// ==================================================
// STYLES
// ==================================================

const header = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 24,
};

const eyebrow = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 1.5,
  opacity: 0.6,
  margin: 0,
};

const refreshButton = {
  border:
    "1px solid var(--border)",
  background:
    "var(--surface)",
  color: "var(--text)",
  padding:
    "11px 18px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const errorBox = {
  padding: 16,
  borderRadius: 12,
  marginBottom: 20,
  background:
    "rgba(239,68,68,0.12)",
  border:
    "1px solid rgba(239,68,68,0.35)",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
  marginBottom: 22,
};

const statCard = {
  padding: 20,
  borderRadius: 14,
};

const controlCard = {
  padding: 20,
  borderRadius: 16,
  marginBottom: 28,
};

const searchRow = {
  display: "flex",
  width: "100%",
};

const searchInput = {
  width: "100%",
  padding:
    "13px 15px",
  borderRadius: 10,
  border:
    "1px solid var(--border)",
  background:
    "var(--surface)",
  color: "var(--text)",
  outline: "none",
};

const filterRow = {
  display: "flex",
  gap: 10,
  flexWrap:
    "wrap" as const,
  marginTop: 14,
};

const filterButton = {
  padding:
    "9px 14px",
  borderRadius: 999,
  cursor: "pointer",
  fontWeight: 700,
};

const resultsHeader = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  marginBottom: 14,
};

const conversationList = {
  display: "grid",
  gap: 16,
};

const conversationCard = {
  padding: 22,
  borderRadius: 16,
};

const conversationTop = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
  gap: 20,
};

const peopleGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 18,
  marginTop: 22,
};

const smallLabel = {
  display: "block",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1,
  opacity: 0.55,
  marginBottom: 5,
};

const messagePreview = {
  padding: 15,
  borderRadius: 12,
  marginTop: 20,
  background:
    "rgba(148,163,184,0.07)",
  border:
    "1px solid var(--border)",
};

const flagSummary = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  flexWrap:
    "wrap" as const,
  marginTop: 15,
  padding: 13,
  borderRadius: 10,
  background:
    "rgba(245,158,11,0.08)",
};

const actionRow = {
  display: "flex",
  justifyContent:
    "flex-end",
  marginTop: 18,
};

const viewButton = {
  display:
    "inline-block",
  padding:
    "11px 17px",
  borderRadius: 10,
  background:
    "#2563eb",
  color: "white",
  textDecoration:
    "none",
  fontWeight: 800,
};

const badge = {
  padding:
    "7px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  whiteSpace:
    "nowrap" as const,
};

const emptyCard = {
  padding: 40,
  borderRadius: 16,
  textAlign:
    "center" as const,
};

const privacyNote = {
  fontSize: 12,
  opacity: 0.55,
  marginTop: 24,
  paddingBottom: 20,
};