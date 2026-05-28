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
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: 250,
          backgroundColor: "#111827",
          color: "white",
          padding: 20,
        }}
      ><Link href="/dashboard/projects" style={linkStyle}>
  Projects
</Link>
        <h2
          style={{
            marginBottom: 30,
          }}
        >
          SA Freelancers
        </h2>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
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
            My Profile
          </Link>
<Link href="/dashboard/projects" style={linkStyle}>
  Projects
</Link>
          <Link
            href="/dashboard/notifications"
            style={linkStyle}
          >
            Notifications
          </Link>
<Link href="/dashboard/favorites" style={linkStyle}>
  Favorites
</Link>
          <button
            onClick={logout}
            style={{
              marginTop: 20,
              padding: "10px 12px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "red",
              color: "white",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </nav>
      </div>

      {/* PAGE CONTENT */}
      <div
        style={{
          flex: 1,
          padding: 30,
          backgroundColor: "#f5f5f5",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: 6,
  backgroundColor: "#1f2937",
};