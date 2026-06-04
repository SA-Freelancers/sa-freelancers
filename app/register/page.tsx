"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("freelancer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    setLoading(true);
    setMessage("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setMessage("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setMessage("Please check your email to confirm your account.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName,
      email,
      role,
    });

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    setMessage(
  "Account created successfully! Please check your email and verify your account before logging in."
);

    setTimeout(() => {
      router.push("/login");
    }, 1200);

    setLoading(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-card dark-card">
        <p className="dashboard-badge">Create Account</p>

        <h1>Join SA Freelancers</h1>

        <p className="auth-description">
          Create a client or freelancer account and start using the marketplace.
        </p>

        <label className="form-label">Full Name</label>
        <input
          placeholder="Your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="form-input"
        />

        <label className="form-label">Account Type</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="form-input"
        >
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
        </select>

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
          placeholder="Create a secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />
<p className="password-hint">
  Use at least 6 characters with a strong password for better account security.
</p>
        <button
          onClick={handleRegister}
          disabled={loading}
          className="primary-action-btn auth-submit-btn"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        {message && <p className="auth-error">{message}</p>}

        <p className="auth-footer-text">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}