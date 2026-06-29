"use client";

type Props = {
  fullName?: string;
  headline?: string;
  bio?: string;
  category?: string;
  avatarUrl?: string;
  cvUrl?: string;
  portfolioUrl?: string;
  skills?: string[];
  hourlyRate?: number;
  yearsExperience?: number;
};

export default function ProfileCompletionCard({
  fullName,
  headline,
  bio,
  category,
  avatarUrl,
  cvUrl,
  portfolioUrl,
  skills,
  hourlyRate,
  yearsExperience,
}: Props) {
  const checks = [
    !!fullName,
    !!headline,
    !!bio,
    !!category,
    !!avatarUrl,
    !!cvUrl,
    !!portfolioUrl,
    !!skills?.length,
    !!hourlyRate,
    !!yearsExperience,
  ];

  const completed = checks.filter(Boolean).length;
  const percentage = Math.round((completed / checks.length) * 100);

  return (
    <section className="dark-card" style={{ padding: 24, marginBottom: 24 }}>
      <h2>Profile Completion</h2>
      <p>{percentage}% complete</p>

      <div
        style={{
          height: 12,
          width: "100%",
          background: "rgba(148,163,184,.25)",
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
          }}
        />
      </div>

      {percentage < 100 && (
        <p>
          Complete your profile to improve visibility and increase your chances
          of being hired.
        </p>
      )}
    </section>
  );
}