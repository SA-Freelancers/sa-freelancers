"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { supabase } from "@/app/lib/supabase";

export default function MessagesPage() {
  const { applicationId } =
    useParams();

  const [messages,
    setMessages] =
    useState<any[]>([]);

  const [newMessage,
    setNewMessage] =
    useState("");

  const [currentUserId,
    setCurrentUserId] =
    useState("");

  useEffect(() => {
    loadMessages();
    getCurrentUser();
  }, []);

  const getCurrentUser =
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
      }
    };

  const loadMessages =
    async () => {
      const { data } =
        await supabase
          .from("messages")
          .select("*")
          .eq(
            "application_id",
            applicationId
          )
          .order("created_at", {
            ascending: true,
          });

      if (data) {
        setMessages(data);
      }
    };

  const sendMessage =
    async () => {
      if (!newMessage.trim())
        return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } =
        await supabase
          .from("messages")
          .insert({
            application_id:
              applicationId,

            sender_id: user.id,

            message: newMessage,
          });

      if (error) {
        alert(error.message);
        return;
      }

      setNewMessage("");

      loadMessages();
    };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
      }}
    >
      <h1>Messages</h1>

      {/* CHAT BOX */}
      <div
        style={{
          backgroundColor: "white",
          border:
            "1px solid #ddd",
          borderRadius: 10,
          padding: 20,
          height: 500,
          overflowY: "auto",
          marginBottom: 20,
        }}
      >
        {messages.length === 0 && (
          <p>No messages yet.</p>
        )}

        {messages.map((msg) => {
          const isMine =
            msg.sender_id ===
            currentUserId;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent:
                  isMine
                    ? "flex-end"
                    : "flex-start",

                marginBottom: 15,
              }}
            >
              <div
                style={{
                  backgroundColor:
                    isMine
                      ? "#2563eb"
                      : "#e5e7eb",

                  color: isMine
                    ? "white"
                    : "black",

                  padding:
                    "12px 16px",

                  borderRadius: 14,

                  maxWidth: "70%",
                }}
              >
                <p
                  style={{
                    margin: 0,
                  }}
                >
                  {msg.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        <input
          type="text"
          placeholder="Type message..."
          value={newMessage}
          onChange={(e) =>
            setNewMessage(
              e.target.value
            )
          }
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 8,
            border:
              "1px solid #ccc",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding:
              "14px 20px",
            backgroundColor:
              "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}