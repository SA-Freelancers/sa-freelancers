"use client";

import ProfileCompletionCard from "@/app/components/ProfileCompletionCard";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Profile = {
  avatar_url?: string | null;
  cv_url?: string | null;
  portfolio_url?: string | null;

  role?: string | null;
  full_name?: string | null;
  bio?: string | null;
  category?: string | null;

  headline?: string | null;
  location?: string | null;
  country?: string | null;

  availability?: string | null;
  response_time?: string | null;

  years_experience?: number | null;
  hourly_rate?: number | null;

  education?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;

  skills?: string[] | null;
  languages?: string[] | null;
  certifications?: string[] | null;

  verified?: boolean | null;
  verification_status?: string | null;
  verification_document_url?: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");

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

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingVerification, setUploadingVerification] =
    useState(false);

  const [submittingVerification, setSubmittingVerification] =
    useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile loading error:", error);
      setMessage("Unable to load your profile.");
      setLoading(false);
      return;
    }

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
        data.years_experience !== null &&
          data.years_experience !== undefined
          ? data.years_experience.toString()
          : ""
      );

      setHourlyRate(
        data.hourly_rate !== null &&
          data.hourly_rate !== undefined
          ? data.hourly_rate.toString()
          : ""
      );

      setEducation(data.education || "");
      setLinkedin(data.linkedin_url || "");
      setWebsite(data.website_url || "");

      setSkills(
  Array.isArray(data.skills)
    ? data.skills.join(", ")
    : typeof data.skills === "string"
    ? (() => {
        try {
          const parsed = JSON.parse(data.skills);

          return Array.isArray(parsed)
            ? parsed
                .filter(
                  (item): item is string =>
                    typeof item === "string"
                )
                .map((item) => item.trim())
                .filter(Boolean)
                .join(", ")
            : data.skills;
        } catch {
          return data.skills;
        }
      })()
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
      .update({
        [column]: publicUrl,
      })
      .eq("id", user.id);

    if (updateError) {
      setMessage(updateError.message);
      return;
    }

    setMessage("File uploaded successfully.");
    await loadProfile();
  };

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;

    if (
      ![
        "image/png",
        "image/jpeg",
        "image/webp",
      ].includes(file.type)
    ) {
      setMessage(
        "Profile picture must be PNG, JPG or WEBP."
      );
      return;
    }

    await uploadFile(
      file,
      "avatars",
      "avatar_url"
    );
  };

  const handleCVUpload = async (file?: File) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("CV must be a PDF file.");
      return;
    }

    await uploadFile(
      file,
      "cv",
      "cv_url"
    );
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
      setMessage(
        "Portfolio must be PDF, PNG, JPG or WEBP."
      );
      return;
    }

    await uploadFile(
      file,
      "portfolio",
      "portfolio_url"
    );
  };

  const handleVerificationDocumentUpload = async (
    file?: File
  ) => {
    if (!file) return;

    setMessage("");

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage(
        "Verification document must be PDF, PNG, JPG or WEBP."
      );
      return;
    }

    const maxSize = 8 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage(
        "Verification document must be smaller than 8 MB."
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    setUploadingVerification(true);

    const fileExt =
      file.name.split(".").pop()?.toLowerCase() || "pdf";

    const filePath =
      `${user.id}/verification-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("verification-documents")
      .upload(filePath, file, {
        upsert: false,
      });

    if (uploadError) {
      setMessage(uploadError.message);
      setUploadingVerification(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        verification_document_url: filePath,
        verification_status: "not_submitted",
      })
      .eq("id", user.id);

    if (updateError) {
      setMessage(updateError.message);
      setUploadingVerification(false);
      return;
    }

    setMessage(
      "Verification document uploaded successfully."
    );

    setUploadingVerification(false);
    await loadProfile();
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
            full_name: fullName.trim(),
            bio: bio.trim(),
            category,
            headline: headline.trim(),
            location: location.trim(),
            country: country.trim(),

            availability,
            response_time: responseTime,

            years_experience:
              experience !== ""
                ? Number(experience)
                : null,

            hourly_rate:
              hourlyRate !== ""
                ? Number(hourlyRate)
                : null,

            education: education.trim(),

            linkedin_url: linkedin.trim(),

            website_url: website.trim(),

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
            full_name: fullName.trim(),
            bio: bio.trim(),
            location: location.trim(),
            country: country.trim(),
            website_url: website.trim(),
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

    await loadProfile();
  };

  const submitVerificationRequest = async () => {
    setMessage("");

    if (submittingVerification) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    if (!profile) {
      setMessage("Profile could not be loaded.");
      return;
    }

    if (!profile.verification_document_url) {
      setMessage(
        "Please upload your verification document before submitting your request."
      );
      return;
    }

    if (profile.verification_status === "pending") {
      setMessage(
        "Your verification request is already under review."
      );
      return;
    }

    if (
      profile.verification_status === "verified" ||
      profile.verified
    ) {
      setMessage(
        "Your freelancer profile is already verified."
      );
      return;
    }

    setSubmittingVerification(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        verification_status: "pending",
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
      setSubmittingVerification(false);
      return;
    }

    setMessage(
      "Verification request submitted successfully."
    );

    setSubmittingVerification(false);
    await loadProfile();
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  const isFreelancer = role === "freelancer";
  const isClient = role === "client";

  const profileSkills = skills
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const verificationStatus =
    profile?.verified ||
    profile?.verification_status === "verified"
      ? "verified"
      : profile?.verification_status || "not_submitted";

  return (
    <main className="profile-settings-page">
      <section className="profile-settings-hero dark-card">
        <p className="dashboard-badge">
          Profile Settings
        </p>

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

      {isFreelancer && (
        <ProfileCompletionCard
          fullName={fullName}
          headline={headline}
          bio={bio}
          category={category}
          avatarUrl={profile?.avatar_url || undefined}
          cvUrl={profile?.cv_url || undefined}
          portfolioUrl={profile?.portfolio_url || undefined}
          skills={profileSkills}
          hourlyRate={
            hourlyRate !== ""
              ? Number(hourlyRate)
              : undefined
          }
          yearsExperience={
            experience !== ""
              ? Number(experience)
              : undefined
          }
        />
      )}

      {isFreelancer && (
        <section
          className="dark-card"
          style={{
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p className="dashboard-badge">
                Freelancer Verification
              </p>

              <h2
                style={{
                  marginTop: 8,
                  marginBottom: 8,
                }}
              >
                Verify your freelancer profile
              </h2>

              <p
                style={{
                  margin: 0,
                  maxWidth: 700,
                  opacity: 0.8,
                  lineHeight: 1.6,
                }}
              >
                Upload a valid identity document and submit your
                account for review by Freelance Hub SA.
              </p>
            </div>

            <div
              style={{
                padding: "9px 14px",
                borderRadius: 999,
                fontWeight: 800,
                background:
                  verificationStatus === "verified"
                    ? "rgba(34,197,94,.12)"
                    : verificationStatus === "pending"
                    ? "rgba(245,158,11,.12)"
                    : verificationStatus === "rejected"
                    ? "rgba(239,68,68,.12)"
                    : "rgba(148,163,184,.12)",
                color:
                  verificationStatus === "verified"
                    ? "#22c55e"
                    : verificationStatus === "pending"
                    ? "#f59e0b"
                    : verificationStatus === "rejected"
                    ? "#ef4444"
                    : "inherit",
              }}
            >
              {verificationStatus === "verified"
                ? "✓ Verified"
                : verificationStatus === "pending"
                ? "Pending Verification"
                : verificationStatus === "rejected"
                ? "Verification Rejected"
                : "Not Verified"}
            </div>
          </div>

          {verificationStatus !== "verified" && (
            <div
              style={{
                marginTop: 20,
                padding: 18,
                borderRadius: 14,
                background: "rgba(148,163,184,.06)",
                border: "1px solid rgba(148,163,184,.14)",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Identity Document
              </h3>

              <p
                style={{
                  opacity: 0.8,
                  lineHeight: 1.6,
                }}
              >
                Upload a clear copy of your South African ID,
                passport or another accepted identity document.
                This document is stored privately and is intended
                only for verification review.
              </p>

              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="form-input"
                disabled={uploadingVerification}
                onChange={(e) =>
                  handleVerificationDocumentUpload(
                    e.target.files?.[0]
                  )
                }
              />

              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  opacity: 0.7,
                }}
              >
                PDF, PNG, JPG or WEBP. Maximum file size: 8 MB.
              </p>

              {profile?.verification_document_url && (
                <p
                  style={{
                    marginTop: 12,
                    color: "#22c55e",
                    fontWeight: 700,
                  }}
                >
                  ✓ Verification document uploaded
                </p>
              )}

              {uploadingVerification && (
                <p style={{ marginTop: 12 }}>
                  Uploading verification document...
                </p>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: 20,
              padding: 18,
              borderRadius: 14,
              background: "rgba(148,163,184,.06)",
              border: "1px solid rgba(148,163,184,.14)",
            }}
          >
            {verificationStatus === "verified" ? (
              <>
                <strong
                  style={{
                    color: "#22c55e",
                  }}
                >
                  ✓ Your freelancer profile is verified.
                </strong>

                <p
                  style={{
                    margin: "8px 0 0",
                    opacity: 0.8,
                  }}
                >
                  Clients can identify your account as a verified
                  freelancer on Freelance Hub SA.
                </p>
              </>
            ) : verificationStatus === "pending" ? (
              <>
                <strong
                  style={{
                    color: "#f59e0b",
                  }}
                >
                  Verification under review
                </strong>

                <p
                  style={{
                    margin: "8px 0 0",
                    opacity: 0.8,
                  }}
                >
                  Your verification request has been submitted and
                  is waiting for admin review.
                </p>
              </>
            ) : verificationStatus === "rejected" ? (
              <>
                <strong
                  style={{
                    color: "#ef4444",
                  }}
                >
                  Verification requires attention
                </strong>

                <p
                  style={{
                    margin: "8px 0 16px",
                    opacity: 0.8,
                  }}
                >
                  Your previous verification request was not
                  approved. Upload an updated document if necessary
                  and submit your request again.
                </p>

                <button
                  type="button"
                  onClick={submitVerificationRequest}
                  disabled={
                    submittingVerification ||
                    !profile?.verification_document_url
                  }
                  className="primary-action-btn"
                >
                  {submittingVerification
                    ? "Submitting..."
                    : "Submit Again"}
                </button>
              </>
            ) : (
              <>
                <strong>
                  Verification has not been submitted yet.
                </strong>

                <p
                  style={{
                    margin: "8px 0 16px",
                    opacity: 0.8,
                    lineHeight: 1.6,
                  }}
                >
                  Upload your identity document first, then submit
                  your freelancer account for verification.
                </p>

                <button
                  type="button"
                  onClick={submitVerificationRequest}
                  disabled={
                    submittingVerification ||
                    !profile?.verification_document_url
                  }
                  className="primary-action-btn"
                >
                  {submittingVerification
                    ? "Submitting..."
                    : "Submit Verification Request"}
                </button>
              </>
            )}
          </div>
        </section>
      )}

      <section className="profile-settings-layout">
        <div className="dark-card profile-settings-card">
          <h2>Edit Profile</h2>

          <label className="form-label">
            Full Name
          </label>

          <input
            placeholder="Full name"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
            className="form-input"
          />

          <label className="form-label">
            {isFreelancer
              ? "Professional Bio"
              : "Client / Business Bio"}
          </label>

          <textarea
            placeholder={
              isFreelancer
                ? "Write a short professional bio..."
                : "Tell freelancers about your business or the type of projects you post..."
            }
            value={bio}
            onChange={(e) =>
              setBio(e.target.value)
            }
            className="form-input profile-textarea"
          />

          {isFreelancer && (
            <>
              <label className="form-label">
                Category
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="form-input"
              >
                <option value="">
                  Select category
                </option>

                <option value="Web Development">
                  Web Development
                </option>

                <option value="Mobile Development">
                  Mobile Development
                </option>

                <option value="Graphic Design">
                  Graphic Design
                </option>

                <option value="UI/UX Design">
                  UI/UX Design
                </option>

                <option value="Writing">
                  Writing
                </option>

                <option value="Video Editing">
                  Video Editing
                </option>

                <option value="Digital Marketing">
                  Digital Marketing
                </option>

                <option value="Engineering">
                  Engineering
                </option>

                <option value="CAD Drafting">
                  CAD Drafting
                </option>

                <option value="Data Entry">
                  Data Entry
                </option>

                <option value="Virtual Assistant">
                  Virtual Assistant
                </option>
              </select>

              <label className="form-label">
                Professional Headline
              </label>

              <input
                placeholder="Example: Mechanical Engineering Draughtsman"
                value={headline}
                onChange={(e) =>
                  setHeadline(e.target.value)
                }
                className="form-input"
              />

              <label className="form-label">
                Location
              </label>

              <input
                placeholder="Example: Johannesburg / Remote"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                className="form-input"
              />

              <label className="form-label">
                Years of Experience
              </label>

              <input
                type="number"
                min="0"
                placeholder="Example: 6"
                value={experience}
                onChange={(e) =>
                  setExperience(e.target.value)
                }
                className="form-input"
              />

              <label className="form-label">
                Hourly Rate (ZAR)
              </label>

              <input
                type="number"
                min="0"
                placeholder="Example: 350"
                value={hourlyRate}
                onChange={(e) =>
                  setHourlyRate(e.target.value)
                }
                className="form-input"
              />

              <label className="form-label">
                Skills
              </label>

              <input
                type="text"
                placeholder="Example: SolidWorks, Inventor, KeyCreator"
                value={skills}
                onChange={(e) =>
                  setSkills(e.target.value)
                }
                className="form-input"
              />

              <p
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  opacity: 0.75,
                }}
              >
                Separate multiple skills with commas.
              </p>

              <label className="form-label">
                Education
              </label>

              <textarea
                placeholder="Example: National Diploma in Mechanical Engineering"
                value={education}
                onChange={(e) =>
                  setEducation(e.target.value)
                }
                className="form-input profile-textarea"
              />

              <label className="form-label">
                Languages
              </label>

              <input
                type="text"
                placeholder="Example: English, isiZulu, Sesotho"
                value={languages}
                onChange={(e) =>
                  setLanguages(e.target.value)
                }
                className="form-input"
              />

              <label className="form-label">
                Certifications
              </label>

              <input
                type="text"
                placeholder="Example: SolidWorks CSWA, Autodesk Inventor"
                value={certifications}
                onChange={(e) =>
                  setCertifications(e.target.value)
                }
                className="form-input"
              />

              <label className="form-label">
                LinkedIn Profile
              </label>

              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={linkedin}
                onChange={(e) =>
                  setLinkedin(e.target.value)
                }
                className="form-input"
              />

              <label className="form-label">
                Website / Portfolio Link
              </label>

              <input
                type="url"
                placeholder="https://yourwebsite.co.za"
                value={website}
                onChange={(e) =>
                  setWebsite(e.target.value)
                }
                className="form-input"
              />
            </>
          )}

          {isClient && (
            <>
              <label className="form-label">
                Location
              </label>

              <input
                placeholder="Example: Johannesburg"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                className="form-input"
              />

              <label className="form-label">
                Country
              </label>

              <input
                value={country}
                onChange={(e) =>
                  setCountry(e.target.value)
                }
                className="form-input"
              />

              <label className="form-label">
                Website
              </label>

              <input
                type="url"
                placeholder="https://company.co.za"
                value={website}
                onChange={(e) =>
                  setWebsite(e.target.value)
                }
                className="form-input"
              />
            </>
          )}

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="primary-action-btn"
          >
            {saving
              ? "Saving..."
              : "Save Profile"}
          </button>

          {message && (
            <p className="upload-message">
              {message}
            </p>
          )}

          {isFreelancer && (
            <>
              <div className="profile-divider" />

              <h2>Upload Documents</h2>

              <label className="form-label">
                Profile Picture
              </label>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="form-input"
                onChange={(e) =>
                  handleAvatarUpload(
                    e.target.files?.[0]
                  )
                }
              />

              <label className="form-label">
                CV PDF
              </label>

              <input
                type="file"
                accept="application/pdf"
                className="form-input"
                onChange={(e) =>
                  handleCVUpload(
                    e.target.files?.[0]
                  )
                }
              />

              <label className="form-label">
                Portfolio PDF or Image
              </label>

              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="form-input"
                onChange={(e) =>
                  handlePortfolioUpload(
                    e.target.files?.[0]
                  )
                }
              />
            </>
          )}
        </div>

        <div className="dark-card profile-preview-card">
          <h2>
            {isFreelancer
              ? "Freelancer Preview"
              : "Client Preview"}
          </h2>

          {profile?.avatar_url && isFreelancer ? (
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

          <h3>
            {fullName || "Your Name"}
          </h3>

          <p>
            <strong>Account Type:</strong>{" "}
            {isClient
              ? "Client"
              : isFreelancer
              ? "Freelancer"
              : "User"}
          </p>

          {isFreelancer && (
            <>
              <p>
                <strong>Category:</strong>{" "}
                {category || "Not selected"}
              </p>

              {headline && (
                <p>
                  <strong>Headline:</strong>{" "}
                  {headline}
                </p>
              )}

              {location && (
                <p>
                  <strong>Location:</strong>{" "}
                  {location}
                </p>
              )}

              {experience !== "" && (
                <p>
                  <strong>Experience:</strong>{" "}
                  {experience}{" "}
                  {Number(experience) === 1
                    ? "year"
                    : "years"}
                </p>
              )}

              {hourlyRate !== "" && (
                <p>
                  <strong>Hourly Rate:</strong>{" "}
                  R
                  {Number(hourlyRate).toLocaleString(
                    "en-ZA"
                  )}
                  /hour
                </p>
              )}

              {verificationStatus === "verified" && (
                <p
                  style={{
                    color: "#22c55e",
                    fontWeight: 800,
                  }}
                >
                  ✓ Verified Freelancer
                </p>
              )}
            </>
          )}

          <p className="profile-preview-bio">
            {bio || "Your bio will appear here."}
          </p>

          {isFreelancer &&
            profileSkills.length > 0 && (
              <>
                <div className="profile-divider" />

                <h3>Skills</h3>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {profileSkills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        background:
                          "rgba(34,197,94,.10)",
                        border:
                          "1px solid rgba(34,197,94,.20)",
                        fontSize: 14,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            )}

          {isFreelancer && (
            <>
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
                    <p>
                      No documents uploaded yet.
                    </p>
                  )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}