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

// ==================================================
// TYPES
// ==================================================

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

type EmailStatus =
  | "all"
  | "sent"
  | "delivered"
  | "bounced"
  | "failed";

type EmailHistoryItem = {
  id: string;

  recipientUserId:
    | string
    | null;

  recipientEmail:
    string;

  recipientName:
    string | null;

  senderEmail:
    string;

  subject:
    string;

  message:
    string;

  sentBy:
    | string
    | null;

  sentByName:
    string;

  providerMessageId:
    | string
    | null;

  status:
    string;

  errorMessage:
    | string
    | null;

  createdAt:
    string;

  deliveredAt:
    | string
    | null;

  bouncedAt:
    | string
    | null;

  failedAt:
    | string
    | null;

  providerEvent:
    | string
    | null;

  providerEventId:
    | string
    | null;
};

type EmailHistoryResult = {
  success?: boolean;

  history?:
    EmailHistoryItem[];

  error?: string;
};

// ==================================================
// PAGE
// ==================================================

export default function AdminEmailPage() {
  // ==================================================
  // RECIPIENT
  // ==================================================

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
  ] =
    useState<EmailUser[]>(
      []
    );

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  // ==================================================
  // EMAIL FORM
  // ==================================================

  const [
    senderType,
    setSenderType,
  ] =
    useState<SenderType>(
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

  // ==================================================
  // EMAIL HISTORY
  // ==================================================

  const [
    emailHistory,
    setEmailHistory,
  ] =
    useState<
      EmailHistoryItem[]
    >([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  const [
    historySearch,
    setHistorySearch,
  ] = useState("");

  const [
    historyStatus,
    setHistoryStatus,
  ] =
    useState<EmailStatus>(
      "all"
    );

  const [
    selectedEmail,
    setSelectedEmail,
  ] =
    useState<
      EmailHistoryItem | null
    >(null);

  const searchRequestRef =
    useRef(0);

  // ==================================================
  // RECIPIENT SEARCH
  // ==================================================

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
              data:
                sessionData,
              error:
                sessionError,
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
                  method:
                    "GET",

                  headers: {
                    Authorization:
                      `Bearer ${sessionData.session.access_token}`,
                  },
                }
              );

            const text =
              await response.text();

            let result:
              UserSearchResult =
                {};

            try {
              result =
                text
                  ? JSON.parse(
                      text
                    )
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
              setSearchResults(
                []
              );

              setError(
                result.error ||
                  "Unable to search users."
              );

              return;
            }

            setSearchResults(
              result.users ||
                []
            );

            setSearchOpen(
              true
            );
          } catch (
            searchError
          ) {
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

              setSearchResults(
                []
              );
            }
          } finally {
            if (
              requestId ===
              searchRequestRef.current
            ) {
              setSearching(
                false
              );
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

  // ==================================================
  // LOAD EMAIL HISTORY
  // ==================================================

  const loadEmailHistory =
    useCallback(
      async () => {
        setHistoryLoading(
          true
        );

        setHistoryError("");

        try {
          const {
            data:
              sessionData,
            error:
              sessionError,
          } =
            await supabase.auth.getSession();

          if (
            sessionError ||
            !sessionData.session
          ) {
            setHistoryError(
              "Please login again."
            );

            return;
          }

          const params =
            new URLSearchParams();

          if (
            historySearch.trim()
          ) {
            params.set(
              "search",
              historySearch.trim()
            );
          }

          params.set(
            "status",
            historyStatus
          );

          params.set(
            "limit",
            "50"
          );

          const response =
            await fetch(
              `/api/admin/email-history?${params.toString()}`,
              {
                method:
                  "GET",

                headers: {
                  Authorization:
                    `Bearer ${sessionData.session.access_token}`,
                },

                cache:
                  "no-store",
              }
            );

          const text =
            await response.text();

          let result:
            EmailHistoryResult =
              {};

          try {
            result =
              text
                ? JSON.parse(
                    text
                  )
                : {};
          } catch {
            setHistoryError(
              `The server returned an invalid response (${response.status}).`
            );

            return;
          }

          if (
            !response.ok ||
            !result.success
          ) {
            setHistoryError(
              result.error ||
                "Unable to load email history."
            );

            setEmailHistory(
              []
            );

            return;
          }

          setEmailHistory(
            result.history ||
              []
          );
        } catch (
          loadError
        ) {
          console.error(
            "Admin email history page error:",
            loadError
          );

          setHistoryError(
            "Unable to load email history."
          );
        } finally {
          setHistoryLoading(
            false
          );
        }
      },
      [
        historySearch,
        historyStatus,
      ]
    );

  // ==================================================
  // INITIAL HISTORY LOAD
  // ==================================================

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          void loadEmailHistory();
        },
        historySearch
          ? 350
          : 0
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    loadEmailHistory,
    historySearch,
    historyStatus,
  ]);

  // ==================================================
  // SELECT RECIPIENT
  // ==================================================

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

    setSearchOpen(
      false
    );

    setError("");
  }

  // ==================================================
  // CLEAR RECIPIENT
  // ==================================================

  function clearRecipient() {
    setRecipientUserId("");

    setRecipientName("");

    setRecipientEmail("");

    setRecipientSearch("");

    setSearchResults([]);

    setSearchOpen(
      false
    );

    searchRequestRef.current +=
      1;
  }

  // ==================================================
  // ROLE LABEL
  // ==================================================

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

    return (
      role ||
      "User"
    );
  }

  // ==================================================
  // MASK EMAIL
  // ==================================================

  function maskEmail(
    email: string
  ) {
    const parts =
      email.split("@");

    if (
      parts.length !==
      2
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

  // ==================================================
  // SEND EMAIL
  // ==================================================

  async function sendEmail() {
    if (sending) {
      return;
    }

    setError("");

    setSuccess("");

    if (
      !recipientEmail.trim()
    ) {
      setError(
        "Please select a recipient."
      );

      return;
    }

    if (
      !subject.trim()
    ) {
      setError(
        "Subject is required."
      );

      return;
    }

    if (
      !message.trim()
    ) {
      setError(
        "Message is required."
      );

      return;
    }

    setSending(true);

    try {
      const {
        data:
          sessionData,
        error:
          sessionError,
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
            method:
              "POST",

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
        SendResult =
          {};

      try {
        result =
          text
            ? JSON.parse(
                text
              )
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

      await loadEmailHistory();
    } catch (
      sendError
    ) {
      console.error(
        "Admin email page error:",
        sendError
      );

      setError(
        "Unable to send email."
      );
    } finally {
      setSending(
        false
      );
    }
  }

  // ==================================================
  // FORMAT DATE
  // ==================================================

  function formatDate(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "en-ZA",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    ).format(
      date
    );
  }

  // ==================================================
  // STATUS
  // ==================================================

  function statusLabel(
    status: string
  ) {
    switch (
      status
        .trim()
        .toLowerCase()
    ) {
      case "delivered":
        return "Delivered";

      case "bounced":
        return "Bounced";

      case "failed":
        return "Failed";

      case "sent":
        return "Sent";

      default:
        return (
          status ||
          "Unknown"
        );
    }
  }

  function getStatusStyle(
    status: string
  ) {
    const normalized =
      status
        .trim()
        .toLowerCase();

    if (
      normalized ===
      "delivered"
    ) {
      return {
        ...statusBadge,

        background:
          "rgba(34,197,94,0.12)",

        border:
          "1px solid rgba(34,197,94,0.35)",
      };
    }

    if (
      normalized ===
      "bounced"
    ) {
      return {
        ...statusBadge,

        background:
          "rgba(245,158,11,0.12)",

        border:
          "1px solid rgba(245,158,11,0.35)",
      };
    }

    if (
      normalized ===
      "failed"
    ) {
      return {
        ...statusBadge,

        background:
          "rgba(239,68,68,0.12)",

        border:
          "1px solid rgba(239,68,68,0.35)",
      };
    }

    return {
      ...statusBadge,

      background:
        "rgba(37,99,235,0.12)",

      border:
        "1px solid rgba(37,99,235,0.30)",
    };
  }

  // ==================================================
  // SENDER DISPLAY
  // ==================================================

  function senderDisplay(
    email: string
  ) {
    if (
      email ===
      "support@freelancehubsa.co.za"
    ) {
      return "Support";
    }

    if (
      email ===
      "billing@freelancehubsa.co.za"
    ) {
      return "Billing";
    }

    if (
      email ===
      "security@freelancehubsa.co.za"
    ) {
      return "Security";
    }

    return email;
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <main className="contracts-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <section
        style={
          header
        }
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
            Send User Email
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.7,
            }}
          >
            Search for a
            client or
            freelancer and
            send official
            Freelance Hub SA
            communication
            using an approved
            domain address.
          </p>
        </div>
      </section>

      {/* ==================================================
          MESSAGES
      ================================================== */}

      {error && (
        <div
          style={
            errorBox
          }
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={
            successBox
          }
        >
          ✓ {success}
        </div>
      )}

      {/* ==================================================
          SEND EMAIL FORM
      ================================================== */}

      <section
        className="dark-card"
        style={
          formCard
        }
      >
        {/* RECIPIENT */}

        <div
          style={
            fieldGroup
          }
        >
          <label
            style={
              label
            }
          >
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
                    event
                      .target
                      .value
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
                style={
                  input
                }
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
                      (
                        user
                      ) => (
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
                      No
                      matching
                      users
                      found.
                    </div>
                  )}
                </div>
              )}

              <p
                style={
                  helpText
                }
              >
                Type at least
                two letters
                from the
                user&apos;s
                name, email
                address or
                role.
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
                      fontSize:
                        16,
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
                    marginTop:
                      5,

                    opacity:
                      0.72,

                    fontSize:
                      13,
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

        {/* FROM */}

        <div
          style={
            fieldGroup
          }
        >
          <label
            style={
              label
            }
          >
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
                event
                  .target
                  .value as SenderType
              )
            }
            style={
              input
            }
          >
            <option
              value="support"
            >
              Freelance Hub
              SA Support —
              support@freelancehubsa.co.za
            </option>

            <option
              value="billing"
            >
              Freelance Hub
              SA Billing —
              billing@freelancehubsa.co.za
            </option>

            <option
              value="security"
            >
              Freelance Hub
              SA Security —
              security@freelancehubsa.co.za
            </option>
          </select>
        </div>

        {/* SUBJECT */}

        <div
          style={
            fieldGroup
          }
        >
          <label
            style={
              label
            }
          >
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
                event
                  .target
                  .value
              )
            }
            maxLength={
              200
            }
            placeholder="Email subject"
            style={
              input
            }
          />
        </div>

        {/* MESSAGE */}

        <div
          style={
            fieldGroup
          }
        >
          <label
            style={
              label
            }
          >
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
                event
                  .target
                  .value
              )
            }
            rows={12}
            maxLength={
              20000
            }
            placeholder="Write your message..."
            style={
              textarea
            }
          />

          <div
            style={
              counter
            }
          >
            {
              message.length
            }{" "}
            / 20000
          </div>
        </div>

        {/* SENDER PREVIEW */}

        <div
          style={
            senderPreview
          }
        >
          <span
            style={
              smallLabel
            }
          >
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

        {/* SEND BUTTON */}

        <div
          style={
            actionRow
          }
        >
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

      {/* ==================================================
          NOTICE
      ================================================== */}

      <section
        style={
          notice
        }
      >
        <strong>
          🔒 Admin
          communication
        </strong>

        <p
          style={{
            margin:
              "7px 0 0",
          }}
        >
          Emails sent from
          this page are
          recorded in the
          admin email audit
          log. Use official
          platform addresses
          only for legitimate
          support, billing,
          security and account
          communication.
        </p>
      </section>

      {/* ==================================================
          EMAIL HISTORY
      ================================================== */}

      <section
        style={
          historySection
        }
      >
        <div
          style={
            historyHeader
          }
        >
          <div>
            <p
              style={
                eyebrow
              }
            >
              AUDIT LOG
            </p>

            <h2
              style={{
                margin:
                  "4px 0 6px",
              }}
            >
              Email History
            </h2>

            <p
              style={{
                margin: 0,
                opacity:
                  0.65,

                fontSize:
                  14,
              }}
            >
              View sent
              emails and
              delivery
              status.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadEmailHistory()
            }
            disabled={
              historyLoading
            }
            style={{
              ...refreshButton,

              opacity:
                historyLoading
                  ? 0.6
                  : 1,
            }}
          >
            {historyLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* FILTERS */}

        <div
          style={
            historyFilters
          }
        >
          <input
            type="text"
            value={
              historySearch
            }
            onChange={(
              event
            ) =>
              setHistorySearch(
                event
                  .target
                  .value
              )
            }
            placeholder="Search recipient, email or subject..."
            style={{
              ...input,

              flex:
                "1 1 280px",
            }}
          />

          <select
            value={
              historyStatus
            }
            onChange={(
              event
            ) =>
              setHistoryStatus(
                event
                  .target
                  .value as EmailStatus
              )
            }
            style={{
              ...input,

              width:
                "auto",

              minWidth:
                160,
            }}
          >
            <option
              value="all"
            >
              All statuses
            </option>

            <option
              value="sent"
            >
              Sent
            </option>

            <option
              value="delivered"
            >
              Delivered
            </option>

            <option
              value="bounced"
            >
              Bounced
            </option>

            <option
              value="failed"
            >
              Failed
            </option>
          </select>
        </div>

        {/* HISTORY ERROR */}

        {historyError && (
          <div
            style={
              errorBox
            }
          >
            {
              historyError
            }
          </div>
        )}

        {/* HISTORY */}

        <div
          style={
            historyCard
          }
        >
          {historyLoading &&
          emailHistory.length ===
            0 ? (
            <div
              style={
                historyEmpty
              }
            >
              Loading email
              history...
            </div>
          ) : emailHistory.length ===
            0 ? (
            <div
              style={
                historyEmpty
              }
            >
              No email
              history found.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div
                style={
                  tableWrapper
                }
              >
                <table
                  style={
                    historyTable
                  }
                >
                  <thead>
                    <tr>
                      <th
                        style={
                          tableHeader
                        }
                      >
                        Recipient
                      </th>

                      <th
                        style={
                          tableHeader
                        }
                      >
                        From
                      </th>

                      <th
                        style={
                          tableHeader
                        }
                      >
                        Subject
                      </th>

                      <th
                        style={
                          tableHeader
                        }
                      >
                        Status
                      </th>

                      <th
                        style={
                          tableHeader
                        }
                      >
                        Sent
                      </th>

                      <th
                        style={
                          tableHeader
                        }
                      >
                        Sent by
                      </th>

                      <th
                        style={
                          tableHeader
                        }
                      >
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {emailHistory.map(
                      (
                        email
                      ) => (
                        <tr
                          key={
                            email.id
                          }
                        >
                          <td
                            style={
                              tableCell
                            }
                          >
                            <div
                              style={{
                                fontWeight:
                                  800,
                              }}
                            >
                              {email.recipientName ||
                                "Unnamed User"}
                            </div>

                            <div
                              style={
                                tableSubtext
                              }
                            >
                              {
                                email.recipientEmail
                              }
                            </div>
                          </td>

                          <td
                            style={
                              tableCell
                            }
                          >
                            {senderDisplay(
                              email.senderEmail
                            )}
                          </td>

                          <td
                            style={
                              tableCell
                            }
                          >
                            <div
                              style={
                                subjectCell
                              }
                            >
                              {
                                email.subject
                              }
                            </div>
                          </td>

                          <td
                            style={
                              tableCell
                            }
                          >
                            <span
                              style={getStatusStyle(
                                email.status
                              )}
                            >
                              {statusLabel(
                                email.status
                              )}
                            </span>
                          </td>

                          <td
                            style={
                              tableCell
                            }
                          >
                            <div>
                              {formatDate(
                                email.createdAt
                              )}
                            </div>
                          </td>

                          <td
                            style={
                              tableCell
                            }
                          >
                            {
                              email.sentByName
                            }
                          </td>

                          <td
                            style={
                              tableCell
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedEmail(
                                  email
                                )
                              }
                              style={
                                viewButton
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ==================================================
          EMAIL DETAIL MODAL
      ================================================== */}

      {selectedEmail && (
        <div
          style={
            modalOverlay
          }
          onClick={() =>
            setSelectedEmail(
              null
            )
          }
        >
          <div
            style={
              modalCard
            }
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div
              style={
                modalHeader
              }
            >
              <div>
                <p
                  style={
                    eyebrow
                  }
                >
                  EMAIL DETAILS
                </p>

                <h2
                  style={{
                    margin:
                      "4px 0 0",
                  }}
                >
                  {
                    selectedEmail.subject
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEmail(
                    null
                  )
                }
                style={
                  modalClose
                }
              >
                ✕
              </button>
            </div>

            <div
              style={
                detailGrid
              }
            >
              <DetailItem
                label="Recipient"
                value={
                  selectedEmail.recipientName ||
                  "Unnamed User"
                }
              />

              <DetailItem
                label="Recipient email"
                value={
                  selectedEmail.recipientEmail
                }
              />

              <DetailItem
                label="From"
                value={
                  selectedEmail.senderEmail
                }
              />

              <DetailItem
                label="Sent by"
                value={
                  selectedEmail.sentByName
                }
              />

              <DetailItem
                label="Status"
                value={statusLabel(
                  selectedEmail.status
                )}
              />

              <DetailItem
                label="Sent"
                value={formatDate(
                  selectedEmail.createdAt
                )}
              />

              <DetailItem
                label="Delivered"
                value={formatDate(
                  selectedEmail.deliveredAt
                )}
              />

              <DetailItem
                label="Bounced"
                value={formatDate(
                  selectedEmail.bouncedAt
                )}
              />

              <DetailItem
                label="Failed"
                value={formatDate(
                  selectedEmail.failedAt
                )}
              />

              <DetailItem
                label="Provider event"
                value={
                  selectedEmail.providerEvent ||
                  "—"
                }
              />
            </div>

            {selectedEmail.errorMessage && (
              <div
                style={
                  detailError
                }
              >
                <strong>
                  Delivery error
                </strong>

                <div
                  style={{
                    marginTop:
                      6,
                  }}
                >
                  {
                    selectedEmail.errorMessage
                  }
                </div>
              </div>
            )}

            <div
              style={
                messagePanel
              }
            >
              <span
                style={
                  smallLabel
                }
              >
                MESSAGE
              </span>

              <div
                style={
                  messageText
                }
              >
                {
                  selectedEmail.message
                }
              </div>
            </div>

            {selectedEmail.providerMessageId && (
              <div
                style={
                  providerInfo
                }
              >
                <span
                  style={
                    smallLabel
                  }
                >
                  PROVIDER
                  MESSAGE ID
                </span>

                <code
                  style={
                    codeText
                  }
                >
                  {
                    selectedEmail.providerMessageId
                  }
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ==================================================
// DETAIL ITEM
// ==================================================

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={
        detailItem
      }
    >
      <span
        style={
          detailLabel
        }
      >
        {label}
      </span>

      <strong
        style={{
          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
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

  fontFamily:
    "inherit",
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

  cursor:
    "pointer",
};

const resultTopRow = {
  display: "flex",

  alignItems:
    "center",

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

  alignItems:
    "center",

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

  alignItems:
    "center",

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

  cursor:
    "pointer",
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

  marginBottom: 28,

  padding: 16,

  borderRadius: 12,

  border:
    "1px solid var(--border)",

  background:
    "rgba(148,163,184,0.06)",

  fontSize: 13,
};

// ==================================================
// HISTORY STYLES
// ==================================================

const historySection = {
  marginTop: 30,

  marginBottom: 40,
};

const historyHeader = {
  display: "flex",

  justifyContent:
    "space-between",

  alignItems:
    "center",

  flexWrap:
    "wrap" as const,

  gap: 16,

  marginBottom: 18,
};

const refreshButton = {
  padding:
    "10px 15px",

  borderRadius: 9,

  border:
    "1px solid var(--border)",

  background:
    "var(--surface)",

  color:
    "var(--text)",

  fontWeight: 800,

  cursor:
    "pointer",
};

const historyFilters = {
  display: "flex",

  flexWrap:
    "wrap" as const,

  gap: 12,

  marginBottom: 16,
};

const historyCard = {
  border:
    "1px solid var(--border)",

  borderRadius: 14,

  overflow:
    "hidden",

  background:
    "var(--surface)",
};

const historyEmpty = {
  padding: 32,

  textAlign:
    "center" as const,

  opacity: 0.65,
};

const tableWrapper = {
  width: "100%",

  overflowX:
    "auto" as const,
};

const historyTable = {
  width: "100%",

  borderCollapse:
    "collapse" as const,

  minWidth: 980,
};

const tableHeader = {
  padding:
    "13px 14px",

  textAlign:
    "left" as const,

  fontSize: 12,

  opacity: 0.65,

  borderBottom:
    "1px solid var(--border)",

  background:
    "rgba(148,163,184,0.05)",

  whiteSpace:
    "nowrap" as const,
};

const tableCell = {
  padding:
    "14px",

  borderBottom:
    "1px solid var(--border)",

  verticalAlign:
    "top" as const,

  fontSize: 13,
};

const tableSubtext = {
  marginTop: 4,

  fontSize: 12,

  opacity: 0.6,
};

const subjectCell = {
  maxWidth: 260,

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace:
    "nowrap" as const,
};

const statusBadge = {
  display:
    "inline-block",

  padding:
    "5px 9px",

  borderRadius: 999,

  fontSize: 11,

  fontWeight: 800,

  whiteSpace:
    "nowrap" as const,
};

const viewButton = {
  padding:
    "7px 10px",

  borderRadius: 8,

  border:
    "1px solid var(--border)",

  background:
    "transparent",

  color:
    "var(--text)",

  fontWeight: 700,

  cursor:
    "pointer",
};

// ==================================================
// MODAL STYLES
// ==================================================

const modalOverlay = {
  position:
    "fixed" as const,

  inset: 0,

  zIndex: 1000,

  display: "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  padding: 20,

  background:
    "rgba(0,0,0,0.68)",

  backdropFilter:
    "blur(4px)",
};

const modalCard = {
  width: "100%",

  maxWidth: 760,

  maxHeight:
    "88vh",

  overflowY:
    "auto" as const,

  borderRadius: 16,

  border:
    "1px solid var(--border)",

  background:
    "var(--surface)",

  color:
    "var(--text)",

  padding: 24,

  boxShadow:
    "0 25px 80px rgba(0,0,0,0.45)",
};

const modalHeader = {
  display: "flex",

  alignItems:
    "flex-start",

  justifyContent:
    "space-between",

  gap: 16,

  marginBottom: 22,
};

const modalClose = {
  width: 36,

  height: 36,

  borderRadius: 9,

  border:
    "1px solid var(--border)",

  background:
    "transparent",

  color:
    "var(--text)",

  cursor:
    "pointer",

  fontWeight: 800,
};

const detailGrid = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",

  gap: 12,

  marginBottom: 20,
};

const detailItem = {
  padding: 13,

  borderRadius: 10,

  border:
    "1px solid var(--border)",

  background:
    "rgba(148,163,184,0.05)",
};

const detailLabel = {
  display: "block",

  fontSize: 11,

  fontWeight: 800,

  letterSpacing:
    0.6,

  opacity: 0.55,

  marginBottom: 5,
};

const detailError = {
  padding: 14,

  borderRadius: 10,

  background:
    "rgba(239,68,68,0.10)",

  border:
    "1px solid rgba(239,68,68,0.28)",

  marginBottom: 18,
};

const messagePanel = {
  padding: 16,

  borderRadius: 12,

  border:
    "1px solid var(--border)",

  background:
    "rgba(148,163,184,0.05)",

  marginBottom: 16,
};

const messageText = {
  whiteSpace:
    "pre-wrap" as const,

  overflowWrap:
    "anywhere" as const,

  lineHeight: 1.65,

  fontSize: 14,
};

const providerInfo = {
  padding: 14,

  borderRadius: 10,

  border:
    "1px solid var(--border)",

  background:
    "rgba(148,163,184,0.04)",
};

const codeText = {
  display: "block",

  overflowWrap:
    "anywhere" as const,

  fontSize: 12,

  opacity: 0.75,
};