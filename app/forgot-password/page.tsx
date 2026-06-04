"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendResetEmail = async () => {
    setLoading(true);
    setMessage("");

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password reset link sent. Please check your email.");
    setLoading(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-card dark-card">
        <p className="dashboard-badge">Password Reset</p>

        <h1>Forgot Password</h1>

        <p className="auth-description">
          Enter your email address and we will send you a reset link.
        </p>

        <label className="form-label">Email Address</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />

        <button
          onClick={sendResetEmail}
          disabled={loading}
          className="primary-action-btn auth-submit-btn"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {message && <p className="upload-message">{message}</p>}

        <p className="auth-footer-text">
          Remembered your password? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}