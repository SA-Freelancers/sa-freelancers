"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loadNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (!error && data) {
        setNotifications(data);
      }
    };

    loadNotifications();
  }, []);

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
      }}
    >
      <h1>Notifications</h1>

      {notifications.length === 0 && (
        <p>No notifications yet.</p>
      )}

      {notifications.map((notification) => (
        <Link
          key={notification.id}
          href={notification.link || "#"}
          style={{
            display: "block",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8,
            backgroundColor: notification.is_read
              ? "#f1f1f1"
              : "#dbeafe",
            textDecoration: "none",
            color: "black",
          }}
        >
          <strong>{notification.title}</strong>

          <p>{notification.body}</p>

          <small>
            {new Date(
              notification.created_at
            ).toLocaleString()}
          </small>
        </Link>
      ))}
    </div>
  );
}