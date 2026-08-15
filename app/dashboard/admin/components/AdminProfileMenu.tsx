"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AdminProfileMenu() {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="accept-btn"
      >
        👤 Admin ▾
      </button>

      {open && (
        <div
          className="dark-card"
          style={{
            position: "absolute",
            top: 52,
            right: 0,
            width: 220,
            padding: 16,
            zIndex: 999,
          }}
        >
          <button
            className="accept-btn"
            style={{ width: "100%", marginBottom: 10 }}
            onClick={() => router.push("/dashboard/profile")}
          >
            👤 My Profile
          </button>

          <button
            className="accept-btn"
            style={{ width: "100%", marginBottom: 10 }}
            onClick={() =>
              router.push("/dashboard/admin/settings")
            }
          >
            ⚙ Settings
          </button>

          <button
            className="accept-btn"
            style={{ width: "100%", marginBottom: 10 }}
          >
            🔒 Security
          </button>

          <button
            className="accept-btn"
            style={{ width: "100%", marginBottom: 10 }}
          >
            🌙 Theme
          </button>

          <button
            className="reject-btn"
            style={{ width: "100%" }}
            onClick={logout}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}