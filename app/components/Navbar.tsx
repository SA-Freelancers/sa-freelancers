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
      setLoading(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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
            <div className="navbar-user-menu">
              <span className="navbar-user">
                {getInitials()}
              </span>

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

                <button onClick={logout}>
                  Logout
                </button>
              </div>
            </div>
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