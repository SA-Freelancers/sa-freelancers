"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <header className="navbar-wrapper">
      <div className="navbar-content">
        <Link href="/" className="navbar-logo">
          SA Freelancers
        </Link>

        <nav className="navbar-links">
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
        </nav>

        <div className="navbar-actions">
          <Link href="/login" className="navbar-login-btn">
            Login
          </Link>

          <Link href="/register" className="navbar-register-btn">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}