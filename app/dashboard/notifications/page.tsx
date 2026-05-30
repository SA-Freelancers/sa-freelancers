"use client";

import EmptyState from "@/app/components/EmptyState";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Notification = {
  id: string;
  title?: string;
  body?: string;
  link?: string;
  is_read?: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

    setNotifications((data as Notification[]) || []);

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="notifications-page">
      <section className="notifications-hero dark-card">
        <p className="dashboard-badge">Notifications</p>

        <h1>Your latest updates</h1>

        <p>Stay updated on applications, messages, projects and payments.</p>
      </section>

      {notifications.length === 0 ? (
        <EmptyState
          emoji="🔔"
          title="No notifications yet"
          description="Your updates and alerts will appear here."
          buttonText="Go Dashboard"
          buttonLink="/dashboard"
        />
      ) : (
        <section className="notifications-list">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.link || "/dashboard"}
              className={`dark-card notification-card ${
                notification.is_read ? "read" : "unread"
              }`}
            >
              <div className="notification-icon">🔔</div>

              <div>
                <h3>{notification.title || "Notification"}</h3>

                <p>{notification.body || "You have a new update."}</p>

                <small>
                  {new Date(notification.created_at).toLocaleString()}
                </small>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}