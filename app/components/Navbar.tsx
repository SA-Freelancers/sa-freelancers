"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      setDarkMode(true);
    }

    loadNotifications();

    const channel = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotificationCount(data?.length || 0);
  };

  const toggleDarkMode = () => {
    if (darkMode) {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <nav style={nav}>
      <div style={topRow}>
        <Link href="/" style={logo}>
          SA Freelancers
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={menuButton}
        >
          ☰
        </button>
      </div>

      <div style={menuOpen ? mobileLinks : desktopLinks}>
        <Link href="/" style={link}>
          Home
        </Link>

        <Link href="/search" style={link}>
          Search
        </Link>

        <Link href="/dashboard" style={link}>
          Dashboard
        </Link>

        <Link href="/dashboard/jobs" style={link}>
          Jobs
        </Link>

        {/* REALTIME NOTIFICATIONS */}
        <Link
          href="/dashboard/notifications"
          style={notificationWrapper}
        >
          🔔

          {notificationCount > 0 && (
            <span style={notificationBadge}>
              {notificationCount}
            </span>
          )}
        </Link>

        <button
          onClick={toggleDarkMode}
          style={darkBtn}
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>

        <Link href="/login" style={link}>
          Login
        </Link>

        <Link href="/register" style={registerBtn}>
          Register
        </Link>

        <button
          onClick={logout}
          style={logoutBtn}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

const nav = {
  background: "#0f172a",
  color: "white",
  padding: "16px 28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap" as const,
  position: "sticky" as const,
  top: 0,
  zIndex: 999,
  boxShadow: "0 4px 15px rgba(15,23,42,0.2)",
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  maxWidth: 280,
};

const logo = {
  color: "white",
  textDecoration: "none",
  fontSize: 24,
  fontWeight: "bold",
};

const menuButton = {
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: 28,
  cursor: "pointer",
};

const desktopLinks = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap" as const,
};

const mobileLinks = {
  display: "flex",
  flexDirection: "column" as const,
  width: "100%",
  gap: 14,
  marginTop: 18,
};

const link = {
  color: "white",
  textDecoration: "none",
  fontWeight: 500,
};

const registerBtn = {
  background: "#2563eb",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: "bold",
};

const darkBtn = {
  background: "#334155",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
};

const logoutBtn = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
};

const notificationWrapper = {
  position: "relative" as const,
  fontSize: 24,
  textDecoration: "none",
};

const notificationBadge = {
  position: "absolute" as const,
  top: -8,
  right: -10,
  background: "#ef4444",
  color: "white",
  borderRadius: "50%",
  minWidth: 20,
  height: 20,
  fontSize: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  padding: "0 5px",
};