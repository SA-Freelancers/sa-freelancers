import Link from "next/link";

export default function Footer() {
  return (
    <footer style={footer}>
      <div style={grid}>
        <div>
          <h2 style={{ color: "white" }}>SA Freelancers</h2>

          <p style={{ color: "#cbd5e1" }}>
            A South African freelance marketplace for clients and skilled
            professionals.
          </p>
        </div>

        <div>
          <h3 style={{ color: "white" }}>Platform</h3>

          <Link href="/search" style={link}>
            Search Marketplace
          </Link>

          <Link href="/dashboard/jobs" style={link}>
            Jobs
          </Link>

          <Link href="/register" style={link}>
            Create Account
          </Link>
        </div>

        <div>
          <h3 style={{ color: "white" }}>Trust</h3>

          <p style={{ color: "#cbd5e1" }}>Secure payments</p>
          <p style={{ color: "#cbd5e1" }}>Verified profiles</p>
          <p style={{ color: "#cbd5e1" }}>Ratings & reviews</p>
        </div>
      </div>

      <div style={bottom}>
        © 2026 SA Freelancers. All rights reserved.
      </div>
    </footer>
  );
}

const footer = {
  background: "#020617",
  color: "white",
  padding: "45px 25px 20px",
};

const grid = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 30,
};

const link = {
  display: "block",
  color: "#cbd5e1",
  textDecoration: "none",
  marginBottom: 10,
};

const bottom = {
  maxWidth: 1200,
  margin: "30px auto 0",
  borderTop: "1px solid #334155",
  paddingTop: 18,
  color: "#94a3b8",
};