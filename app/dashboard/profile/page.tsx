"use client";

import ProfileCompletionCard from "@/app/components/ProfileCompletionCard";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

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

  skills?: string[] | string | null;
  languages?: string[] | string | null;
  certifications?: string[] | string | null;
};

const BUILT_IN_AVATARS = [
  "/avatars/avatar-01.png",
  "/avatars/avatar-02.png",
  "/avatars/avatar-03.png",
  "/avatars/avatar-04.png",
  "/avatars/avatar-05.png",
  "/avatars/avatar-06.png",
  "/avatars/avatar-07.png",
  "/avatars/avatar-08.png",
];

function normaliseArray(
  value: string[] | string | null | undefined
): string[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === "string" &&
          item.trim().length > 0
      )
      .map((item) => item.trim());
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (item): item is string =>
              typeof item === "string" &&
              item.trim().length > 0
          )
          .map((item) => item.trim());
      }
    } catch {
      // Not JSON.
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");

  const [country, setCountry] =
    useState("South Africa");

  const [availability, setAvailability] =
    useState("Available");

  const [responseTime, setResponseTime] =
    useState("Within 2 hours");

  const [experience, setExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [education, setEducation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState("");
  const [certifications, setCertifications] =
    useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [uploadingCV, setUploadingCV] =
    useState(false);

  const [uploadingPortfolio, setUploadingPortfolio] =
    useState(false);

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(
          "Profile loading error:",
          error
        );

        setMessage(
          "Unable to load your profile."
        );

        return;
      }

      if (!data) {
        return;
      }

      const loadedProfile =
        data as Profile;

      setProfile(loadedProfile);

      setFullName(
        loadedProfile.full_name || ""
      );

      setRole(
        loadedProfile.role || ""
      );

      setBio(
        loadedProfile.bio || ""
      );

      setCategory(
        loadedProfile.category || ""
      );

      setHeadline(
        loadedProfile.headline || ""
      );

      setLocation(
        loadedProfile.location || ""
      );

      setCountry(
        loadedProfile.country ||
          "South Africa"
      );

      setAvailability(
        loadedProfile.availability ||
          "Available"
      );

      setResponseTime(
        loadedProfile.response_time ||
          "Within 2 hours"
      );

      setExperience(
        loadedProfile.years_experience !== null &&
          loadedProfile.years_experience !==
            undefined
          ? loadedProfile.years_experience.toString()
          : ""
      );

      setHourlyRate(
        loadedProfile.hourly_rate !== null &&
          loadedProfile.hourly_rate !== undefined
          ? loadedProfile.hourly_rate.toString()
          : ""
      );

      setEducation(
        loadedProfile.education || ""
      );

      setLinkedin(
        loadedProfile.linkedin_url || ""
      );

      setWebsite(
        loadedProfile.website_url || ""
      );

      setSkills(
        normaliseArray(
          loadedProfile.skills
        ).join(", ")
      );

      setLanguages(
        normaliseArray(
          loadedProfile.languages
        ).join(", ")
      );

      setCertifications(
        normaliseArray(
          loadedProfile.certifications
        ).join(", ")
      );
    } catch (error) {
      console.error(
        "Unexpected profile loading error:",
        error
      );

      setMessage(
        "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(
    file: File,
    folder: string,
    column:
      | "avatar_url"
      | "cv_url"
      | "portfolio_url"
  ) {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return false;
    }

    const fileExt =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "file";

    const filePath =
      `${folder}/${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } =
      await supabase.storage
        .from("uploads")
        .upload(
          filePath,
          file,
          {
            upsert: true,
          }
        );

    if (uploadError) {
      setMessage(
        uploadError.message
      );

      return false;
    }

    const { data: publicUrlData } =
      supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

    const publicUrl =
      publicUrlData.publicUrl;

    const { error: updateError } =
      await supabase
        .from("profiles")
        .update({
          [column]: publicUrl,
        })
        .eq("id", user.id);

    if (updateError) {
      setMessage(
        updateError.message
      );

      return false;
    }

    await loadProfile();

    return true;
  }

  async function handleAvatarUpload(
    file?: File
  ) {
    if (!file) {
      return;
    }

    if (
      ![
        "image/png",
        "image/jpeg",
        "image/webp",
      ].includes(file.type)
    ) {
      setMessage(
        "Profile image must be PNG, JPG or WEBP."
      );

      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage(
        "Profile image must be smaller than 5 MB."
      );

      return;
    }

    setUploadingAvatar(true);

    try {
      const success =
        await uploadFile(
          file,
          "avatars",
          "avatar_url"
        );

      if (success) {
        setMessage(
          "Profile image updated successfully."
        );
      }
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function selectBuiltInAvatar(
    avatarUrl: string
  ) {
    setMessage("");
    setUploadingAvatar(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(
          "Please login first."
        );

        return;
      }

      const { error } =
        await supabase
          .from("profiles")
          .update({
            avatar_url:
              avatarUrl,
          })
          .eq(
            "id",
            user.id
          );

      if (error) {
        setMessage(
          error.message
        );

        return;
      }

      setProfile(
        (current) =>
          current
            ? {
                ...current,
                avatar_url:
                  avatarUrl,
              }
            : current
      );

      setMessage(
        "Avatar selected successfully."
      );
    } catch (error) {
      console.error(
        "Avatar selection error:",
        error
      );

      setMessage(
        "Unable to select avatar."
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleCVUpload(
    file?: File
  ) {
    if (!file) {
      return;
    }

    if (
      file.type !==
      "application/pdf"
    ) {
      setMessage(
        "CV must be a PDF file."
      );

      return;
    }

    setUploadingCV(true);

    try {
      const success =
        await uploadFile(
          file,
          "cv",
          "cv_url"
        );

      if (success) {
        setMessage(
          "CV uploaded successfully."
        );
      }
    } finally {
      setUploadingCV(false);
    }
  }

  async function handlePortfolioUpload(
    file?: File
  ) {
    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setMessage(
        "Portfolio must be PDF, PNG, JPG or WEBP."
      );

      return;
    }

    setUploadingPortfolio(true);

    try {
      const success =
        await uploadFile(
          file,
          "portfolio",
          "portfolio_url"
        );

      if (success) {
        setMessage(
          "Portfolio uploaded successfully."
        );
      }
    } finally {
      setUploadingPortfolio(false);
    }
  }

  async function saveProfile() {
    setMessage("");

    if (!fullName.trim()) {
      setMessage(
        "Please enter your full name."
      );

      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(
          "Please login first."
        );

        return;
      }

      const updateData =
        role === "freelancer"
          ? {
              full_name:
                fullName.trim(),

              bio:
                bio.trim(),

              category,

              headline:
                headline.trim(),

              location:
                location.trim(),

              country:
                country.trim(),

              availability,

              response_time:
                responseTime,

              years_experience:
                experience !== ""
                  ? Number(
                      experience
                    )
                  : null,

              hourly_rate:
                hourlyRate !== ""
                  ? Number(
                      hourlyRate
                    )
                  : null,

              education:
                education.trim(),

              linkedin_url:
                linkedin.trim(),

              website_url:
                website.trim(),

              skills:
                skills
                  .split(",")
                  .map((item) =>
                    item.trim()
                  )
                  .filter(Boolean),

              languages:
                languages
                  .split(",")
                  .map((item) =>
                    item.trim()
                  )
                  .filter(Boolean),

              certifications:
                certifications
                  .split(",")
                  .map((item) =>
                    item.trim()
                  )
                  .filter(Boolean),
            }
          : {
              full_name:
                fullName.trim(),

              bio:
                bio.trim(),

              location:
                location.trim(),

              country:
                country.trim(),

              website_url:
                website.trim(),
            };

      const { error } =
        await supabase
          .from("profiles")
          .update(updateData)
          .eq(
            "id",
            user.id
          );

      if (error) {
        setMessage(
          error.message
        );

        return;
      }

      setMessage(
        "Profile updated successfully!"
      );

      await loadProfile();
    } catch (error) {
      console.error(
        "Profile saving error:",
        error
      );

      setMessage(
        "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <LoadingSkeleton />
    );
  }

  const isFreelancer =
    role === "freelancer";

  const isClient =
    role === "client";

  const profileSkills =
    skills
      .split(",")
      .map((item) =>
        item.trim()
      )
      .filter(Boolean);

  return (
    <main className="profile-settings-page">

      {/* HERO */}

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
            ? "Update your professional information, skills, profile image and portfolio to attract more clients."
            : "Update your client information so freelancers understand who they are working with."}
        </p>
      </section>


      {/* PROFILE COMPLETION */}

      {isFreelancer && (
        <ProfileCompletionCard
          fullName={
            fullName
          }
          headline={
            headline
          }
          bio={bio}
          category={
            category
          }
          avatarUrl={
            profile?.avatar_url ||
            undefined
          }
          cvUrl={
            profile?.cv_url ||
            undefined
          }
          portfolioUrl={
            profile?.portfolio_url ||
            undefined
          }
          skills={
            profileSkills
          }
          hourlyRate={
            hourlyRate !== ""
              ? Number(
                  hourlyRate
                )
              : undefined
          }
          yearsExperience={
            experience !== ""
              ? Number(
                  experience
                )
              : undefined
          }
        />
      )}


      {/* PRIVACY */}

      {isFreelancer && (
        <section
          className="dark-card"
          style={{
            padding: 20,
            marginBottom: 24,
          }}
        >
          <p className="dashboard-badge">
            Profile Privacy
          </p>

          <h2
            style={{
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            Choose how you present yourself
          </h2>

          <p
            style={{
              margin: 0,
              opacity: 0.8,
              lineHeight: 1.6,
              maxWidth: 760,
            }}
          >
            You do not need to upload an ID or
            passport to build your freelancer
            profile. You may upload your own
            picture or choose one of the
            Freelance Hub SA avatars.
          </p>
        </section>
      )}


      <section className="profile-settings-layout">

        {/* EDIT PROFILE */}

        <div className="dark-card profile-settings-card">
          <h2>
            Edit Profile
          </h2>

          <label className="form-label">
            Full Name
          </label>

          <input
            placeholder="Full name"
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target.value
              )
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
            onChange={(event) =>
              setBio(
                event.target.value
              )
            }
            className="form-input profile-textarea"
          />


          {/* FREELANCER FIELDS */}

          {isFreelancer && (
            <>
              <label className="form-label">
                Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
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
                onChange={(event) =>
                  setHeadline(
                    event.target.value
                  )
                }
                className="form-input"
              />

              <label className="form-label">
                Location
              </label>

              <input
                placeholder="Example: Johannesburg / Remote"
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
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
                onChange={(event) =>
                  setExperience(
                    event.target.value
                  )
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
                onChange={(event) =>
                  setHourlyRate(
                    event.target.value
                  )
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
                onChange={(event) =>
                  setSkills(
                    event.target.value
                  )
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
                onChange={(event) =>
                  setEducation(
                    event.target.value
                  )
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
                onChange={(event) =>
                  setLanguages(
                    event.target.value
                  )
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
                onChange={(event) =>
                  setCertifications(
                    event.target.value
                  )
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
                onChange={(event) =>
                  setLinkedin(
                    event.target.value
                  )
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
                onChange={(event) =>
                  setWebsite(
                    event.target.value
                  )
                }
                className="form-input"
              />
            </>
          )}


          {/* CLIENT FIELDS */}

          {isClient && (
            <>
              <label className="form-label">
                Location
              </label>

              <input
                placeholder="Example: Johannesburg"
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }
                className="form-input"
              />

              <label className="form-label">
                Country
              </label>

              <input
                value={country}
                onChange={(event) =>
                  setCountry(
                    event.target.value
                  )
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
                onChange={(event) =>
                  setWebsite(
                    event.target.value
                  )
                }
                className="form-input"
              />
            </>
          )}


          <button
            type="button"
            onClick={
              saveProfile
            }
            disabled={
              saving
            }
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


          {/* PROFILE IMAGE AND DOCUMENTS */}

          {isFreelancer && (
            <>
              <div className="profile-divider" />

              <h2>
                Profile Image & Documents
              </h2>


              {/* PROFILE IMAGE */}

              <label className="form-label">
                Profile Image
              </label>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: 18,
                  fontSize: 14,
                  opacity: 0.75,
                  lineHeight: 1.6,
                }}
              >
                Choose how you want to appear on
                Freelance Hub SA. Upload your own
                picture or choose a professional
                avatar.
              </p>


              {/* CURRENT PROFILE IMAGE */}

              {profile?.avatar_url && (
                <div
                  style={{
                    marginBottom: 22,
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    Current Profile Image
                  </p>

                  <img
                    src={
                      profile.avatar_url
                    }
                    alt="Current profile"
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border:
                        "3px solid rgba(34, 197, 94, 0.65)",
                    }}
                  />
                </div>
              )}


              {/* UPLOAD OWN PICTURE */}

              <div
                style={{
                  padding: 18,
                  border:
                    "1px solid rgba(148, 163, 184, 0.18)",
                  borderRadius: 16,
                  marginBottom: 18,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontWeight: 800,
                  }}
                >
                  Option 1 — Upload My Picture
                </p>

                <p
                  style={{
                    fontSize: 14,
                    opacity: 0.7,
                    marginTop: 6,
                    marginBottom: 12,
                    lineHeight: 1.5,
                  }}
                >
                  Upload your own photograph or
                  custom avatar. PNG, JPG and WEBP
                  images are accepted.
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="form-input"
                  disabled={
                    uploadingAvatar
                  }
                  onChange={(event) =>
                    void handleAvatarUpload(
                      event.target.files?.[0]
                    )
                  }
                />
              </div>


              {/* OR */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "20px 0",
                }}
              >
                <div
                  style={{
                    height: 1,
                    flex: 1,
                    background:
                      "rgba(148, 163, 184, 0.2)",
                  }}
                />

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    opacity: 0.65,
                  }}
                >
                  OR
                </span>

                <div
                  style={{
                    height: 1,
                    flex: 1,
                    background:
                      "rgba(148, 163, 184, 0.2)",
                  }}
                />
              </div>


              {/* BUILT-IN AVATARS */}

              <div
                style={{
                  padding: 18,
                  border:
                    "1px solid rgba(148, 163, 184, 0.18)",
                  borderRadius: 16,
                  marginBottom: 22,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontWeight: 800,
                  }}
                >
                  Option 2 — Choose an Avatar
                </p>

                <p
                  style={{
                    fontSize: 14,
                    opacity: 0.7,
                    marginTop: 6,
                    marginBottom: 18,
                    lineHeight: 1.5,
                  }}
                >
                  Prefer not to use your personal
                  picture? Select one of the
                  Freelance Hub SA avatars below.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(90px, 1fr))",
                    gap: 14,
                  }}
                >
                  {BUILT_IN_AVATARS.map(
                    (
                      avatarUrl,
                      index
                    ) => {
                      const selected =
                        profile?.avatar_url ===
                        avatarUrl;

                      return (
                        <button
                          key={
                            avatarUrl
                          }
                          type="button"
                          disabled={
                            uploadingAvatar
                          }
                          onClick={() =>
                            void selectBuiltInAvatar(
                              avatarUrl
                            )
                          }
                          title={`Choose Avatar ${
                            index + 1
                          }`}
                          aria-label={`Choose Avatar ${
                            index + 1
                          }`}
                          style={{
                            border:
                              selected
                                ? "3px solid #22c55e"
                                : "2px solid rgba(148, 163, 184, 0.2)",

                            background:
                              selected
                                ? "rgba(34, 197, 94, 0.08)"
                                : "transparent",

                            borderRadius: 16,
                            padding: 7,

                            cursor:
                              uploadingAvatar
                                ? "not-allowed"
                                : "pointer",

                            position:
                              "relative",

                            opacity:
                              uploadingAvatar
                                ? 0.7
                                : 1,

                            transition:
                              "transform 0.15s ease, border-color 0.15s ease",
                          }}
                        >
                          <img
                            src={
                              avatarUrl
                            }
                            alt={`Professional avatar ${
                              index + 1
                            }`}
                            style={{
                              display:
                                "block",
                              width:
                                "100%",
                              aspectRatio:
                                "1 / 1",
                              objectFit:
                                "cover",
                              borderRadius:
                                12,
                            }}
                          />

                          {selected && (
                            <span
                              style={{
                                position:
                                  "absolute",

                                top: 4,
                                right: 4,

                                width: 25,
                                height: 25,

                                display:
                                  "grid",

                                placeItems:
                                  "center",

                                borderRadius:
                                  "50%",

                                background:
                                  "#22c55e",

                                color:
                                  "#020617",

                                fontWeight:
                                  900,

                                fontSize:
                                  14,
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>

                <p
                  style={{
                    marginTop: 16,
                    marginBottom: 0,
                    fontSize: 13,
                    opacity: 0.65,
                    lineHeight: 1.5,
                  }}
                >
                  You can change your avatar or
                  replace it with your own picture
                  at any time.
                </p>
              </div>


              {uploadingAvatar && (
                <p
                  style={{
                    marginTop: 8,
                    marginBottom: 18,
                    opacity: 0.75,
                  }}
                >
                  Updating profile image...
                </p>
              )}


              {/* CV */}

              <label className="form-label">
                CV PDF
              </label>

              <input
                type="file"
                accept="application/pdf"
                className="form-input"
                disabled={
                  uploadingCV
                }
                onChange={(event) =>
                  void handleCVUpload(
                    event.target.files?.[0]
                  )
                }
              />

              {uploadingCV && (
                <p
                  style={{
                    marginTop: 8,
                    opacity: 0.75,
                  }}
                >
                  Uploading CV...
                </p>
              )}


              {/* PORTFOLIO */}

              <label className="form-label">
                Portfolio PDF or Image
              </label>

              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="form-input"
                disabled={
                  uploadingPortfolio
                }
                onChange={(event) =>
                  void handlePortfolioUpload(
                    event.target.files?.[0]
                  )
                }
              />

              {uploadingPortfolio && (
                <p
                  style={{
                    marginTop: 8,
                    opacity: 0.75,
                  }}
                >
                  Uploading portfolio...
                </p>
              )}
            </>
          )}
        </div>


        {/* PROFILE PREVIEW */}

        <div className="dark-card profile-preview-card">
          <h2>
            {isFreelancer
              ? "Freelancer Preview"
              : "Client Preview"}
          </h2>

          {profile?.avatar_url &&
          isFreelancer ? (
            <img
              src={
                profile.avatar_url
              }
              alt="Profile"
              className="profile-preview-avatar"
            />
          ) : (
            <div className="profile-preview-placeholder">
              👤
            </div>
          )}

          <h3>
            {fullName ||
              "Your Name"}
          </h3>

          <p>
            <strong>
              Account Type:
            </strong>{" "}
            {isClient
              ? "Client"
              : isFreelancer
              ? "Freelancer"
              : "User"}
          </p>

          {isFreelancer && (
            <>
              <p>
                <strong>
                  Category:
                </strong>{" "}
                {category ||
                  "Not selected"}
              </p>

              {headline && (
                <p>
                  <strong>
                    Headline:
                  </strong>{" "}
                  {headline}
                </p>
              )}

              {location && (
                <p>
                  <strong>
                    Location:
                  </strong>{" "}
                  {location}
                </p>
              )}

              {experience !== "" && (
                <p>
                  <strong>
                    Experience:
                  </strong>{" "}
                  {experience}{" "}
                  {Number(
                    experience
                  ) === 1
                    ? "year"
                    : "years"}
                </p>
              )}

              {hourlyRate !== "" && (
                <p>
                  <strong>
                    Hourly Rate:
                  </strong>{" "}
                  R
                  {Number(
                    hourlyRate
                  ).toLocaleString(
                    "en-ZA"
                  )}
                  /hour
                </p>
              )}
            </>
          )}

          <p className="profile-preview-bio">
            {bio ||
              "Your bio will appear here."}
          </p>

          {isFreelancer &&
            profileSkills.length >
              0 && (
              <>
                <div className="profile-divider" />

                <h3>
                  Skills
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {profileSkills.map(
                    (skill) => (
                      <span
                        key={
                          skill
                        }
                        style={{
                          padding:
                            "7px 10px",

                          borderRadius:
                            999,

                          background:
                            "rgba(34,197,94,.10)",

                          border:
                            "1px solid rgba(34,197,94,.20)",

                          fontSize:
                            14,
                        }}
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </>
            )}

          {isFreelancer && (
            <>
              <div className="profile-divider" />

              <h3>
                Documents
              </h3>

              <div className="profile-documents">
                {profile?.cv_url && (
                  <a
                    href={
                      profile.cv_url
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    View CV
                  </a>
                )}

                {profile?.portfolio_url && (
                  <a
                    href={
                      profile.portfolio_url
                    }
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