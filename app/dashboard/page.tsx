"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <div
        style={{
          background:
            "linear-gradient(135deg, #2563eb, #0f172a)",
          color: "white",
          padding: 40,
          borderRadius: 18,
          marginBottom: 35,
        }}
      >
        <h1 style={{ fontSize: 42, marginBottom: 10 }}>
          Welcome to SA Freelancers
        </h1>

        <p style={{ fontSize: 18, maxWidth: 700 }}>
          Manage jobs, projects, payments, freelancers,
          and applications from one professional dashboard.
        </p>
      </div>

      <div style={grid}>
        <DashboardCard
          title="Browse Jobs"
          description="Find jobs posted by clients."
          href="/dashboard/jobs"
          emoji="💼"
        />

        <DashboardCard
          title="Projects"
          description="Manage active and completed projects."
          href="/dashboard/projects"
          emoji="📌"
        />

        <DashboardCard
          title="Favorites"
          description="View saved freelancers and jobs."
          href="/dashboard/favorites"
          emoji="❤️"
        />

        <DashboardCard
          title="Notifications"
          description="See platform alerts and updates."
          href="/dashboard/notifications"
          emoji="🔔"
        />

        <DashboardCard
          title="Profile"
          description="Update your freelancer profile."
          href="/dashboard/profile"
          emoji="👤"
        />

        <DashboardCard
          title="Uploads"
          description="Upload CVs and portfolio files."
          href="/dashboard/upload"
          emoji="📁"
        />
      </div>

      <section
        style={{
          marginTop: 50,
          background: "white",
          padding: 30,
          borderRadius: 18,
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ marginBottom: 20 }}>
          Platform Highlights
        </h2>

        <div style={grid}>
          <Highlight text="Secure PayFast payments" />
          <Highlight text="Freelancer applications" />
          <Highlight text="Professional messaging" />
          <Highlight text="Project management" />
          <Highlight text="Admin moderation" />
          <Highlight text="South African marketplace" />
        </div>
      </section>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  emoji,
}: {
  title: string;
  description: string;
  href: string;
  emoji: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={card}>
        <div style={{ fontSize: 38 }}>
          {emoji}
        </div>

        <h3 style={{ marginTop: 15 }}>
          {title}
        </h3>

        <p style={{ color: "#475569" }}>
          {description}
        </p>
      </div>
    </Link>
  );
}

function Highlight({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        background: "#eff6ff",
        padding: 16,
        borderRadius: 12,
        fontWeight: 500,
      }}
    >
      ✅ {text}
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 22,
};

const card = {
  background: "white",
  padding: 25,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  boxShadow:
    "0 10px 25px rgba(15,23,42,0.06)",
  transition: "0.2s",
};