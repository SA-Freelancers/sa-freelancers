"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/app/lib/supabase";

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<any>(null);

  const [fullName, setFullName] =
    useState("");

  const [role, setRole] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
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

        setFullName(
          data.full_name || ""
        );

        setRole(data.role || "");

        setBio(data.bio || "");

        setCategory(
          data.category || ""
        );
      }
    };

    loadProfile();
  }, []);

  const saveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

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

    setMessage("Profile updated!");
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
      }}
    >
      <h1>My Profile</h1>

      {profile?.avatar_url && (
        <img
          src={profile.avatar_url}
          alt="Avatar"
          width={120}
          height={120}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 20,
          }}
        />
      )}

      <input
        type="text"
        placeholder="Full name"
        value={fullName}
        onChange={(e) =>
          setFullName(e.target.value)
        }
        style={inputStyle}
      />

      <input
        type="text"
        placeholder="Role"
        value={role}
        onChange={(e) =>
          setRole(e.target.value)
        }
        style={inputStyle}
      />

      <select
        value={category}
        onChange={(e) =>
          setCategory(e.target.value)
        }
        style={inputStyle}
      >
        <option value="">
          Select Category
        </option>

        <option value="Web Development">
          Web Development
        </option>

        <option value="Graphic Design">
          Graphic Design
        </option>

        <option value="Writing">
          Writing
        </option>

        <option value="Video Editing">
          Video Editing
        </option>

        <option value="Marketing">
          Marketing
        </option>

        <option value="Engineering">
          Engineering
        </option>
      </select>

      <textarea
        placeholder="Bio"
        value={bio}
        onChange={(e) =>
          setBio(e.target.value)
        }
        style={{
          ...inputStyle,
          minHeight: 120,
        }}
      />

      <button
        onClick={saveProfile}
        style={{
          padding: "12px 18px",
          backgroundColor: "black",
          color: "white",
          border: "none",
          borderRadius: 6,
        }}
      >
        Save Profile
      </button>

      {message && (
        <p style={{ marginTop: 15 }}>
          {message}
        </p>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 12,
  borderRadius: 6,
  border: "1px solid #ccc",
};