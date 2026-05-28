"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

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

    // CREATE AUTH USER
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
  console.log(data);
  setMessage("Email confirmation may be enabled.");
  setLoading(false);
  return;
}

    // SAVE PROFILE
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
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
    }, 1500);

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "50px auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h1>Create Account</h1>

      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        style={{ padding: 10 }}
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ padding: 10 }}
      >
        <option value="freelancer">Freelancer</option>
        <option value="client">Client</option>
      </select>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: 10 }}
      />

      <button
        onClick={handleRegister}
        disabled={loading}
        style={{
          padding: 12,
          backgroundColor: "black",
          color: "white",
          borderRadius: 6,
        }}
      >
        {loading ? "Creating..." : "Register"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}
