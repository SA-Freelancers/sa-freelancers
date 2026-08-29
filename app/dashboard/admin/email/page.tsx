"use client";

import {
  useEffect,
  useRef,
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

type EmailUser = {
  id: string;
  fullName: string;
  role: string;
  email: string;
};

type UserSearchResult = {
  success?: boolean;
  users?: EmailUser[];
  error?: string;
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
    recipientSearch,
    setRecipientSearch,
  ] = useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState<EmailUser[]>([]);

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

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

  const searchRequestRef =
    useRef(0);

  useEffect(() => {
    const query =
      recipientSearch.trim();

    if (
      query.length < 2 ||
      recipientUserId
    ) {
      setSearchResults([]);
      setSearchOpen(false);
      setSearching(false);
      return;
    }

    const requestId =
      ++searchRequestRef.current;

    const timeout =
      window.setTimeout(
        async () => {
          setSearching(true);

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
              if (
                requestId ===
                searchRequestRef.current
              ) {
                setError(
                  "Please login again."
                );
              }

              return;
            }

            const response =
              await fetch(
                `/api/admin/email-users?q=${encodeURIComponent(
                  query
                )}`,
                {
                  method: "GET",

                  headers: {
                    Authorization:
                      `Bearer ${sessionData.session.access_token}`,
                  },
                }
              );

            const text =
              await response.text();

            let result:
              UserSearchResult = {};

            try {
              result =
                text
                  ? JSON.parse(text)
                  : {};
            } catch {
              if (
                requestId ===
                searchRequestRef.current
              ) {
                setError(
                  `The server returned an invalid response (${response.status}).`
                );
              }

              return;
            }

            if (
              requestId !==
              searchRequestRef.current
            ) {
              return;
            }

            if (
              !response.ok ||
              !result.success
            ) {
              setSearchResults([]);

              setError(
                result.error ||
                  "Unable to search users."
              );

              return;
            }

            setSearchResults(
              result.users || []
            );

            setSearchOpen(true);
          } catch (searchError) {
            console.error(
              "Admin email user search error:",
              searchError
            );

            if (
              requestId ===
              searchRequestRef.current
            ) {
              setError(
                "Unable to search users."
              );

              setSearchResults([]);
            }
          } finally {
            if (
              requestId ===
              searchRequestRef.current
            ) {
              setSearching(false);
            }
          }
        },
        350
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    recipientSearch,
    recipientUserId,
  ]);

  function selectRecipient(
    user: EmailUser
  ) {
    setRecipientUserId(
      user.id
    );

    setRecipientName(
      user.fullName
    );

    setRecipientEmail(
      user.email
    );

    setRecipientSearch(
      user.fullName
    );

    setSearchResults([]);
    setSearchOpen(false);
    setError("");
  }

  function clearRecipient() {
    setRecipientUserId("");
    setRecipientName("");
    setRecipientEmail("");
    setRecipientSearch("");
    setSearchResults([]);
    setSearchOpen(false);

    searchRequestRef.current += 1;
  }

  function roleLabel(
    role: string
  ) {
    const normalized =
      role
        .trim()
        .toLowerCase();

    if (
      normalized ===
      "freelancer"
    ) {
      return "Freelancer";
    }

    if (
      normalized ===
      "client"
    ) {
      return "Client";
    }

    return role || "User";
  }

  function maskEmail(
    email: string
  ) {
    const parts =
      email.split("@");

    if (
      parts.length !== 2
    ) {
      return email;
    }

    const [
      local,
      domain,
    ] = parts;

    if (
      local.length <= 3
    ) {
      return `${local}***@${domain}`;
    }

    return `${local.slice(
      0,
      3
    )}••••@${domain}`;
  }

  async function sendEmail() {
    if (sending) {
      return;
    }

    setError("");
    setSuccess("");

    if (!recipientEmail.trim()) {
      setError(
        "Please select a recipient."
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
            Search for a client
            or freelancer and send
            official Freelance Hub
            SA communication using
            an approved domain
            address.
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
            Recipient
          </label>

          {!recipientUserId ? (
            <div
              style={{
                position:
                  "relative",
              }}
            >
              <input
                type="text"
                value={
                  recipientSearch
                }
                onChange={(
                  event
                ) => {
                  setRecipientSearch(
                    event.target.value
                  );

                  setRecipientUserId(
                    ""
                  );

                  setRecipientName(
                    ""
                  );

                  setRecipientEmail(
                    ""
                  );

                  setError("");
                }}
                onFocus={() => {
                  if (
                    searchResults.length >
                    0
                  ) {
                    setSearchOpen(
                      true
                    );
                  }
                }}
                placeholder="Search client or freelancer..."
                autoComplete="off"
                style={input}
              />

              {searching && (
                <div
                  style={
                    searchStatus
                  }
                >
                  Searching...
                </div>
              )}

              {searchOpen && (
                <div
                  style={
                    resultsBox
                  }
                >
                  {searchResults.length >
                  0 ? (
                    searchResults.map(
                      (user) => (
                        <button
                          key={
                            user.id
                          }
                          type="button"
                          onClick={() =>
                            selectRecipient(
                              user
                            )
                          }
                          style={
                            resultButton
                          }
                        >
                          <div
                            style={
                              resultTopRow
                            }
                          >
                            <strong>
                              {
                                user.fullName
                              }
                            </strong>

                            <span
                              style={
                                roleBadge
                              }
                            >
                              {roleLabel(
                                user.role
                              )}
                            </span>
                          </div>

                          <div
                            style={
                              resultEmail
                            }
                          >
                            {maskEmail(
                              user.email
                            )}
                          </div>
                        </button>
                      )
                    )
                  ) : (
                    <div
                      style={
                        emptyResult
                      }
                    >
                      No matching
                      users found.
                    </div>
                  )}
                </div>
              )}

              <p
                style={helpText}
              >
                Type at least two
                letters from the
                user's name, email
                address or role.
              </p>
            </div>
          ) : (
            <div
              style={
                selectedRecipient
              }
            >
              <div>
                <span
                  style={
                    smallLabel
                  }
                >
                  SELECTED USER
                </span>

                <div
                  style={
                    selectedNameRow
                  }
                >
                  <strong
                    style={{
                      fontSize: 16,
                    }}
                  >
                    {
                      recipientName
                    }
                  </strong>

                  <span
                    style={
                      selectedBadge
                    }
                  >
                    Selected
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 5,
                    opacity: 0.72,
                    fontSize: 13,
                  }}
                >
                  {
                    recipientEmail
                  }
                </div>
              </div>

              <button
                type="button"
                onClick={
                  clearRecipient
                }
                style={
                  clearButton
                }
              >
                Change
              </button>
            </div>
          )}
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
              sending ||
              !recipientUserId
            }
            style={{
              ...sendButton,

              opacity:
                sending ||
                !recipientUserId
                  ? 0.6
                  : 1,

              cursor:
                sending ||
                !recipientUserId
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

const searchStatus = {
  position:
    "absolute" as const,
  right: 14,
  top: 13,
  fontSize: 12,
  opacity: 0.6,
};

const resultsBox = {
  position:
    "absolute" as const,
  zIndex: 30,
  left: 0,
  right: 0,
  top: 49,
  maxHeight: 320,
  overflowY:
    "auto" as const,
  borderRadius: 12,
  border:
    "1px solid var(--border)",
  background:
    "var(--surface)",
  boxShadow:
    "0 18px 50px rgba(0,0,0,0.28)",
};

const resultButton = {
  width: "100%",
  border: "none",
  borderBottom:
    "1px solid var(--border)",
  background:
    "transparent",
  color:
    "var(--text)",
  padding:
    "13px 14px",
  textAlign:
    "left" as const,
  cursor: "pointer",
};

const resultTopRow = {
  display: "flex",
  alignItems: "center",
  justifyContent:
    "space-between",
  gap: 12,
};

const roleBadge = {
  fontSize: 11,
  fontWeight: 800,
  padding:
    "4px 8px",
  borderRadius: 999,
  background:
    "rgba(37,99,235,0.12)",
  border:
    "1px solid rgba(37,99,235,0.25)",
};

const resultEmail = {
  marginTop: 5,
  fontSize: 12,
  opacity: 0.65,
};

const emptyResult = {
  padding: 16,
  fontSize: 13,
  opacity: 0.65,
};

const selectedRecipient = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 16,
  padding: 16,
  borderRadius: 12,
  border:
    "1px solid rgba(34,197,94,0.35)",
  background:
    "rgba(34,197,94,0.07)",
};

const selectedNameRow = {
  display: "flex",
  alignItems: "center",
  flexWrap:
    "wrap" as const,
  gap: 8,
};

const selectedBadge = {
  fontSize: 11,
  fontWeight: 800,
  padding:
    "4px 8px",
  borderRadius: 999,
  background:
    "rgba(34,197,94,0.15)",
  border:
    "1px solid rgba(34,197,94,0.28)",
};

const clearButton = {
  padding:
    "8px 12px",
  borderRadius: 8,
  border:
    "1px solid var(--border)",
  background:
    "transparent",
  color:
    "var(--text)",
  fontWeight: 700,
  cursor: "pointer",
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