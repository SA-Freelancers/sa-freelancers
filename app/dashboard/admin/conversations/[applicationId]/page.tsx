"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { supabase } from "@/app/lib/supabase";

type TimelineMessage = {
  type: "message";
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string | null;
  content: string;
  created_at: string;
};

type TimelineSafetyEvent = {
  type: "safety_event";
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string | null;
  content: string;
  event_type: string;
  risk_level: string;
  matched_value: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type TimelineItem =
  | TimelineMessage
  | TimelineSafetyEvent;

type Conversation = {
  application_id: string;
  application_status: string | null;

  job: {
    id: string;
    title: string;
    status: string | null;
  };

  client: {
    id: string | null;
    name: string;
  };

  freelancer: {
    id: string;
    name: string;
  };

  summary: {
    messages: number;
    safetyEvents: number;
    pendingSafetyEvents: number;
    highRiskEvents: number;
  };

  timeline: TimelineItem[];
};

type ApiResponse = {
  success?: boolean;
  conversation?: Conversation;
  error?: string;
};

export default function AdminConversationDetailPage() {
  const params = useParams();

  const applicationId =
    params.applicationId as string;

  const [
    conversation,
    setConversation,
  ] = useState<Conversation | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // ==================================================
  // LOAD CONVERSATION
  // ==================================================

  const loadConversation =
    useCallback(async () => {
      if (!applicationId) {
        return;
      }

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
            `/api/admin/conversations/${applicationId}`,
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
          !result.success ||
          !result.conversation
        ) {
          setError(
            result.error ||
              "Unable to load conversation."
          );

          return;
        }

        setConversation(
          result.conversation
        );
      } catch (loadError) {
        console.error(
          "Conversation detail loading error:",
          loadError
        );

        setError(
          "Unable to load conversation."
        );
      } finally {
        setLoading(false);
      }
    }, [applicationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // ==================================================
  // DATE
  // ==================================================

  function formatDate(
    value: string
  ) {
    return new Date(
      value
    ).toLocaleString(
      "en-ZA"
    );
  }

  // ==================================================
  // EVENT LABEL
  // ==================================================

  function eventLabel(
    value: string
  ) {
    switch (value) {
      case "email":
        return "Email Address";

      case "phone":
        return "Phone Number";

      case "whatsapp":
        return "WhatsApp";

      case "telegram":
        return "Telegram";

      case "social_media":
        return "Social Media";

      case "external_payment":
        return "Off-Platform Payment";

      case "bank_details":
        return "Bank Details";

      case "suspicious_link":
        return "Suspicious Link";

      default:
        return value
          .replaceAll("_", " ")
          .replace(
            /\b\w/g,
            (character) =>
              character.toUpperCase()
          );
    }
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="contracts-page">
        <h1>
          Conversation Review
        </h1>

        <p>
          Loading conversation...
        </p>
      </main>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (
    error ||
    !conversation
  ) {
    return (
      <main className="contracts-page">
        <Link
          href="/dashboard/admin/conversations"
          style={backLink}
        >
          ← Back to Conversations
        </Link>

        <div style={errorBox}>
          {error ||
            "Conversation not found."}
        </div>
      </main>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="contracts-page">

      {/* BACK */}

      <Link
        href="/dashboard/admin/conversations"
        style={backLink}
      >
        ← Back to Conversations
      </Link>

      {/* HEADER */}

      <section style={header}>
        <div>
          <p style={eyebrow}>
            ADMINISTRATION
          </p>

          <h1
            style={{
              margin:
                "4px 0 8px",
            }}
          >
            Conversation Review
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.7,
            }}
          >
            Read-only moderation
            view for safety,
            support and dispute
            investigation.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadConversation
          }
          style={refreshButton}
        >
          ↻ Refresh
        </button>
      </section>

      {/* JOB */}

      <section
        className="dark-card"
        style={jobCard}
      >
        <div>
          <span style={smallLabel}>
            JOB
          </span>

          <h2
            style={{
              margin:
                "4px 0 0",
            }}
          >
            {conversation.job.title}
          </h2>
        </div>

        <div style={jobStatusArea}>
          <StatusPill
            value={
              conversation.job.status ||
              "Unknown"
            }
          />

          <StatusPill
            value={
              conversation.application_status ||
              "Unknown"
            }
          />
        </div>
      </section>

      {/* PARTICIPANTS */}

      <section style={participantGrid}>
        <div
          className="dark-card"
          style={participantCard}
        >
          <span style={smallLabel}>
            CLIENT
          </span>

          <h3>
            {conversation.client.name}
          </h3>

          <p style={mutedText}>
            Client participant
          </p>
        </div>

        <div
          className="dark-card"
          style={participantCard}
        >
          <span style={smallLabel}>
            FREELANCER
          </span>

          <h3>
            {conversation.freelancer.name}
          </h3>

          <p style={mutedText}>
            Freelancer participant
          </p>
        </div>
      </section>

      {/* SUMMARY */}

      <section style={summaryGrid}>
        <SummaryCard
          title="Messages"
          value={
            conversation.summary.messages
          }
        />

        <SummaryCard
          title="Safety Events"
          value={
            conversation.summary.safetyEvents
          }
        />

        <SummaryCard
          title="Pending Review"
          value={
            conversation.summary.pendingSafetyEvents
          }
        />

        <SummaryCard
          title="High Risk"
          value={
            conversation.summary.highRiskEvents
          }
        />
      </section>

      {/* TIMELINE HEADER */}

      <div style={timelineHeader}>
        <div>
          <h2
            style={{
              margin:
                "0 0 5px",
            }}
          >
            Conversation Timeline
          </h2>

          <p
            style={{
              margin: 0,
              opacity: 0.65,
            }}
          >
            Successful messages
            and blocked safety
            attempts are shown
            chronologically.
          </p>
        </div>

        {conversation.summary
          .pendingSafetyEvents >
          0 && (
          <span style={pendingBadge}>
            ⚠{" "}
            {
              conversation.summary
                .pendingSafetyEvents
            }{" "}
            pending
          </span>
        )}
      </div>

      {/* EMPTY */}

      {conversation.timeline.length ===
        0 && (
        <div
          className="dark-card"
          style={emptyCard}
        >
          <h3>
            No activity
          </h3>

          <p>
            This conversation
            does not contain any
            messages or safety
            events.
          </p>
        </div>
      )}

      {/* TIMELINE */}

      <section style={timelineList}>
        {conversation.timeline.map(
          (item) => {
            if (
              item.type ===
              "safety_event"
            ) {
              return (
                <SafetyEventCard
                  key={`safety-${item.id}`}
                  event={item}
                  formatDate={
                    formatDate
                  }
                  eventLabel={
                    eventLabel
                  }
                />
              );
            }

            return (
              <MessageCard
                key={`message-${item.id}`}
                message={item}
                clientId={
                  conversation.client.id
                }
                formatDate={
                  formatDate
                }
              />
            );
          }
        )}
      </section>

      {/* ADMIN NOTICE */}

      <section
        style={adminNotice}
      >
        <strong>
          🔒 Administrator privacy notice
        </strong>

        <p
          style={{
            margin:
              "7px 0 0",
          }}
        >
          Conversation access
          should only be used for
          fraud prevention,
          platform safety,
          customer support,
          dispute resolution and
          policy enforcement.
          This view does not allow
          administrators to edit
          user messages.
        </p>
      </section>
    </main>
  );
}

