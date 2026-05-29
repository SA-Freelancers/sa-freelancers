"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <nav style={nav}>
      <div style={brandRow}>
        <Link href="/" style={logo}>
          SA Freelancers
        </Link>

        <button onClick={() => setMenuOpen(!menuOpen)} style={menuBtn}>
          ☰
        </button>
      </div>

      <div style={menuOpen ? mobileLinks : desktopLinks}>
        <Link href="/search" style={link}>Search</Link>
        <Link href="/dashboard" style={link}>Dashboard</Link>
        <Link href="/dashboard/jobs" style={link}>Jobs</Link>
        <Link href="/login" style={link}>Login</Link>
        <Link href="/register" style={registerBtn}>Register</Link>

        <button onClick={logout} style={logoutBtn}>
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

const brandRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  maxWidth: 260,
};

const logo = {
  color: "white",
  textDecoration: "none",
  fontSize: 24,
  fontWeight: "bold",
};

const menuBtn = {
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: 28,
  cursor: "pointer",
};

const desktopLinks = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap" as const,
};

const mobileLinks = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 14,
  width: "100%",
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

const logoutBtn = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
};