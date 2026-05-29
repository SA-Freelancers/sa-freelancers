"use client";

import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <aside
        style={{
          width: 260,
          background: "#0f172a",
          color: "white",
          padding: 24,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <h2 style={{ fontSize: 26, marginBottom: 8 }}>SA Freelancers</h2>
        <p style={{ color: "#94a3b8", marginBottom: 30 }}>
          Marketplace Dashboard
        </p>

        <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href="/dashboard" style={navLink}>🏠 Dashboard</Link>
          <Link href="/dashboard/jobs" style={navLink}>💼 Jobs</Link>
          <Link href="/dashboard/projects" style={navLink}>📌 Projects</Link>
          <Link href="/dashboard/profile" style={navLink}>👤 Profile</Link>
          <Link href="/dashboard/upload" style={navLink}>📁 Uploads</Link>
          <Link href="/dashboard/favorites" style={navLink}>❤️ Favorites</Link>
          <Link href="/dashboard/notifications" style={navLink}>🔔 Notifications</Link>
          <Link href="/dashboard/admin" style={navLink}>🛡 Admin</Link>

          <button onClick={logout} style={logoutBtn}>
            Logout
          </button>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: 35 }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

const navLink = {
  color: "white",
  textDecoration: "none",
  background: "#1e293b",
  padding: "12px 14px",
  borderRadius: 10,
  fontWeight: 500,
};

const logoutBtn = {
  marginTop: 25,
  padding: "12px 14px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
};