// ==================================================
// MESSAGE CARD
// ==================================================

function MessageCard({
  message,
  clientId,
  formatDate,
}: {
  message: TimelineMessage;
  clientId: string | null;
  formatDate: (
    value: string
  ) => string;
}) {
  const isClient =
    message.sender_id ===
    clientId;

  return (
    <article
      className="dark-card"
      style={messageCard}
    >
      <div style={itemHeader}>
        <div>
          <span style={smallLabel}>
            {isClient
              ? "CLIENT"
              : "FREELANCER"}
          </span>

          <strong>
            {message.sender_name}
          </strong>
        </div>

        <span style={sentBadge}>
          ✓ Sent
        </span>
      </div>

      <div style={messageContent}>
        {message.content}
      </div>

      <p style={dateText}>
        {formatDate(
          message.created_at
        )}
      </p>
    </article>
  );
}

// ==================================================
// SAFETY EVENT CARD
// ==================================================

function SafetyEventCard({
  event,
  formatDate,
  eventLabel,
}: {
  event: TimelineSafetyEvent;

  formatDate: (
    value: string
  ) => string;

  eventLabel: (
    value: string
  ) => string;
}) {
  const critical =
    event.risk_level ===
    "critical";

  const high =
    event.risk_level ===
      "high" ||
    critical;

  return (
    <article
      style={{
        ...safetyCard,

        border:
          critical
            ? "1px solid rgba(239,68,68,0.65)"
            : high
            ? "1px solid rgba(245,158,11,0.55)"
            : "1px solid rgba(245,158,11,0.35)",

        background:
          critical
            ? "rgba(239,68,68,0.08)"
            : "rgba(245,158,11,0.08)",
      }}
    >
      <div style={itemHeader}>
        <div>
          <span style={smallLabel}>
            BLOCKED SAFETY ATTEMPT
          </span>

          <strong>
            ⚠ {event.sender_name}
          </strong>
        </div>

        <RiskBadge
          risk={
            event.risk_level
          }
        />
      </div>

      <div style={safetyDetails}>
        <Detail
          label="Detected"
          value={eventLabel(
            event.event_type
          )}
        />

        <Detail
          label="Status"
          value={
            event.status
          }
        />

        {event.matched_value && (
          <Detail
            label="Matched"
            value={
              event.matched_value
            }
          />
        )}
      </div>

      <div style={attemptedMessage}>
        <span style={smallLabel}>
          ATTEMPTED MESSAGE
        </span>

        <p
          style={{
            margin:
              "7px 0 0",
            whiteSpace:
              "pre-wrap",
            wordBreak:
              "break-word",
          }}
        >
          {event.content}
        </p>
      </div>

      <p style={dateText}>
        Blocked on{" "}
        {formatDate(
          event.created_at
        )}
      </p>
    </article>
  );
}

