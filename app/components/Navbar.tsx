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
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return null;

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
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
                onClick={() => setMenuOpen(false)}
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
            <button onClick={logout} className="navbar-logout-btn">
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="navbar-login-btn">
                Login
              </Link>

              <Link href="/register" className="navbar-register-btn">
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}