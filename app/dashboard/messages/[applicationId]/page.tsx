"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import {
  supabase,
} from "@/app/lib/supabase";

type Message = {
  id: string;
  application_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type SendResponse = {
  success?: boolean;
  blocked?: boolean;
  eventType?: string;
  riskLevel?: string;
  error?: string;
  message?: Message;
};

export default function MessagesPage() {
  const params =
    useParams();

  const applicationId =
    params.applicationId as string;

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [
    newMessage,
    setNewMessage,
  ] = useState("");

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    safetyMessage,
    setSafetyMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  // --------------------------------------------------
  // LOAD MESSAGES
  // --------------------------------------------------

  const loadMessages =
    useCallback(
      async () => {
        if (
          !applicationId
        ) {
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "messages"
            )
            .select(
              `
              id,
              application_id,
              sender_id,
              content,
              created_at
              `
            )
            .eq(
              "application_id",
              applicationId
            )
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );

        if (error) {
          console.error(
            "Message loading error:",
            error
          );

          setErrorMessage(
            "Unable to load messages."
          );

          return;
        }

        setMessages(
          (data as Message[]) ||
            []
        );
      },
      [applicationId]
    );

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    async function initialize() {
      setLoading(true);

      const {
        data: {
          user,
        },
        error,
      } =
        await supabase.auth.getUser();

      if (
        error ||
        !user
      ) {
        setErrorMessage(
          "Please login again."
        );

        setLoading(false);

        return;
      }

      setCurrentUserId(
        user.id
      );

      await loadMessages();

      setLoading(false);
    }

    initialize();
  }, [
    applicationId,
    loadMessages,
  ]);

  // --------------------------------------------------
  // SEND MESSAGE THROUGH SECURE API
  // --------------------------------------------------

  const sendMessage =
    async () => {
      const content =
        newMessage.trim();

      if (
        !content ||
        sending
      ) {
        return;
      }

      setSending(true);
      setSafetyMessage("");
      setErrorMessage("");

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
          setErrorMessage(
            "Please login again."
          );

          return;
        }

        const response =
          await fetch(
            "/api/messages/send",
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
                JSON.stringify(
                  {
                    applicationId,
                    content,
                  }
                ),
            }
          );

        const result:
          SendResponse =
          await response.json();

        // ----------------------------------------------
        // SAFETY BLOCK
        // ----------------------------------------------

        if (
          result.blocked
        ) {
          setSafetyMessage(
            result.error ||
              "This message contains restricted information."
          );

          return;
        }

        // ----------------------------------------------
        // OTHER ERROR
        // ----------------------------------------------

        if (
          !response.ok ||
          !result.success
        ) {
          setErrorMessage(
            result.error ||
              "Unable to send message."
          );

          return;
        }

        // ----------------------------------------------
        // SUCCESS
        // ----------------------------------------------

        setNewMessage("");

        await loadMessages();
      } catch (error) {
        console.error(
          "Message sending error:",
          error
        );

        setErrorMessage(
          "Unable to send message."
        );
      } finally {
        setSending(false);
      }
    };

  // --------------------------------------------------
  // ENTER TO SEND
  // --------------------------------------------------

  const handleKeyDown = (
    event:
      React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key ===
      "Enter"
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div>
        <section
          className="hero-section"
          style={hero}
        >
          <h1>
            Messages
          </h1>

          <p>
            Loading conversation...
          </p>
        </section>
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div>
      <section
        className="hero-section"
        style={hero}
      >
        <h1>
          Messages
        </h1>

        <p>
          Communicate safely
          inside Freelance Hub SA.
        </p>
      </section>

      {/* SAFETY NOTICE */}

      <div
        style={
          safetyNotice
        }
      >
        <strong>
          🛡️ Stay protected
        </strong>

        <p
          style={{
            margin:
              "6px 0 0",
          }}
        >
          Keep communication
          and payments on
          Freelance Hub SA.
          Contact details and
          off-platform payment
          arrangements are not
          permitted.
        </p>
      </div>

      {/* BLOCKED MESSAGE */}

      {safetyMessage && (
        <div
          style={
            blockedNotice
          }
        >
          <strong>
            ⚠️ Message not sent
          </strong>

          <p
            style={{
              margin:
                "6px 0 0",
            }}
          >
            {safetyMessage}
          </p>
        </div>
      )}

      {/* ERROR */}

      {errorMessage && (
        <div
          style={
            errorNotice
          }
        >
          {errorMessage}
        </div>
      )}

      {/* CHAT */}

      <div
        className="dark-card"
        style={chatBox}
      >
        {messages.length ===
          0 && (
          <div
            style={{
              textAlign:
                "center",
              padding:
                "50px 20px",
              opacity: 0.7,
            }}
          >
            <p>
              No messages yet.
            </p>

            <p>
              Start the
              conversation here.
            </p>
          </div>
        )}

        {messages.map(
          (msg) => {
            const isMine =
              msg.sender_id ===
              currentUserId;

            return (
              <div
                key={
                  msg.id
                }
                style={{
                  display:
                    "flex",

                  justifyContent:
                    isMine
                      ? "flex-end"
                      : "flex-start",

                  marginBottom:
                    14,
                }}
              >
                <div
                  style={{
                    background:
                      isMine
                        ? "#2563eb"
                        : "var(--surface)",

                    color:
                      isMine
                        ? "white"
                        : "var(--text)",

                    border:
                      isMine
                        ? "none"
                        : "1px solid var(--border)",

                    padding:
                      "12px 16px",

                    borderRadius:
                      16,

                    maxWidth:
                      "70%",

                    wordBreak:
                      "break-word",
                  }}
                >
                  <p
                    style={{
                      margin:
                        "0 0 6px",

                      color:
                        isMine
                          ? "white"
                          : "var(--text)",
                    }}
                  >
                    {
                      msg.content
                    }
                  </p>

                  <small
                    style={{
                      opacity:
                        0.75,

                      color:
                        isMine
                          ? "white"
                          : "var(--muted)",
                    }}
                  >
                    {new Date(
                      msg.created_at
                    ).toLocaleString(
                      "en-ZA"
                    )}
                  </small>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* MESSAGE INPUT */}

      <div
        style={
          inputRow
        }
      >
        <input
          type="text"
          placeholder="Type your message..."
          value={
            newMessage
          }
          onChange={(
            event
          ) => {
            setNewMessage(
              event.target
                .value
            );

            if (
              safetyMessage
            ) {
              setSafetyMessage(
                ""
              );
            }
          }}
          onKeyDown={
            handleKeyDown
          }
          maxLength={
            5000
          }
          disabled={
            sending
          }
          style={
            input
          }
        />

        <button
          type="button"
          onClick={
            sendMessage
          }
          disabled={
            sending ||
            !newMessage.trim()
          }
          style={{
            ...sendBtn,

            opacity:
              sending ||
              !newMessage.trim()
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
            : "Send"}
        </button>
      </div>

      <p
        style={{
          marginTop: 10,
          fontSize: 13,
          opacity: 0.65,
        }}
      >
        Messages may be
        automatically checked
        for contact information,
        off-platform payment
        requests and other
        safety risks.
      </p>
    </div>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const hero = {
  background:
    "linear-gradient(135deg, #0f172a, #2563eb)",

  padding: 35,

  borderRadius: 18,

  marginBottom: 22,
};

const safetyNotice = {
  border:
    "1px solid rgba(37, 99, 235, 0.35)",

  borderRadius: 14,

  padding: 16,

  marginBottom: 16,

  background:
    "rgba(37, 99, 235, 0.08)",
};

const blockedNotice = {
  border:
    "1px solid rgba(245, 158, 11, 0.45)",

  borderRadius: 14,

  padding: 16,

  marginBottom: 16,

  background:
    "rgba(245, 158, 11, 0.10)",
};

const errorNotice = {
  border:
    "1px solid rgba(239, 68, 68, 0.45)",

  borderRadius: 14,

  padding: 16,

  marginBottom: 16,

  background:
    "rgba(239, 68, 68, 0.10)",
};

const chatBox = {
  borderRadius: 18,

  padding: 24,

  height: 500,

  overflowY:
    "auto" as const,

  boxShadow:
    "0 10px 25px rgba(15,23,42,0.06)",
};

const inputRow = {
  display: "flex",

  gap: 12,

  marginTop: 18,
};

const input = {
  flex: 1,

  padding: 14,

  borderRadius: 12,

  border:
    "1px solid var(--border)",

  background:
    "var(--surface)",

  color:
    "var(--text)",

  outline: "none",
};

const sendBtn = {
  padding:
    "14px 22px",

  background:
    "#2563eb",

  color:
    "white",

  border:
    "none",

  borderRadius:
    12,

  fontWeight:
    "bold",
};