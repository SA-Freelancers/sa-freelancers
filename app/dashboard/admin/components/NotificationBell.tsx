"use client";

import { useState } from "react";

type Notification = {
  id: number;
  title: string;
  time: string;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  const notifications: Notification[] = [
    {
      id: 1,
      title: "New freelancer registered",
      time: "3 min ago",
    },
    {
      id: 2,
      title: "New job posted",
      time: "15 min ago",
    },
    {
      id: 3,
      title: "Payment completed",
      time: "42 min ago",
    },
    {
      id: 4,
      title: "Review submitted",
      time: "1 hour ago",
    },
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        className="accept-btn"
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
        }}
      >
        🔔

        <span
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            background: "#ef4444",
            color: "white",
            borderRadius: "50%",
            width: 22,
            height: 22,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 12,
          }}
        >
          {notifications.length}
        </span>
      </button>

      {open && (
        <div
          className="dark-card"
          style={{
            position: "absolute",
            top: 55,
            right: 0,
            width: 320,
            zIndex: 999,
            padding: 20,
          }}
        >
          <h3>Notifications</h3>

          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                padding: "12px 0",
                borderBottom:
                  "1px solid rgba(255,255,255,.08)",
              }}
            >
              <div>{notification.title}</div>

              <small
                style={{
                  opacity: .6,
                }}
              >
                {notification.time}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}