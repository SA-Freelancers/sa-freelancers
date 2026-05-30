import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div className="footer-brand">
          <h2>SA Freelancers</h2>

          <p>
            South Africa’s modern freelance marketplace for trusted work,
            projects, hiring and opportunities.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <h3>Platform</h3>

            <Link href="/">Home</Link>
            <Link href="/search">Marketplace</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/jobs">Jobs</Link>
          </div>

          <div>
            <h3>Account</h3>

            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
            <Link href="/dashboard/upload">Upload</Link>
          </div>

          <div>
            <h3>Resources</h3>

            <Link href="/safety">Trust & Safety</Link>
            <Link href="/">Privacy Policy</Link>
            <Link href="/">Terms of Service</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 SA Freelancers. All rights reserved.
      </div>
    </footer>
  );
}