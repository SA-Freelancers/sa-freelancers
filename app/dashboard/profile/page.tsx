"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Profile = {
  avatar_url?: string;
  cv_url?: string;
  portfolio_url?: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

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

    setLoading(false);
  };

  const saveProfile = async () => {
    setMessage("");

    if (!fullName.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    if (!role.trim()) {
      setMessage("Please enter your professional role.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setSaving(false);
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
      setSaving(false);
      return;
    }

    setMessage("Profile updated successfully!");
    setSaving(false);

    loadProfile();
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="profile-settings-page">
      <section className="profile-settings-hero dark-card">
        <p className="dashboard-badge">Profile Settings</p>

        <h1>Build your professional identity</h1>

        <p>
          Update your freelancer profile, role, bio and category to attract
          more clients.
        </p>
      </section>

      <section className="profile-settings-layout">
        <div className="dark-card profile-settings-card">
          <h2>Edit Profile</h2>

          <label className="form-label">Full Name</label>

          <input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="form-input"
          />

          <label className="form-label">Professional Role</label>

          <input
            placeholder="Role e.g. Web Developer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="form-input"
          />

          <label className="form-label">Category</label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-input"
          >
            <option value="">Select category</option>
            <option value="Web Development">Web Development</option>
            <option value="Graphic Design">Graphic Design</option>
            <option value="Writing">Writing</option>
            <option value="Video Editing">Video Editing</option>
            <option value="Marketing">Marketing</option>
            <option value="Engineering">Engineering</option>
            <option value="Fitting & Turning">Fitting & Turning</option>
          </select>

          <label className="form-label">Professional Bio</label>

          <textarea
            placeholder="Write a short professional bio..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="form-input profile-textarea"
          />

          <button
            onClick={saveProfile}
            disabled={saving}
            className="primary-action-btn"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

          {message && <p className="upload-message">{message}</p>}
        </div>

        <div className="dark-card profile-preview-card">
          <h2>Profile Preview</h2>

          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="profile-preview-avatar"
            />
          ) : (
            <div className="profile-preview-placeholder">
              👤
            </div>
          )}

          <h3>{fullName || "Your Name"}</h3>

          <p>
            <strong>Role:</strong> {role || "Not added"}
          </p>

          <p>
            <strong>Category:</strong>{" "}
            {category || "Not selected"}
          </p>

          <p className="profile-preview-bio">
            {bio || "Your bio will appear here."}
          </p>

          <div className="profile-divider" />

          <h3>Documents</h3>

          <div className="profile-documents">
            {profile?.cv_url && (
              <a
                href={profile.cv_url}
                target="_blank"
                rel="noreferrer"
              >
                View CV
              </a>
            )}

            {profile?.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noreferrer"
              >
                View Portfolio
              </a>
            )}

            {!profile?.cv_url &&
              !profile?.portfolio_url && (
                <p>No documents uploaded yet.</p>
              )}
          </div>
        </div>
      </section>
    </main>
  );
}