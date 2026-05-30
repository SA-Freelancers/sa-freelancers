"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/projects", label: "Projects", icon: "📁" },
  { href: "/dashboard/jobs/new", label: "Post Job", icon: "➕" },
  { href: "/dashboard/favorites", label: "Favorites", icon: "❤️" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "🔔" },
  { href: "/dashboard/profile", label: "Profile Settings", icon: "👤" },
  { href: "/dashboard/upload", label: "Upload", icon: "⬆️" },
  { href: "/search", label: "Find Freelancers", icon: "🔍" },
];
export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar dark-card">
      <div>
        <h2>Dashboard</h2>
        <p>Manage your work</p>
      </div>

      <nav className="dashboard-sidebar-nav">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={isActive ? "active" : ""}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}