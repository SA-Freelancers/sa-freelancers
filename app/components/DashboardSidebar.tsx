"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const links = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/projects", label: "Projects", icon: "📁" },
  { href: "/dashboard/post-job", label: "Post Job", icon: "➕" },
  { href: "/dashboard/favorites", label: "Favorites", icon: "❤️" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "🔔" },
  { href: "/dashboard/profile", label: "Profile Settings", icon: "👤" },
  { href: "/dashboard/upload", label: "Upload", icon: "⬆️" },
  { href: "/search", label: "Find Freelancers", icon: "🔍" },
  { href: "/dashboard/contracts", label: "Contracts", icon: "📄" },
  { href: "/dashboard/client-contracts", label: "Sent Contracts", icon: "📨" },
  { href: "/dashboard/client-contracts", label: "Sent Contracts", icon: "📨" },
  { href: "/dashboard/admin/reports", label: "Reports", icon: "🚩" },
  { href: "/dashboard/admin/moderation", label: "Moderation", icon: "🛡️" },
  { href: "/dashboard/admin/user-reports", label: "User Reports", icon: "🚩" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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
            (link.href !== "/dashboard" &&
              pathname.startsWith(link.href));

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

      <button
        onClick={handleLogout}
        className="dashboard-logout-btn"
      >
        🚪 Logout
      </button>
    </aside>
  );
}