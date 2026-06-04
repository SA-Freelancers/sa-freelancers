"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updatePassword = async () => {
    setLoading(true);
    setMessage("");

    if (!password.trim() || !confirmPassword.trim()) {
      setMessage("Please fill in both password fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully.");

    setTimeout(() => {
      router.push("/login");
    }, 1200);

    setLoading(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-card dark-card">
        <p className="dashboard-badge">New Password</p>

        <h1>Reset Password</h1>

        <p className="auth-description">
          Enter your new password below.
        </p>

        <label className="form-label">New Password</label>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />

        <label className="form-label">Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="form-input"
        />

        <button
          onClick={updatePassword}
          disabled={loading}
          className="primary-action-btn auth-submit-btn"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        {message && <p className="upload-message">{message}</p>}
      </section>
    </main>
  );
}