// ==================================================
// SMALL COMPONENTS
// ==================================================

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      className="dark-card"
      style={summaryCard}
    >
      <span style={mutedText}>
        {title}
      </span>

      <strong style={summaryNumber}>
        {value}
      </strong>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span style={smallLabel}>
        {label}
      </span>

      <strong
        style={{
          wordBreak:
            "break-word",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function RiskBadge({
  risk,
}: {
  risk: string;
}) {
  const normalized =
    risk.toLowerCase();

  let background =
    "rgba(245,158,11,0.15)";

  let border =
    "1px solid rgba(245,158,11,0.4)";

  if (
    normalized ===
    "critical"
  ) {
    background =
      "rgba(239,68,68,0.18)";

    border =
      "1px solid rgba(239,68,68,0.5)";
  }

  return (
    <span
      style={{
        ...riskBadge,
        background,
        border,
      }}
    >
      {normalized ===
      "critical"
        ? "🔴"
        : "⚠"}{" "}
      {risk.toUpperCase()}
    </span>
  );
}

function StatusPill({
  value,
}: {
  value: string;
}) {
  return (
    <span style={statusPill}>
      {value}
    </span>
  );
}

// ==================================================
// STYLES
// ==================================================

const backLink = {
  display: "inline-block",
  marginBottom: 20,
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 800,
};

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
  padding: 18,
  borderRadius: 12,
  background:
    "rgba(239,68,68,0.12)",
  border:
    "1px solid rgba(239,68,68,0.35)",
};

const jobCard = {
  padding: 22,
  borderRadius: 16,
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 16,
};

const jobStatusArea = {
  display: "flex",
  gap: 8,
  flexWrap:
    "wrap" as const,
};

const statusPill = {
  display: "inline-block",
  padding:
    "7px 11px",
  borderRadius: 999,
  border:
    "1px solid var(--border)",
  fontSize: 12,
  fontWeight: 800,
};

const participantGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 15,
  marginBottom: 16,
};

const participantCard = {
  padding: 20,
  borderRadius: 15,
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 14,
  marginBottom: 30,
};

const summaryCard = {
  padding: 18,
  borderRadius: 14,
};

const summaryNumber = {
  display: "block",
  fontSize: 28,
  marginTop: 8,
};

const timelineHeader = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 15,
};

const pendingBadge = {
  display: "inline-block",
  padding:
    "8px 12px",
  borderRadius: 999,
  background:
    "rgba(245,158,11,0.12)",
  border:
    "1px solid rgba(245,158,11,0.35)",
  fontWeight: 800,
  whiteSpace:
    "nowrap" as const,
};

const timelineList = {
  display: "grid",
  gap: 15,
};

const messageCard = {
  padding: 20,
  borderRadius: 15,
};

const safetyCard = {
  padding: 20,
  borderRadius: 15,
};

const itemHeader = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
  gap: 15,
};

const messageContent = {
  marginTop: 16,
  padding: 15,
  borderRadius: 11,
  background:
    "rgba(148,163,184,0.07)",
  border:
    "1px solid var(--border)",
  whiteSpace:
    "pre-wrap" as const,
  wordBreak:
    "break-word" as const,
};

const attemptedMessage = {
  marginTop: 17,
  padding: 15,
  borderRadius: 11,
  background:
    "rgba(15,23,42,0.12)",
};

const safetyDetails = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 15,
  marginTop: 18,
};

const smallLabel = {
  display: "block",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1,
  opacity: 0.55,
  marginBottom: 5,
};

const mutedText = {
  opacity: 0.65,
};

const dateText = {
  margin:
    "12px 0 0",
  fontSize: 12,
  opacity: 0.55,
};

const sentBadge = {
  padding:
    "6px 10px",
  borderRadius: 999,
  background:
    "rgba(34,197,94,0.12)",
  border:
    "1px solid rgba(34,197,94,0.3)",
  fontSize: 12,
  fontWeight: 800,
};

const riskBadge = {
  padding:
    "7px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const emptyCard = {
  padding: 40,
  borderRadius: 16,
  textAlign:
    "center" as const,
};

const adminNotice = {
  marginTop: 25,
  marginBottom: 20,
  padding: 17,
  borderRadius: 12,
  border:
    "1px solid var(--border)",
  background:
    "rgba(148,163,184,0.06)",
  fontSize: 13,
};