"use client";

import NotificationBell from "./NotificationBell";
import AdminProfileMenu from "./AdminProfileMenu";

export default function DashboardHeader() {
  return (
    <section
      className="dark-card"
      style={{
        padding: 24,
        marginBottom: 24,
        borderRadius: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        {/* Left Side */}
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            Admin Dashboard
          </h1>

          <p
            style={{
              marginTop: 8,
              opacity: 0.75,
            }}
          >
            Monitor and manage the entire Freelance Hub SA platform.
          </p>
        </div>

        {/* Right Side */}
       <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 16,
  }}
>
  <input
    type="text"
    placeholder="Search users, jobs, clients..."
    style={{
      width: 320,
      padding: "12px 16px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,.15)",
      background: "#141b2d",
      color: "white",
      outline: "none",
    }}
  />

  <NotificationBell />

  <AdminProfileMenu />
</div>
      </div>
    </section>
  );
}