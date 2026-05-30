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

    setMessage("Account created successfully!");

    setTimeout(() => {
      router.push("/login");
    }, 1200);

    setLoading(false);
  };

  return (
    <main style={page}>
      <div className="dark-card" style={card}>
        <h1>Create Account</h1>

        <p>Join SA Freelancers as a client or freelancer.</p>

        <input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={input}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={input}
        >
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
        </select>

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

        <button onClick={handleRegister} disabled={loading} style={button}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        {message && <p style={{ marginTop: 15 }}>{message}</p>}

        <p style={{ marginTop: 20 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#60a5fa", fontWeight: "bold" }}>
            Login
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
  maxWidth: 460,
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
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: "bold",
};