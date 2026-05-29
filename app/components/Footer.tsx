import Link from "next/link";

export default function Footer() {
  return (
    <footer style={footer}>
      <div style={grid}>
        <div>
          <h2>SA Freelancers</h2>
          <p>
            A South African freelance marketplace for clients and skilled
            professionals.
          </p>
        </div>

        <div>
          <h3>Platform</h3>
          <Link href="/search" style={link}>Search Marketplace</Link>
          <Link href="/dashboard/jobs" style={link}>Jobs</Link>
          <Link href="/register" style={link}>Create Account</Link>
        </div>

        <div>
          <h3>Trust</h3>
          <p>Secure payments</p>
          <p>Verified profiles</p>
          <p>Ratings & reviews</p>
        </div>
      </div>

      <div style={bottom}>
        © 2026 SA Freelancers. All rights reserved.
      </div>
    </footer>
  );
}

const footer = {
  background: "#0f172a",
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