"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      setDarkMode(true);
    }

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);

        if (session?.user) {
          await loadProfile(session.user.id);
          loadNotifications(session.user.id);
        } else {
          setRole("");
          setIsAdmin(false);
          setNotificationCount(0);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();

    setUser(data.user);

    if (data.user) {
      await loadProfile(data.user.id);
      loadNotifications(data.user.id);
    }

    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", userId)
      .single();

    setRole(data?.role || "");
    setIsAdmin(data?.is_admin || false);
  };

  const loadNotifications = async (userId: string) => {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    setNotificationCount(count || 0);
  };

  const closeMenu = () => setMenuOpen(false);

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
    const fullName = user?.user_metadata?.full_name || user?.email || "User";
    const names = fullName.trim().split(" ");

    if (names.length === 1) return names[0].charAt(0).toUpperCase();

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) return null;

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo" onClick={closeMenu}>
  <Image
    src="/freelancehubsa-navbar-dark.png"
    alt="Freelance Hub SA"
    width={360}
    height={85}
    priority
  />
</Link>

        <button
          className="navbar-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav className={`navbar-links ${menuOpen ? "navbar-mobile-open" : ""}`}>
          <Link href="/" onClick={closeMenu} className={`navbar-link ${pathname === "/" ? "active" : ""}`}>
            Home
          </Link>

          <Link href="/safety" onClick={closeMenu} className={`navbar-link ${pathname.startsWith("/safety") ? "active" : ""}`}>
            Safety
          </Link>

          <Link href="/contact" onClick={closeMenu} className={`navbar-link ${pathname.startsWith("/contact") ? "active" : ""}`}>
            Support
          </Link>

          {user && role === "freelancer" && (
            <Link href="/search" onClick={closeMenu} className={`navbar-link ${pathname.startsWith("/search") ? "active" : ""}`}>
              Marketplace
            </Link>
          )}

          {user && role === "client" && (
            <Link href="/dashboard/post-job" onClick={closeMenu} className="navbar-link">
              Post Job
            </Link>
          )}

          <button onClick={toggleDarkMode} className="navbar-dark-btn">
            {darkMode ? "☀️" : "🌙"}
          </button>

          {user ? (
            <>
              <Link href="/dashboard/notifications" onClick={closeMenu} className="navbar-notification">
                🔔
                {notificationCount > 0 && (
                  <span className="navbar-notification-badge">{notificationCount}</span>
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

                  {role === "freelancer" && (
                    <>
                      <Link href="/search" onClick={closeMenu}>
                        Marketplace
                      </Link>

                      <Link href="/dashboard/contracts" onClick={closeMenu}>
                        Contracts
                      </Link>

                      <Link href="/dashboard/projects" onClick={closeMenu}>
                        Projects
                      </Link>
                    </>
                  )}

                  {role === "client" && (
                    <>
                      <Link href="/dashboard/post-job" onClick={closeMenu}>
                        Post Job
                      </Link>

                      <Link href="/dashboard/jobs" onClick={closeMenu}>
                        My Jobs
                      </Link>

                      <Link href="/dashboard/client-contracts" onClick={closeMenu}>
                        Sent Contracts
                      </Link>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <Link href="/dashboard/admin" onClick={closeMenu}>
                        Admin
                      </Link>

                      <Link href="/dashboard/admin/moderation" onClick={closeMenu}>
                        Moderation
                      </Link>

                      <Link href="/dashboard/admin/user-reports" onClick={closeMenu}>
                        User Reports
                      </Link>
                    </>
                  )}

                  <button onClick={logout}>Logout</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="navbar-login-btn" onClick={closeMenu}>
                Login
              </Link>

              <Link href="/register" className="navbar-register-btn" onClick={closeMenu}>
                Create Account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}