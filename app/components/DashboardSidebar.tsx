"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/app/lib/supabase";

type SidebarLink = {
  href: string;
  label: string;
  icon: string;
};

// ==================================================
// CLIENT LINKS
// ==================================================

const clientLinks:
  SidebarLink[] = [
  {
    href:
      "/dashboard",
    label:
      "Overview",
    icon:
      "📊",
  },
  {
    href:
      "/freelancers",
    label:
      "Browse Freelancers",
    icon:
      "👨‍💻",
  },
  {
    href:
      "/dashboard/post-job",
    label:
      "Post Job",
    icon:
      "➕",
  },
  {
    href:
      "/dashboard/jobs",
    label:
      "My Jobs",
    icon:
      "💼",
  },
  {
    href:
      "/dashboard/client-contracts",
    label:
      "Sent Contracts",
    icon:
      "📨",
  },
  {
    href:
      "/dashboard/notifications",
    label:
      "Notifications",
    icon:
      "🔔",
  },
  {
    href:
      "/dashboard/profile",
    label:
      "Profile Settings",
    icon:
      "👤",
  },
];

// ==================================================
// FREELANCER LINKS
// ==================================================

const freelancerLinks:
  SidebarLink[] = [
  {
    href:
      "/dashboard",
    label:
      "Overview",
    icon:
      "📊",
  },
  {
    href:
      "/search",
    label:
      "Browse Jobs",
    icon:
      "💼",
  },
  {
    href:
      "/dashboard/contracts",
    label:
      "Contracts",
    icon:
      "📄",
  },
  {
    href:
      "/dashboard/freelancer/earnings",
    label:
      "My Earnings",
    icon:
      "💰",
  },
  {
    href:
      "/dashboard/favorites",
    label:
      "Favorites",
    icon:
      "❤️",
  },
  {
    href:
      "/dashboard/notifications",
    label:
      "Notifications",
    icon:
      "🔔",
  },
  {
    href:
      "/dashboard/profile",
    label:
      "Profile Settings",
    icon:
      "👤",
  },
  {
    href:
      "/dashboard/upload",
    label:
      "Upload",
    icon:
      "⬆️",
  },
  {
    href:
      "/dashboard/portfolio",
    label:
      "Portfolio",
    icon:
      "🖼️",
  },
];

// ==================================================
// ADMIN LINKS
// ==================================================

const adminLinks:
  SidebarLink[] = [
  {
    href:
      "/dashboard/admin",
    label:
      "Analytics",
    icon:
      "📊",
  },
  {
    href:
      "/dashboard/admin/users",
    label:
      "Users",
    icon:
      "👥",
  },
  {
    href:
      "/dashboard/admin/reports",
    label:
      "Reports",
    icon:
      "🚩",
  },
  {
    href:
      "/dashboard/admin/moderation",
    label:
      "Moderation",
    icon:
      "🛡️",
  },
  {
    href:
      "/dashboard/admin/messages",
    label:
      "Messages",
    icon:
      "✉️",
  },
  {
    href:
      "/dashboard/admin/conversations",
    label:
      "Conversations",
    icon:
      "💬",
  },
  {
    href:
      "/dashboard/admin/email",
    label:
      "Send Email",
    icon:
      "📧",
  },
  {
    href:
      "/dashboard/admin/jobs",
    label:
      "Jobs",
    icon:
      "💼",
  },
  {
    href:
      "/dashboard/admin/payouts",
    label:
      "Payouts",
    icon:
      "💳",
  },
  {
    href:
      "/dashboard/admin/finance",
    label:
      "Financial Reconciliation",
    icon:
      "💰",
  },
  {
    href:
      "/dashboard/admin/marketplace-health",
    label:
      "Marketplace Health",
    icon:
      "📊",
  },
];

// ==================================================
// COMPONENT
// ==================================================

export default function DashboardSidebar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    role,
    setRole,
  ] = useState("");

  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ==================================================
  // DETERMINE ACTIVE PLATFORM
  // ==================================================

  const isAdminPlatform =
    isAdmin &&
    pathname.startsWith(
      "/dashboard/admin"
    );

  // ==================================================
  // LOAD PROFILE
  // ==================================================

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile =
    async () => {
      try {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          setLoading(
            false
          );

          return;
        }

        const {
          data:
            profile,

          error,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "role, is_admin"
            )
            .eq(
              "id",
              user.id
            )
            .single();

        if (error) {
          console.error(
            "Sidebar profile loading error:",
            error
          );

          setLoading(
            false
          );

          return;
        }

        setRole(
          profile?.role ||
            ""
        );

        setIsAdmin(
          Boolean(
            profile?.is_admin
          )
        );
      } catch (error) {
        console.error(
          "Sidebar loading error:",
          error
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  // ==================================================
  // SELECT SIDEBAR LINKS
  // ==================================================

  const getLinks =
    (): SidebarLink[] => {
      /*
       * IMPORTANT:
       *
       * Admin links are NEVER appended to
       * Client or Freelancer links.
       *
       * The active route decides whether an
       * administrator is currently using the
       * Admin Platform.
       */

      if (
        isAdminPlatform
      ) {
        return adminLinks;
      }

      if (
        role ===
        "client"
      ) {
        return clientLinks;
      }

      if (
        role ===
        "freelancer"
      ) {
        return freelancerLinks;
      }

      return [];
    };

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout =
    async () => {
      await supabase.auth.signOut();

      router.push(
        "/login"
      );

      router.refresh();
    };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <aside className="dashboard-sidebar dark-card">
        <p>
          Loading menu...
        </p>
      </aside>
    );
  }

  // ==================================================
  // WORKSPACE TITLE
  // ==================================================

  const workspaceTitle =
    isAdminPlatform
      ? "Admin"
      : role ===
        "client"
      ? "Client"
      : role ===
        "freelancer"
      ? "Freelancer"
      : "Dashboard";

  const workspaceDescription =
    isAdminPlatform
      ? "Administrator workspace"
      : role ===
        "client"
      ? "Client workspace"
      : role ===
        "freelancer"
      ? "Freelancer workspace"
      : "Manage your work";

  // ==================================================
  // UI
  // ==================================================

  return (
    <aside className="dashboard-sidebar dark-card">

      {/* WORKSPACE HEADING */}

      <div>
        <h2>
          {workspaceTitle}
        </h2>

        <p>
          {
            workspaceDescription
          }
        </p>
      </div>

      {/* NAVIGATION */}

      <nav className="dashboard-sidebar-nav">
        {getLinks().map(
          (link) => {
            /*
             * Analytics /dashboard/admin should
             * only be active on the exact admin
             * dashboard page.
             *
             * Other links use startsWith so their
             * nested pages remain highlighted.
             */

            const isAdminHome =
              link.href ===
              "/dashboard/admin";

            const isDashboardHome =
              link.href ===
              "/dashboard";

            let isActive =
              false;

            if (
              isAdminHome ||
              isDashboardHome
            ) {
              isActive =
                pathname ===
                link.href;
            } else {
              isActive =
                pathname ===
                  link.href ||
                pathname.startsWith(
                  `${link.href}/`
                );
            }

            return (
              <Link
                key={
                  link.href
                }
                href={
                  link.href
                }
                className={
                  isActive
                    ? "active"
                    : ""
                }
              >
                <span>
                  {
                    link.icon
                  }
                </span>

                {
                  link.label
                }
              </Link>
            );
          }
        )}
      </nav>

      {/* LOGOUT */}

      <button
        type="button"
        onClick={
          handleLogout
        }
        className="dashboard-logout-btn"
      >
        🚪 Logout
      </button>
    </aside>
  );
}