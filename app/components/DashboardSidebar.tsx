"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/upload", label: "Upload" },
  { href: "/search", label: "Find Freelancers" },
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
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}