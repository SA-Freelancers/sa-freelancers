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
  const profileChecks = [
    {
      label: "Full Name",
      complete: !!fullName?.trim(),
    },
    {
      label: "Professional Headline",
      complete: !!headline?.trim(),
    },
    {
      label: "Professional Bio",
      complete: !!bio?.trim(),
    },
    {
      label: "Category",
      complete: !!category?.trim(),
    },
    {
      label: "Profile Picture",
      complete: !!avatarUrl?.trim(),
    },
    {
      label: "CV",
      complete: !!cvUrl?.trim(),
    },
    {
      label: "Portfolio",
      complete: !!portfolioUrl?.trim(),
    },
    {
      label: "Skills",
      complete: Array.isArray(skills) && skills.length > 0,
    },
    {
      label: "Hourly Rate",
      complete:
        typeof hourlyRate === "number" &&
        Number.isFinite(hourlyRate) &&
        hourlyRate > 0,
    },
    {
      label: "Years of Experience",
      complete:
        typeof yearsExperience === "number" &&
        Number.isFinite(yearsExperience) &&
        yearsExperience >= 0,
    },
  ];

  const completed = profileChecks.filter((item) => item.complete).length;

  const percentage = Math.round(
    (completed / profileChecks.length) * 100
  );

  const missingItems = profileChecks.filter(
    (item) => !item.complete
  );

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
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ marginBottom: 6 }}>
            Profile Completion
          </h2>

          <p style={{ margin: 0, opacity: 0.8 }}>
            {completed} of {profileChecks.length} profile requirements completed
          </p>
        </div>

        <strong
          style={{
            fontSize: 22,
            color: percentage === 100 ? "#22c55e" : "inherit",
          }}
        >
          {percentage}%
        </strong>
      </div>

      <div
        style={{
          height: 12,
          width: "100%",
          background: "rgba(148,163,184,.25)",
          borderRadius: 999,
          overflow: "hidden",
          margin: "18px 0",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: "#22c55e",
            borderRadius: 999,
            transition: "width .3s ease",
          }}
        />
      </div>

      {percentage === 100 ? (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            background: "rgba(34,197,94,.10)",
            border: "1px solid rgba(34,197,94,.25)",
          }}
        >
          <strong style={{ color: "#22c55e" }}>
            ✓ Your freelancer profile is complete.
          </strong>

          <p
            style={{
              margin: "6px 0 0",
              opacity: 0.8,
            }}
          >
            Your profile has all the main information clients need when
            reviewing freelancers.
          </p>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: 12 }}>
            Complete the following to reach 100%:
          </p>

          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            {missingItems.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(245,158,11,.08)",
                  border: "1px solid rgba(245,158,11,.18)",
                }}
              >
                <span
                  style={{
                    color: "#f59e0b",
                    fontWeight: 800,
                  }}
                >
                  !
                </span>

                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: 14,
              marginBottom: 0,
              opacity: 0.72,
              fontSize: 14,
            }}
          >
            A complete profile improves your visibility and helps clients
            understand your experience and services.
          </p>
        </div>
      )}
    </section>
  );
}