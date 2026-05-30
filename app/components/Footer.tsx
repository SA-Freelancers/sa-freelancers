import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div>
          <h2>SA Freelancers</h2>

          <p>
            South Africa’s modern freelance marketplace for trusted work,
            projects and opportunities.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <h3>Platform</h3>

            <Link href="/">Home</Link>
            <Link href="/search">Marketplace</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>

          <div>
            <h3>Account</h3>

            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 SA Freelancers. All rights reserved.
      </div>
    </footer>
  );
}