"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import {
  calculateProfileCompleteness,
  type ProfileCompletenessProfile,
} from "@/app/lib/profileCompleteness";

export default function ProfileCompleteness() {
  const [percentage, setPercentage] = useState(0);
  const [strength, setStrength] = useState("Needs Completion");
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileCompleteness();
  }, []);

  async function loadProfileCompleteness() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          `
            full_name,
            bio,
            category,
            avatar_url,
            headline,
            location,
            years_experience,
            hourly_rate,
            skills,
            education,
            certifications,
            cv_url,
            portfolio_url
          `
        )
        .eq("id", user.id)
        .single();
        const { count: portfolioProjectCount } =
  await supabase
    .from("portfolio_projects")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("freelancer_id", user.id);

      if (error || !profile) {
        console.error(
          "Could not load profile completeness:",
          error
        );

        setLoading(false);
        return;
      }

      const result =
  calculateProfileCompleteness({
    ...(profile as ProfileCompletenessProfile),
    portfolio_project_exists:
      (portfolioProjectCount ?? 0) > 0,
  });

      setPercentage(result.percentage);
      setStrength(result.strength);
      setMissing(result.missing);
    } catch (error) {
      console.error(
        "Profile completeness error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const fieldLabels: Record<string, string> = {
    fullName: "Full Name",
    photo: "Profile Photo",
    headline: "Professional Headline",
    bio: "Professional Bio",
    category: "Category",
    location: "Location",
    experience: "Experience",
    hourlyRate: "Hourly Rate",
    skills: "Skills",
    education: "Education",
    certifications: "Certifications",
    cv: "CV",
    portfolio: "Portfolio Upload",
  };

  if (loading) {
    return (
      <section
        className="dark-card"
        style={{
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2>Profile Completeness</h2>
        <p>Checking your profile...</p>
      </section>
    );
  }

  return (
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
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p className="dashboard-badge">
            Profile Completion
          </p>

          <h2>
            {percentage}% Complete
          </h2>
        </div>

        {percentage < 100 && (
          <Link
            href="/dashboard/freelancer/profile"
            className="primary-action-link"
          >
            Complete Profile
          </Link>
        )}
      </div>

      <div
        style={{
          width: "100%",
          height: 12,
          background:
            "rgba(148, 163, 184, 0.2)",
          borderRadius: 999,
          overflow: "hidden",
          margin: "14px 0",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: "#22c55e",
            borderRadius: 999,
            transition:
              "width 0.3s ease",
          }}
        />
      </div>

      <p>
        💪 Profile Strength:{" "}
        <strong>{strength}</strong>
      </p>

      {missing.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <strong>Missing:</strong>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {missing.map((field) => (
              <span
                key={field}
                className="dashboard-badge"
              >
                {fieldLabels[field] ??
                  field}
              </span>
            ))}
          </div>
        </div>
      )}

      {percentage === 100 && (
        <p
          className="upload-message"
          style={{ marginTop: 16 }}
        >
          🎉 Your freelancer profile is
          complete.
        </p>
      )}
    </section>
  );
}