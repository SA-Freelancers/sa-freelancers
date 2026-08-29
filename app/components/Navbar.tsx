"use client";

import Image from "next/image";
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

type NavbarUser =
  | {
      id: string;
      email?: string | null;
      user_metadata?: {
        full_name?: string;
      };
    }
  | null;

export default function Navbar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    darkMode,
    setDarkMode,
  ] = useState(true);

  const [
    user,
    setUser,
  ] = useState<NavbarUser>(
    null
  );

  const [
    role,
    setRole,
  ] = useState("");

  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false);

  const [
    notificationCount,
    setNotificationCount,
  ] = useState(0);

  const [
    authReady,
    setAuthReady,
  ] = useState(false);

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    let mounted = true;

    const applySavedTheme =
      () => {
        try {
          const savedTheme =
            localStorage.getItem(
              "theme"
            );

          const shouldUseDark =
            savedTheme !==
            "light";

          if (
            shouldUseDark
          ) {
            document.documentElement.classList.add(
              "dark"
            );

            document.body.classList.add(
              "dark"
            );
          } else {
            document.documentElement.classList.remove(
              "dark"
            );

            document.body.classList.remove(
              "dark"
            );
          }

          if (
            mounted
          ) {
            setDarkMode(
              shouldUseDark
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Theme loading error:",
            error
          );

          document.documentElement.classList.add(
            "dark"
          );

          document.body.classList.add(
            "dark"
          );

          if (
            mounted
          ) {
            setDarkMode(
              true
            );
          }
        }
      };

    const loadInitialUser =
      async () => {
        try {
          const {
            data:
              sessionData,
          } =
            await supabase.auth.getSession();

          const sessionUser =
            sessionData
              .session
              ?.user ||
            null;

          if (
            !mounted
          ) {
            return;
          }

          setUser(
            sessionUser
          );

          if (
            sessionUser
          ) {
            await Promise.all([
              loadProfile(
                sessionUser.id
              ),

              loadNotifications(
                sessionUser.id
              ),
            ]);
          } else {
            setRole("");

            setIsAdmin(
              false
            );

            setNotificationCount(
              0
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Navbar user loading error:",
            error
          );

          if (
            mounted
          ) {
            setUser(
              null
            );

            setRole(
              ""
            );

            setIsAdmin(
              false
            );

            setNotificationCount(
              0
            );
          }
        } finally {
          if (
            mounted
          ) {
            setAuthReady(
              true
            );
          }
        }
      };

    applySavedTheme();

    void loadInitialUser();

    const {
      data:
        authListener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session
        ) => {
          if (
            !mounted
          ) {
            return;
          }

          const sessionUser =
            session?.user ||
            null;

          setUser(
            sessionUser
          );

          if (
            sessionUser
          ) {
            try {
              await Promise.all([
                loadProfile(
                  sessionUser.id
                ),

                loadNotifications(
                  sessionUser.id
                ),
              ]);
            } catch (
              error
            ) {
              console.error(
                "Navbar auth refresh error:",
                error
              );
            }
          } else {
            setRole(
              ""
            );

            setIsAdmin(
              false
            );

            setNotificationCount(
              0
            );
          }

          setAuthReady(
            true
          );
        }
      );

    return () => {
      mounted =
        false;

      authListener
        .subscription
        .unsubscribe();
    };
  }, []);

  // ==================================================
  // CLOSE MENU WHEN ROUTE CHANGES
  // ==================================================

  useEffect(() => {
    setMenuOpen(
      false
    );
  }, [pathname]);

  // ==================================================
  // LOAD PROFILE
  // ==================================================

  async function loadProfile(
    userId: string
  ) {
    const {
      data,
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
          userId
        )
        .maybeSingle();

    if (
      error
    ) {
      console.error(
        "Navbar profile loading error:",
        error
      );

      setRole(
        ""
      );

      setIsAdmin(
        false
      );

      return;
    }

    setRole(
      data?.role ||
        ""
    );

    setIsAdmin(
      Boolean(
        data?.is_admin
      )
    );
  }

  // ==================================================
  // LOAD NOTIFICATIONS
  // ==================================================

  async function loadNotifications(
    userId: string
  ) {
    const {
      count,
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .select(
          "*",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "user_id",
          userId
        )
        .eq(
          "is_read",
          false
        );

    if (
      error
    ) {
      console.error(
        "Navbar notification count error:",
        error
      );

      return;
    }

    setNotificationCount(
      count ||
        0
    );
  }

  // ==================================================
  // MENU
  // ==================================================

  const closeMenu =
    () => {
      setMenuOpen(
        false
      );
    };

  // ==================================================
  // THEME
  // ==================================================

  const toggleDarkMode =
    () => {
      const newMode =
        !darkMode;

      setDarkMode(
        newMode
      );

      if (
        newMode
      ) {
        document.documentElement.classList.add(
          "dark"
        );

        document.body.classList.add(
          "dark"
        );

        localStorage.setItem(
          "theme",
          "dark"
        );
      } else {
        document.documentElement.classList.remove(
          "dark"
        );

        document.body.classList.remove(
          "dark"
        );

        localStorage.setItem(
          "theme",
          "light"
        );
      }
    };

  // ==================================================
  // LOGOUT
  // ==================================================

  const logout =
    async () => {
      closeMenu();

      await supabase.auth.signOut();

      router.push(
        "/login"
      );

      router.refresh();
    };

  // ==================================================
  // INITIALS
  // ==================================================

  const getInitials =
    () => {
      const fullName =
        user
          ?.user_metadata
          ?.full_name ||
        user?.email ||
        "User";

      const names =
        fullName
          .trim()
          .split(/\s+/);

      if (
        names.length ===
        1
      ) {
        return names[0]
          .charAt(0)
          .toUpperCase();
      }

      return (
        names[0]
          .charAt(0) +
        names[
          names.length -
            1
        ].charAt(0)
      ).toUpperCase();
    };

  // ==================================================
  // UI
  // ==================================================

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* LOGO */}

        <Link
          href="/"
          className="navbar-logo"
          onClick={
            closeMenu
          }
        >
          <Image
            src="/freelancehubsa-navbar-dark.png"
            alt="Freelance Hub SA"
            width={430}
            height={100}
            priority
            className="navbar-logo-image"
          />
        </Link>

        {/* MOBILE MENU BUTTON */}

        <button
          type="button"
          className="navbar-menu-btn"
          onClick={() =>
            setMenuOpen(
              (
                previous
              ) =>
                !previous
            )
          }
          aria-label={
            menuOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={
            menuOpen
          }
        >
          {menuOpen
            ? "✕"
            : "☰"}
        </button>

        {/* NAVIGATION */}

        <nav
          className={`navbar-links ${
            menuOpen
              ? "navbar-mobile-open"
              : ""
          }`}
        >
          <Link
            href="/"
            onClick={
              closeMenu
            }
            className={`navbar-link ${
              pathname ===
              "/"
                ? "active"
                : ""
            }`}
          >
            Home
          </Link>

          <Link
            href="/safety"
            onClick={
              closeMenu
            }
            className={`navbar-link ${
              pathname.startsWith(
                "/safety"
              )
                ? "active"
                : ""
            }`}
          >
            Safety
          </Link>

          <Link
            href="/contact"
            onClick={
              closeMenu
            }
            className={`navbar-link ${
              pathname.startsWith(
                "/contact"
              )
                ? "active"
                : ""
            }`}
          >
            Support
          </Link>

          {/* AUTH-DEPENDENT LINKS */}

          {authReady &&
            user &&
            role ===
              "freelancer" && (
              <Link
                href="/search"
                onClick={
                  closeMenu
                }
                className={`navbar-link ${
                  pathname.startsWith(
                    "/search"
                  )
                    ? "active"
                    : ""
                }`}
              >
                Marketplace
              </Link>
            )}

          {authReady &&
            user &&
            role ===
              "client" && (
              <Link
                href="/dashboard/post-job"
                onClick={
                  closeMenu
                }
                className={`navbar-link ${
                  pathname.startsWith(
                    "/dashboard/post-job"
                  )
                    ? "active"
                    : ""
                }`}
              >
                Post Job
              </Link>
            )}

          {/* THEME */}

          <button
            type="button"
            onClick={
              toggleDarkMode
            }
            className="navbar-dark-btn"
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {darkMode
              ? "☀️"
              : "🌙"}
          </button>

          {/* AUTH AREA */}

          {!authReady ? (
            <div
              className="navbar-auth-loading"
              aria-hidden="true"
            >
              <span />
            </div>
          ) : user ? (
            <>
              {/* NOTIFICATIONS */}

              <Link
                href="/dashboard/notifications"
                onClick={
                  closeMenu
                }
                className="navbar-notification"
                aria-label={`Notifications: ${notificationCount} unread`}
              >
                🔔

                {notificationCount >
                  0 && (
                  <span className="navbar-notification-badge">
                    {
                      notificationCount
                    }
                  </span>
                )}
              </Link>

              {/* USER MENU */}

              <div className="navbar-user-menu">
                <button
                  type="button"
                  className="navbar-user"
                  aria-label="Open account menu"
                >
                  {getInitials()}
                </button>

                <div className="navbar-user-dropdown">
                  <Link
                    href="/dashboard"
                    onClick={
                      closeMenu
                    }
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/dashboard/profile"
                    onClick={
                      closeMenu
                    }
                  >
                    Profile
                  </Link>

                  {/* FREELANCER */}

                  {role ===
                    "freelancer" && (
                    <>
                      <Link
                        href="/search"
                        onClick={
                          closeMenu
                        }
                      >
                        Marketplace
                      </Link>

                      <Link
                        href="/dashboard/contracts"
                        onClick={
                          closeMenu
                        }
                      >
                        Contracts
                      </Link>

                      <Link
                        href="/dashboard/projects"
                        onClick={
                          closeMenu
                        }
                      >
                        Projects
                      </Link>
                    </>
                  )}

                  {/* CLIENT */}

                  {role ===
                    "client" && (
                    <>
                      <Link
                        href="/dashboard/post-job"
                        onClick={
                          closeMenu
                        }
                      >
                        Post Job
                      </Link>

                      <Link
                        href="/dashboard/jobs"
                        onClick={
                          closeMenu
                        }
                      >
                        My Jobs
                      </Link>

                      <Link
                        href="/dashboard/client-contracts"
                        onClick={
                          closeMenu
                        }
                      >
                        Sent
                        Contracts
                      </Link>
                    </>
                  )}

                  {/* ADMIN */}

                  {isAdmin && (
                    <>
                      <Link
                        href="/dashboard/admin"
                        onClick={
                          closeMenu
                        }
                      >
                        Admin
                      </Link>

                      <Link
                        href="/dashboard/admin/moderation"
                        onClick={
                          closeMenu
                        }
                      >
                        Moderation
                      </Link>

                      <Link
                        href="/dashboard/admin/user-reports"
                        onClick={
                          closeMenu
                        }
                      >
                        User
                        Reports
                      </Link>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={
                      logout
                    }
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="navbar-login-btn"
                onClick={
                  closeMenu
                }
              >
                Login
              </Link>

              <Link
                href="/register"
                className="navbar-register-btn"
                onClick={
                  closeMenu
                }
              >
                Create
                Account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}