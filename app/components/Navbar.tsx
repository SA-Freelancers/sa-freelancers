"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

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

        <Link href="/login" style={link}>
          Login
        </Link>

        <Link href="/register" style={registerBtn}>
          Register
        </Link>

        <button
          onClick={toggleDarkMode}
          style={darkBtn}
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>

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