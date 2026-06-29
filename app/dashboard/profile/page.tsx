"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Profile = {
  avatar_url?: string;
  cv_url?: string;
  portfolio_url?: string;
  role?: string;
  full_name?: string;
  bio?: string;
  category?: string;
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
  const [headline, setHeadline] = useState("");
const [location, setLocation] = useState("");
const [country, setCountry] = useState("South Africa");
const [availability, setAvailability] = useState("Available");
const [responseTime, setResponseTime] = useState("Within 2 hours");
const [experience, setExperience] = useState("");
const [hourlyRate, setHourlyRate] = useState("");
const [education, setEducation] = useState("");
const [linkedin, setLinkedin] = useState("");
const [website, setWebsite] = useState("");
const [skills, setSkills] = useState("");
const [languages, setLanguages] = useState("");
const [certifications, setCertifications] = useState("");

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

setHeadline(data.headline || "");
setLocation(data.location || "");
setCountry(data.country || "South Africa");
setAvailability(data.availability || "Available");
setResponseTime(data.response_time || "Within 2 hours");

setExperience(
  data.years_experience
    ? data.years_experience.toString()
    : ""
);

setHourlyRate(
  data.hourly_rate
    ? data.hourly_rate.toString()
    : ""
);

setEducation(data.education || "");
setLinkedin(data.linkedin_url || "");
setWebsite(data.website_url || "");

setSkills(
  Array.isArray(data.skills)
    ? data.skills.join(", ")
    : ""
);

setLanguages(
  Array.isArray(data.languages)
    ? data.languages.join(", ")
    : ""
);

setCertifications(
  Array.isArray(data.certifications)
    ? data.certifications.join(", ")
    : ""
);
    }

    setLoading(false);
  };

  const uploadFile = async (
    file: File,
    folder: string,
    column: "avatar_url" | "cv_url" | "portfolio_url"
  ) => {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${folder}/${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      setMessage(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ [column]: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      setMessage(updateError.message);
      return;
    }

    setMessage("File uploaded successfully.");
    loadProfile();
  };

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setMessage("Profile picture must be PNG, JPG or WEBP.");
      return;
    }

    await uploadFile(file, "avatars", "avatar_url");
  };

  const handleCVUpload = async (file?: File) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("CV must be a PDF file.");
      return;
    }

    await uploadFile(file, "cv", "cv_url");
  };

  const handlePortfolioUpload = async (file?: File) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Portfolio must be PDF, PNG, JPG or WEBP.");
      return;
    }

    await uploadFile(file, "portfolio", "portfolio_url");
  };

  const saveProfile = async () => {
    setMessage("");

    if (!fullName.trim()) {
      setMessage("Please enter your full name.");
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

    const updateData =
  role === "freelancer"
    ? {
        full_name: fullName,
        bio,
        category,
        headline,
        location,
        country,
        availability,
        response_time: responseTime,
        years_experience: experience ? Number(experience) : null,
        hourly_rate: hourlyRate ? Number(hourlyRate) : null,
        education,
        linkedin_url: linkedin,
        website_url: website,
        skills: skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        languages: languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        certifications: certifications
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }
    : {
        full_name: fullName,
        bio,
        location,
        country,
        website_url: website,
      };

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
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

  const isFreelancer = role === "freelancer";
  const isClient = role === "client";

  return (
    <main className="profile-settings-page">
      <section className="profile-settings-hero dark-card">
        <p className="dashboard-badge">Profile Settings</p>

        <h1>
          {isFreelancer
            ? "Build your professional freelancer profile"
            : "Manage your client profile"}
        </h1>

        <p>
          {isFreelancer
            ? "Update your skills, bio, category and documents to attract more clients."
            : "Update your client information so freelancers understand who they are working with."}
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

          <label className="form-label">
            {isFreelancer ? "Professional Bio" : "Client / Business Bio"}
          </label>

          <textarea
            placeholder={
              isFreelancer
                ? "Write a short professional bio..."
                : "Tell freelancers about your business or the type of projects you post..."
            }
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="form-input profile-textarea"
          />

          {isFreelancer && (
  <>
    <label className="form-label">Category</label>

    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="form-input"
    >
      <option value="">Select category</option>
      <option value="Web Development">Web Development</option>
      <option value="Mobile Development">Mobile Development</option>
      <option value="Graphic Design">Graphic Design</option>
      <option value="UI/UX Design">UI/UX Design</option>
      <option value="Writing">Writing</option>
      <option value="Video Editing">Video Editing</option>
      <option value="Digital Marketing">Digital Marketing</option>
      <option value="Engineering">Engineering</option>
      <option value="CAD Drafting">CAD Drafting</option>
      <option value="Data Entry">Data Entry</option>
      <option value="Virtual Assistant">Virtual Assistant</option>
    </select>

    <label className="form-label">Professional Headline</label>
    <input
      placeholder="Example: Mechanical Engineering Draughtsman"
      value={headline}
      onChange={(e) => setHeadline(e.target.value)}
      className="form-input"
    />

    <label className="form-label">Location</label>
    <input
      placeholder="Example: Johannesburg / Remote"
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      className="form-input"
    />
  </>
)}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="primary-action-btn"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

          {message && <p className="upload-message">{message}</p>}

          {isFreelancer && (
            <>
              <div className="profile-divider" />

              <h2>Upload Documents</h2>

              <label className="form-label">Profile Picture</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="form-input"
                onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
              />

              <label className="form-label">CV PDF</label>
              <input
                type="file"
                accept="application/pdf"
                className="form-input"
                onChange={(e) => handleCVUpload(e.target.files?.[0])}
              />

              <label className="form-label">
                Portfolio PDF or Image
              </label>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="form-input"
                onChange={(e) => handlePortfolioUpload(e.target.files?.[0])}
              />
            </>
          )}
        </div>

        <div className="dark-card profile-preview-card">
          <h2>{isFreelancer ? "Freelancer Preview" : "Client Preview"}</h2>

          {profile?.avatar_url && isFreelancer ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="profile-preview-avatar"
            />
          ) : (
            <div className="profile-preview-placeholder">👤</div>
          )}

          <h3>{fullName || "Your Name"}</h3>

          <p>
            <strong>Account Type:</strong>{" "}
            {isClient ? "Client" : isFreelancer ? "Freelancer" : "User"}
          </p>

          {isFreelancer && (
            <p>
              <strong>Category:</strong> {category || "Not selected"}
            </p>
          )}

          <p className="profile-preview-bio">
            {bio || "Your bio will appear here."}
          </p>

          {isFreelancer && (
            <>
              <div className="profile-divider" />

              <h3>Documents</h3>

              <div className="profile-documents">
                {profile?.cv_url && (
                  <a href={profile.cv_url} target="_blank" rel="noreferrer">
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

                {!profile?.cv_url && !profile?.portfolio_url && (
                  <p>No documents uploaded yet.</p>
                )}
              </div>
            </>
          )}

          {isClient && (
            <>
              <div className="profile-divider" />

              <h3>Client Account</h3>

              <p>
                You can post jobs, review proposals, hire freelancers and manage
                contracts from your dashboard.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}