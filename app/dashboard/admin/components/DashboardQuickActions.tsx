"use client";

import { useRouter } from "next/navigation";

export default function DashboardQuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Users",
      description: "Manage platform users",
      route: "/dashboard/admin/users",
      icon: "👥",
    },
    {
      title: "Jobs",
      description: "Manage job listings",
      route: "/dashboard/admin/jobs",
      icon: "💼",
    },
    {
      title: "Payments",
      description: "View transactions",
      route: "/dashboard/admin/payments",
      icon: "💰",
    },
    {
      title: "Reports",
      description: "Platform reports",
      route: "/dashboard/admin/reports",
      icon: "📊",
    },
    {
      title: "Generate Demo Data",
      description: "Create demo content",
      route: "/dashboard/admin/demo",
      icon: "⚡",
    },
    {
      title: "Settings",
      description: "Platform settings",
      route: "/dashboard/admin/settings",
      icon: "⚙️",
    },
    {
  title:"Analytics",
  description:"Platform statistics",
  route:"/dashboard/admin/analytics",
  icon:"📈",
},
{
  title: "Freelancers",
  description: "Manage freelancers",
  route: "/dashboard/admin/freelancers",
  icon: "🧑‍💻",
},
  ];

  return (
    <section
      className="dark-card"
      style={{
        padding: 24,
        marginTop: 24,
      }}
    >
      <h2>Quick Actions</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          marginTop: 20,
        }}
      >
        {actions.map((action) => (
          <div
            key={action.title}
            className="dark-card"
            style={{
              padding: 20,
              cursor: "pointer",
              transition: ".2s",
            }}
            onClick={() => router.push(action.route)}
          >
            <div
              style={{
                fontSize: 36,
              }}
            >
              {action.icon}
            </div>

            <h3>{action.title}</h3>

            <p
              style={{
                opacity: .75,
              }}
            >
              {action.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}