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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    setLoading(false);
  };

  return (
    <main style={page}>
      <div className="dark-card" style={card}>
        <h1>Welcome Back</h1>

        <p>Login to manage jobs, projects, payments, and messages.</p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        <button onClick={handleLogin} disabled={loading} style={button}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <p style={{ color: "#ef4444" }}>{message}</p>}

        <p style={{ marginTop: 20 }}>
          No account?{" "}
          <Link href="/register" style={{ color: "#60a5fa", fontWeight: "bold" }}>
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

const page = {
  minHeight: "80vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const card = {
  width: "100%",
  maxWidth: 430,
  padding: 35,
  borderRadius: 20,
  boxShadow: "0 15px 35px rgba(15,23,42,0.08)",
};

const input = {
  width: "100%",
  padding: 14,
  marginTop: 15,
  borderRadius: 12,
};

const button = {
  width: "100%",
  marginTop: 20,
  padding: 14,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: "bold",
};