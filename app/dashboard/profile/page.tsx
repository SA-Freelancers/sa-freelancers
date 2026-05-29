"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
      setRole(data.role || "");
      setBio(data.bio || "");
      setCategory(data.category || "");
    }
  };

  const saveProfile = async () => {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        bio,
        category,
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Profile updated successfully!");
    loadProfile();
  };

  return (
    <div>
      <section style={hero}>
        <h1>My Profile</h1>
        <p>Update your professional identity, category, bio, and portfolio.</p>
      </section>

      <div style={layout}>
        <section style={card}>
          <h2>Edit Profile</h2>

          <input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={input}
          />

          <input
            placeholder="Role e.g. Web Developer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={input}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={input}
          >
            <option value="">Select category</option>
            <option value="Web Development">Web Development</option>
            <option value="Graphic Design">Graphic Design</option>
            <option value="Writing">Writing</option>
            <option value="Video Editing">Video Editing</option>
            <option value="Marketing">Marketing</option>
            <option value="Engineering">Engineering</option>
          </select>

          <textarea
            placeholder="Write a short professional bio..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ ...input, minHeight: 130 }}
          />

          <button onClick={saveProfile} style={primaryBtn}>
            Save Profile
          </button>

          {message && <p>{message}</p>}
        </section>

        <section style={card}>
          <h2>Profile Preview</h2>

          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              width={120}
              height={120}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: 18,
              }}
            />
          ) : (
            <div style={avatarPlaceholder}>👤</div>
          )}

          <h3>{fullName || "Your Name"}</h3>

          <p>
            <strong>Role:</strong> {role || "Not added"}
          </p>

          <p>
            <strong>Category:</strong> {category || "Not selected"}
          </p>

          <p style={{ color: "#475569" }}>{bio || "Your bio will appear here."}</p>

          <hr style={{ margin: "25px 0" }} />

          <h3>Documents</h3>

          {profile?.cv_url && (
            <p>
              <a href={profile.cv_url} target="_blank" rel="noreferrer">
                View CV
              </a>
            </p>
          )}

          {profile?.portfolio_url && (
            <p>
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer">
                View Portfolio
              </a>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  color: "white",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const layout = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 25,
};

const card = {
  background: "white",
  padding: 28,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const input = {
  width: "100%",
  padding: 13,
  marginBottom: 14,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
};

const primaryBtn = {
  padding: "12px 18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
};

const avatarPlaceholder = {
  width: 120,
  height: 120,
  borderRadius: "50%",
  background: "#e0f2fe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 45,
  marginBottom: 18,
};