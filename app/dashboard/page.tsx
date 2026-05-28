"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 20,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/dashboard/post-job"
          style={{
            padding: 12,
            backgroundColor: "black",
            color: "white",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Post Job
        </Link>

        <Link
          href="/dashboard/jobs"
          style={{
            padding: 12,
            backgroundColor: "black",
            color: "white",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Browse Jobs
        </Link>

        <Link
          href="/dashboard/notifications"
          style={{
            padding: 12,
            backgroundColor: "black",
            color: "white",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Notifications
        </Link>

        <button
          onClick={handleLogout}
          style={{
            padding: 12,
            backgroundColor: "red",
            color: "white",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}