"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Marketplace" },
  { href: "/safety", label: "Safety" },
  { href: "/contact", label: "Support" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/jobs", label: "Jobs" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      setDarkMode(true);
    }

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      setUser(data.user);

      if (data.user) {
        loadNotifications(data.user.id);
      }

      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);

        if (session?.user) {
          loadNotifications(session.user.id);
        } else {
          setNotificationCount(0);
        }
      }
    );

    const channel = supabase
      .channel("navbar-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          if (user?.id) {
            loadNotifications(user.id);
          }
        }
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadNotifications = async (userId: string) => {
    const { count } = await supabase
      .from("notifications")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    setNotificationCount(count || 0);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const logout = async () => {
    closeMenu();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getInitials = () => {
    const fullName =
      user?.user_metadata?.full_name ||
      user?.email ||
      "User";

    const names = fullName.trim().split(" ");

    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return (
      names[0].charAt(0) +
      names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  if (loading) return null;

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo" onClick={closeMenu}>
          <span>SA</span> Freelancers
        </Link>

        <button
          className="navbar-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav className={`navbar-links ${menuOpen ? "navbar-mobile-open" : ""}`}>
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`navbar-link ${isActive ? "active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}

          <button onClick={toggleDarkMode} className="navbar-dark-btn">
            {darkMode ? "☀️" : "🌙"}
          </button>

          {user ? (
            <>
              <Link
                href="/dashboard/notifications"
                onClick={closeMenu}
                className="navbar-notification"
              >
                🔔
                {notificationCount > 0 && (
                  <span className="navbar-notification-badge">
                    {notificationCount}
                  </span>
                )}
              </Link>

              <div className="navbar-user-menu">
                <span className="navbar-user">{getInitials()}</span>

                <div className="navbar-user-dropdown">
                  <Link href="/dashboard" onClick={closeMenu}>
                    Dashboard
                  </Link>

                  <Link href="/dashboard/profile" onClick={closeMenu}>
                    Profile
                  </Link>

                  <Link href="/dashboard/projects" onClick={closeMenu}>
                    Projects
                  </Link>

                  <Link href="/dashboard/contracts" onClick={closeMenu}>
                    Contracts
                  </Link>

                  <Link href="/dashboard/client-contracts" onClick={closeMenu}>
                    Sent Contracts
                  </Link>
<Link href="/dashboard/admin" onClick={closeMenu}>
  Admin
</Link>
                  <button onClick={logout}>Logout</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="navbar-login-btn"
                onClick={closeMenu}
              >
                Login
              </Link>

              <Link
                href="/register"
                className="navbar-register-btn"
                onClick={closeMenu}
              >
                Create Account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}