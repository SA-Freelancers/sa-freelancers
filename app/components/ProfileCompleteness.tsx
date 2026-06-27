"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Profile = {
  full_name?: string;
  bio?: string;
  category?: string;
  avatar_url?: string;
  cv_url?: string;
  portfolio_url?: string;
};

export default function ProfileCompleteness() {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    loadProfileCompleteness();
  }, []);

  const loadProfileCompleteness = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, bio, category, avatar_url, cv_url, portfolio_url")
      .eq("id", user.id)
      .single();

    if (!profile) return;

    const checks = [
      !!profile.full_name,
      !!profile.bio,
      !!profile.category,
      !!profile.avatar_url,
      !!profile.cv_url,
      !!profile.portfolio_url,
    ];

    const completed = checks.filter(Boolean).length;
    setPercentage(Math.round((completed / checks.length) * 100));
  };

  return (
    <section className="dark-card" style={{ padding: 24, marginBottom: 24 }}>
      <h2>Profile Completeness</h2>

      <p>{percentage}% complete</p>

      <div
        style={{
          width: "100%",
          height: 12,
          background: "rgba(148, 163, 184, 0.2)",
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
          }}
        />
      </div>

      {percentage < 100 && (
        <Link href="/dashboard/profile" className="primary-action-link">
          Complete Profile
        </Link>
      )}
    </section>
  );
}