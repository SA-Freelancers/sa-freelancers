import Link from "next/link";
import {
  FaWhatsapp,
  FaFacebook,
  FaLinkedin,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div className="footer-brand">
          <h2>Freelance Hub SA</h2>

          <p>
            South Africa's modern freelance marketplace for trusted work,
            projects, hiring and opportunities.
          </p>

          <div style={{ marginTop: "20px" }}>
            <p>📧 support@freelancehubsa.co.za</p>

            <p>💳 billing@freelancehubsa.co.za</p>

            <p>🔒 security@freelancehubsa.co.za</p>

            <div
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                marginTop: "16px",
                flexWrap: "wrap",
              }}
            >
              <a
                href="https://wa.me/27624494338"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#25D366",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                <FaWhatsapp size={22} />
                WhatsApp Support
              </a>

              <a
                href="https://www.facebook.com/share/1aZDto8cms/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#1877F2",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                <FaFacebook size={22} />
                Facebook
              </a>

              <a
                href="https://linkedin.com/company/freelance-hub-sa"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#0A66C2",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                <FaLinkedin size={22} />
                LinkedIn
              </a>
            </div>
          </div>
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
            <Link href="/register">Become a Freelancer</Link>
          </div>

          <div>
            <h3>Resources</h3>

            <Link href="/about">About Us</Link>
            <Link href="/safety">Trust & Safety</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/support">Support</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 Freelance Hub SA. All rights reserved.
      </div>
    </footer>
  );
}