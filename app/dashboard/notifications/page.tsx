"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  };

  if (loading) return <p>Loading notifications...</p>;

  return (
    <div>
      <section style={hero}>
        <h1>Notifications</h1>
        <p>Stay updated on applications, messages, projects, and payments.</p>
      </section>

      {notifications.length === 0 && (
        <div style={emptyCard}>
          <h2>No notifications yet</h2>
          <p>Your updates will appear here.</p>
        </div>
      )}

      <div style={{ display: "grid", gap: 15 }}>
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            href={notification.link || "/dashboard"}
            style={{
              ...card,
              background: notification.is_read ? "white" : "#eff6ff",
            }}
          >
            <div>
              <h3>{notification.title}</h3>
              <p style={{ color: "#475569" }}>{notification.body}</p>
              <small>
                {new Date(notification.created_at).toLocaleString()}
              </small>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  color: "white",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const card = {
  display: "block",
  padding: 22,
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  textDecoration: "none",
  color: "#0f172a",
  boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
};

const emptyCard = {
  background: "white",
  padding: 30,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
};