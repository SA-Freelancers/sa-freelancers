"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type SidebarLink = {
  href: string;
  label: string;
  icon: string;
};

const clientLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/post-job", label: "Post Job", icon: "➕" },
  { href: "/dashboard/jobs", label: "My Jobs", icon: "💼" },
  { href: "/dashboard/client-contracts", label: "Sent Contracts", icon: "📨" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "🔔" },
  { href: "/dashboard/profile", label: "Profile Settings", icon: "👤" },
];

const freelancerLinks: SidebarLink[] = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/search", label: "Marketplace", icon: "🔍" },
  { href: "/dashboard/contracts", label: "Contracts", icon: "📄" },
  { href: "/dashboard/favorites", label: "Favorites", icon: "❤️" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "🔔" },
  { href: "/dashboard/profile", label: "Profile Settings", icon: "👤" },
  { href: "/dashboard/upload", label: "Upload", icon: "⬆️" },
];

const adminLinks: SidebarLink[] = [
  { href: "/dashboard/admin", label: "Analytics", icon: "📊" },
  { href: "/dashboard/admin/users", label: "Users", icon: "👥" },
  { href: "/dashboard/admin/reports", label: "Reports", icon: "🚩" },
  { href: "/dashboard/admin/moderation", label: "Moderation", icon: "🛡️" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [role, setRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", user.id)
      .single();

    setRole(profile?.role || "");
    setIsAdmin(profile?.is_admin || false);
    setLoading(false);
  };

  const getLinks = () => {
    let baseLinks: SidebarLink[] = [];

    if (role === "client") {
      baseLinks = clientLinks;
    }

    if (role === "freelancer") {
      baseLinks = freelancerLinks;
    }

    if (isAdmin) {
      baseLinks = [...baseLinks, ...adminLinks];
    }

    return baseLinks;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <aside className="dashboard-sidebar dark-card">
        <p>Loading menu...</p>
      </aside>
    );
  }

  return (
    <aside className="dashboard-sidebar dark-card">
      <div>
        <h2>Dashboard</h2>
        <p>
          {role === "client"
            ? "Client workspace"
            : role === "freelancer"
            ? "Freelancer workspace"
            : "Manage your work"}
        </p>
      </div>

      <nav className="dashboard-sidebar-nav">
        {getLinks().map((link) => {
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

      <button onClick={handleLogout} className="dashboard-logout-btn">
        🚪 Logout
      </button>
    </aside>
  );
}