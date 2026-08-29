"use client";

import {
  useState,
} from "react";

import {
  supabase,
} from "@/app/lib/supabase";

type SenderType =
  | "support"
  | "billing"
  | "security";

type SendResult = {
  success?: boolean;
  message?: string;
  error?: string;
  emailId?: string | null;
};

export default function AdminEmailPage() {
  const [
    recipientUserId,
    setRecipientUserId,
  ] = useState("");

  const [
    recipientName,
    setRecipientName,
  ] = useState("");

  const [
    recipientEmail,
    setRecipientEmail,
  ] = useState("");

  const [
    senderType,
    setSenderType,
  ] = useState<SenderType>(
    "support"
  );

  const [
    subject,
    setSubject,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  async function sendEmail() {
    if (sending) {
      return;
    }

    setError("");
    setSuccess("");

    if (!recipientEmail.trim()) {
      setError(
        "Recipient email is required."
      );

      return;
    }

    if (!subject.trim()) {
      setError(
        "Subject is required."
      );

      return;
    }

    if (!message.trim()) {
      setError(
        "Message is required."
      );

      return;
    }

    setSending(true);

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
          "/api/admin/send-user-email",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${sessionData.session.access_token}`,
            },

            body:
              JSON.stringify({
                recipientUserId:
                  recipientUserId.trim() ||
                  undefined,

                recipientName:
                  recipientName.trim(),

                recipientEmail:
                  recipientEmail.trim(),

                senderType,

                subject:
                  subject.trim(),

                message:
                  message.trim(),
              }),
          }
        );

      const text =
        await response.text();

      let result:
        SendResult = {};

      try {
        result =
          text
            ? JSON.parse(text)
            : {};
      } catch {
        setError(
          `The server returned an invalid response (${response.status}).`
        );

        return;
      }

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.error ||
            "Unable to send email."
        );

        return;
      }

      setSuccess(
        result.message ||
          "Email sent successfully."
      );

      setSubject("");
      setMessage("");
    } catch (sendError) {
      console.error(
        "Admin email page error:",
        sendError
      );

      setError(
        "Unable to send email."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="contracts-page">

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
            Send User Email
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.7,
            }}
          >
            Send official Freelance
            Hub SA communication
            using an approved
            domain address.
          </p>
        </div>
      </section>

      {error && (
        <div style={errorBox}>
          {error}
        </div>
      )}

      {success && (
        <div style={successBox}>
          ✓ {success}
        </div>
      )}

      <section
        className="dark-card"
        style={formCard}
      >
        <div style={fieldGroup}>
          <label style={label}>
            Recipient Name
          </label>

          <input
            type="text"
            value={
              recipientName
            }
            onChange={(
              event
            ) =>
              setRecipientName(
                event.target.value
              )
            }
            placeholder="Client or freelancer name"
            style={input}
          />
        </div>

        <div style={fieldGroup}>
          <label style={label}>
            Recipient Email
          </label>

          <input
            type="email"
            value={
              recipientEmail
            }
            onChange={(
              event
            ) =>
              setRecipientEmail(
                event.target.value
              )
            }
            placeholder="user@example.com"
            style={input}
          />
        </div>

        <div style={fieldGroup}>
          <label style={label}>
            Recipient User ID
            <span style={optional}>
              {" "}Optional
            </span>
          </label>

          <input
            type="text"
            value={
              recipientUserId
            }
            onChange={(
              event
            ) =>
              setRecipientUserId(
                event.target.value
              )
            }
            placeholder="Supabase profile UUID"
            style={input}
          />

          <p style={helpText}>
            This is only used to
            connect the email log
            to a platform user.
          </p>
        </div>

        <div style={fieldGroup}>
          <label style={label}>
            From
          </label>

          <select
            value={
              senderType
            }
            onChange={(
              event
            ) =>
              setSenderType(
                event.target
                  .value as SenderType
              )
            }
            style={input}
          >
            <option value="support">
              Freelance Hub SA Support
              — support@freelancehubsa.co.za
            </option>

            <option value="billing">
              Freelance Hub SA Billing
              — billing@freelancehubsa.co.za
            </option>

            <option value="security">
              Freelance Hub SA Security
              — security@freelancehubsa.co.za
            </option>
          </select>
        </div>

        <div style={fieldGroup}>
          <label style={label}>
            Subject
          </label>

          <input
            type="text"
            value={
              subject
            }
            onChange={(
              event
            ) =>
              setSubject(
                event.target.value
              )
            }
            maxLength={200}
            placeholder="Email subject"
            style={input}
          />
        </div>

        <div style={fieldGroup}>
          <label style={label}>
            Message
          </label>

          <textarea
            value={
              message
            }
            onChange={(
              event
            ) =>
              setMessage(
                event.target.value
              )
            }
            rows={12}
            maxLength={20000}
            placeholder="Write your message..."
            style={textarea}
          />

          <div style={counter}>
            {message.length} / 20000
          </div>
        </div>

        <div style={senderPreview}>
          <span style={smallLabel}>
            SENDING AS
          </span>

          <strong>
            {senderType ===
            "support"
              ? "Freelance Hub SA Support <support@freelancehubsa.co.za>"
              : senderType ===
                "billing"
              ? "Freelance Hub SA Billing <billing@freelancehubsa.co.za>"
              : "Freelance Hub SA Security <security@freelancehubsa.co.za>"}
          </strong>
        </div>

        <div style={actionRow}>
          <button
            type="button"
            onClick={
              sendEmail
            }
            disabled={
              sending
            }
            style={{
              ...sendButton,

              opacity:
                sending
                  ? 0.6
                  : 1,

              cursor:
                sending
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {sending
              ? "Sending..."
              : "Send Email"}
          </button>
        </div>
      </section>

      <section style={notice}>
        <strong>
          🔒 Admin communication
        </strong>

        <p
          style={{
            margin:
              "7px 0 0",
          }}
        >
          Emails sent from this
          page are recorded in the
          admin email audit log.
          Use official platform
          addresses only for
          legitimate support,
          billing, security and
          account communication.
        </p>
      </section>
    </main>
  );
}

// ==================================================
// STYLES
// ==================================================

const header = {
  marginBottom: 24,
};

const eyebrow = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 1.5,
  opacity: 0.6,
  margin: 0,
};

const errorBox = {
  padding: 16,
  borderRadius: 12,
  marginBottom: 18,
  background:
    "rgba(239,68,68,0.12)",
  border:
    "1px solid rgba(239,68,68,0.35)",
};

const successBox = {
  padding: 16,
  borderRadius: 12,
  marginBottom: 18,
  background:
    "rgba(34,197,94,0.12)",
  border:
    "1px solid rgba(34,197,94,0.35)",
};

const formCard = {
  padding: 24,
  borderRadius: 16,
};

const fieldGroup = {
  marginBottom: 20,
};

const label = {
  display: "block",
  fontWeight: 800,
  marginBottom: 8,
};

const optional = {
  fontSize: 12,
  opacity: 0.55,
  fontWeight: 500,
};

const input = {
  width: "100%",
  padding:
    "12px 14px",
  borderRadius: 10,
  border:
    "1px solid var(--border)",
  background:
    "var(--surface)",
  color:
    "var(--text)",
  outline: "none",
  boxSizing:
    "border-box" as const,
};

const textarea = {
  ...input,
  minHeight: 220,
  resize:
    "vertical" as const,
  fontFamily: "inherit",
};

const helpText = {
  margin:
    "7px 0 0",
  fontSize: 12,
  opacity: 0.6,
};

const counter = {
  textAlign:
    "right" as const,
  fontSize: 12,
  opacity: 0.55,
  marginTop: 6,
};

const senderPreview = {
  padding: 15,
  borderRadius: 11,
  border:
    "1px solid var(--border)",
  background:
    "rgba(148,163,184,0.06)",
  marginTop: 5,
};

const smallLabel = {
  display: "block",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1,
  opacity: 0.55,
  marginBottom: 5,
};

const actionRow = {
  display: "flex",
  justifyContent:
    "flex-end",
  marginTop: 22,
};

const sendButton = {
  padding:
    "13px 22px",
  borderRadius: 10,
  border: "none",
  background:
    "#2563eb",
  color: "white",
  fontWeight: 800,
};

const notice = {
  marginTop: 20,
  marginBottom: 20,
  padding: 16,
  borderRadius: 12,
  border:
    "1px solid var(--border)",
  background:
    "rgba(148,163,184,0.06)",
  fontSize: 13,
};