"use client";

import EmptyState from "@/app/components/EmptyState";
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

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    setLoading(false);
  };

  if (loading) return <p>Loading notifications...</p>;

  return (
    <div>
      <section className="hero-section" style={hero}>
        <h1>Notifications</h1>
        <p>Stay updated on applications, messages, projects, and payments.</p>
      </section>

      {notifications.length === 0 && (
  <EmptyState
    emoji="🔔"
    title="No notifications yet"
    description="Your updates and alerts will appear here."
    buttonText="Go Dashboard"
    buttonLink="/dashboard"
  />
)}

      <div style={{ display: "grid", gap: 15 }}>
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            href={notification.link || "/dashboard"}
            className="dark-card"
            style={{
              ...card,
              opacity: notification.is_read ? 0.75 : 1,
            }}
          >
            <h3>{notification.title}</h3>
            <p>{notification.body}</p>
            <small>{new Date(notification.created_at).toLocaleString()}</small>
          </Link>
        ))}
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

const card = {
  display: "block",
  padding: 22,
  borderRadius: 16,
  textDecoration: "none",
  boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
};

const emptyCard = {
  padding: 30,
  borderRadius: 18,
};