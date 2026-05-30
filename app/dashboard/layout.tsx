"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div style={layout}>
      {/* MOBILE TOPBAR */}
      <div style={mobileTopbar}>
        <h2 style={{ color: "white", margin: 0 }}>
          SA Freelancers
        </h2>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={menuButton}
        >
          ☰
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        style={{
          ...sidebar,
          left: menuOpen ? 0 : -280,
        }}
      >
        <div style={sidebarHeader}>
          <h2 style={{ color: "white", marginBottom: 8 }}>
            SA Freelancers
          </h2>

          <p style={{ color: "#94a3b8" }}>
            Marketplace Dashboard
          </p>
        </div>

        <nav style={nav}>
          <Link
            href="/dashboard"
            style={navLink}
            onClick={() => setMenuOpen(false)}
          >
            🏠 Dashboard
          </Link>

          <Link
            href="/dashboard/jobs"
            style={navLink}
            onClick={() => setMenuOpen(false)}
          >
            💼 Jobs
          </Link>

          <Link
            href="/dashboard/projects"
            style={navLink}
            onClick={() => setMenuOpen(false)}
          >
            📌 Projects
          </Link>

          <Link
            href="/dashboard/profile"
            style={navLink}
            onClick={() => setMenuOpen(false)}
          >
            👤 Profile
          </Link>

          <Link
            href="/dashboard/upload"
            style={navLink}
            onClick={() => setMenuOpen(false)}
          >
            📁 Uploads
          </Link>

          <Link
            href="/dashboard/favorites"
            style={navLink}
            onClick={() => setMenuOpen(false)}
          >
            ❤️ Favorites
          </Link>

          <Link
            href="/dashboard/notifications"
            style={navLink}
            onClick={() => setMenuOpen(false)}
          >
            🔔 Notifications
          </Link>

          <Link
            href="/dashboard/admin"
            style={navLink}
            onClick={() => setMenuOpen(false)}
          >
            🛡 Admin
          </Link>

          <button onClick={logout} style={logoutBtn}>
            Logout
          </button>
        </nav>
      </aside>

      {/* OVERLAY */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={overlay}
        />
      )}

      {/* MAIN CONTENT */}
      <main style={main}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}

const layout = {
  display: "flex",
  background: "var(--bg)",
  minHeight: "100vh",
};

const mobileTopbar = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  height: 70,
  background: "#020617",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 20px",
  zIndex: 1000,
};

const menuButton = {
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: 28,
  cursor: "pointer",
};

const sidebar = {
  position: "fixed" as const,
  top: 0,
  bottom: 0,
  width: 260,
  background: "#0f172a",
  padding: 24,
  zIndex: 1200,
  transition: "0.3s ease",
  overflowY: "auto" as const,
};

const sidebarHeader = {
  marginTop: 60,
  marginBottom: 30,
};

const nav = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 12,
};

const navLink = {
  background: "#1e293b",
  color: "white",
  padding: "12px 14px",
  borderRadius: 10,
  textDecoration: "none",
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

const overlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  zIndex: 1100,
};

const main = {
  flex: 1,
  width: "100%",
  padding: "100px 20px 40px",
  background: "var(--bg)",
  color: "var(--text)",
};