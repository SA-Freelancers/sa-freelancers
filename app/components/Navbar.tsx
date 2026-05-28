"use client";

import Link from "next/link";

import { useState } from "react";

import { supabase } from "@/app/lib/supabase";

export default function Navbar() {
  const [menuOpen,
    setMenuOpen] =
    useState(false);

  const logout = async () => {
    await supabase.auth.signOut();

    window.location.href = "/login";
  };

  return (
    <nav
      style={{
        backgroundColor: "#111827",
        padding: "16px 20px",
        color: "white",
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          style={{
            color: "white",
            textDecoration:
              "none",
            fontSize: 24,
            fontWeight: "bold",
          }}
        >
          SA Freelancers
        </Link>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: 28,
            cursor: "pointer",
          }}
        >
          ☰
        </button>
      </div>

      {/* LINKS */}
      {menuOpen && (
        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            gap: 12,
            marginTop: 20,
          }}
        >
          <Link
            href="/search"
            style={linkStyle}
          >
            Search
          </Link>

          <Link
            href="/dashboard"
            style={linkStyle}
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/jobs"
            style={linkStyle}
          >
            Jobs
          </Link>

          <Link
            href="/dashboard/profile"
            style={linkStyle}
          >
            Profile
          </Link>

          <Link
            href="/login"
            style={linkStyle}
          >
            Login
          </Link>

          <Link
            href="/register"
            style={linkStyle}
          >
            Register
          </Link>

          <button
            onClick={logout}
            style={{
              backgroundColor:
                "red",

              color: "white",

              border: "none",

              padding:
                "10px 14px",

              borderRadius: 6,

              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "8px 0",
};