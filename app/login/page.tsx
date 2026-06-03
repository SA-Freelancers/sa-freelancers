"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter your email and password.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("suspended")
    .eq("id", user.id)
    .single();

  if (profile?.suspended) {
    await supabase.auth.signOut();
    setMessage("Your account has been suspended. Please contact support.");
    setLoading(false);
    return;
  }

  await supabase
    .from("profiles")
    .update({
      last_seen: new Date().toISOString(),
    })
    .eq("id", user.id);
}

    router.push("/dashboard");
    setLoading(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-card dark-card">
        <p className="dashboard-badge">Login</p>

        <h1>Welcome back</h1>

        <p className="auth-description">
          Login to manage jobs, projects, proposals, profiles and marketplace
          activity.
        </p>

        <label className="form-label">Email Address</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />

        <label className="form-label">Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="primary-action-btn auth-submit-btn"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <p className="auth-error">{message}</p>}

        <p className="auth-footer-text">
          No account? <Link href="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
}