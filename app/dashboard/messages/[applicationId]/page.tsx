"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function MessagesPage() {
  const params = useParams();
  const applicationId = params.applicationId as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    getCurrentUser();
    loadMessages();
  }, [applicationId]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) setCurrentUserId(user.id);
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const blockedWords = [
      "@gmail",
      "@yahoo",
      "@outlook",
      "whatsapp",
      "+27",
      "telegram",
      "instagram",
      "facebook",
      "call me",
      "phone number",
    ];

    const lowerMessage = newMessage.toLowerCase();

    const containsBlocked = blockedWords.some((word) =>
      lowerMessage.includes(word)
    );

    if (containsBlocked) {
      alert("Sharing contact details is not allowed.");
      return;
    }

    const { error } = await supabase.from("messages").insert({
      application_id: applicationId,
      sender_id: currentUserId,
      content: newMessage,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNewMessage("");
    loadMessages();
  };

  return (
    <div>
      <section className="hero-section" style={hero}>
        <h1>Messages</h1>
        <p>Communicate safely inside the platform.</p>
      </section>

      <div className="dark-card" style={chatBox}>
        {messages.length === 0 && <p>No messages yet.</p>}

        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  background: isMine ? "#2563eb" : "var(--surface)",
                  color: isMine ? "white" : "var(--text)",
                  border: isMine ? "none" : "1px solid var(--border)",
                  padding: "12px 16px",
                  borderRadius: 16,
                  maxWidth: "70%",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: isMine ? "white" : "var(--muted)",
                  }}
                >
                  {msg.content}
                </p>

                <small
                  style={{
                    opacity: 0.8,
                    color: isMine ? "white" : "var(--muted)",
                  }}
                >
                  {new Date(msg.created_at).toLocaleString("en-ZA")}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      <div style={inputRow}>
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={input}
        />

        <button onClick={sendMessage} style={sendBtn}>
          Send
        </button>
      </div>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const chatBox = {
  borderRadius: 18,
  padding: 24,
  height: 500,
  overflowY: "auto" as const,
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
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
};

const sendBtn = {
  padding: "14px 22px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: "bold",
};