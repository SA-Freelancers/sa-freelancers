"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/jobs", label: "Jobs" },
];

export default function Navbar() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      setDarkMode(true);
    }

    loadNotifications();

    const channel = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotificationCount(data?.length || 0);
  };

  const toggleDarkMode = () => {
    if (darkMode) {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar-container">
        <Link href="/" className="navbar-logo">
          SA Freelancers
        </Link>

        <button
          className="navbar-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <div
          className={`navbar-links ${
            menuOpen ? "navbar-mobile-open" : ""
          }`}
        >
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-link ${isActive ? "active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            href="/dashboard/notifications"
            className="navbar-notification"
          >
            🔔

            {notificationCount > 0 && (
              <span className="navbar-notification-badge">
                {notificationCount}
              </span>
            )}
          </Link>

          <button
            onClick={toggleDarkMode}
            className="navbar-dark-btn"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <Link href="/login" className="navbar-login-btn">
            Login
          </Link>

          <Link href="/register" className="navbar-register-btn">
            Register
          </Link>

          <button
            onClick={logout}
            className="navbar-logout-btn"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}