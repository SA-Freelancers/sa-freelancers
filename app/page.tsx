import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", background: "#f8fafc" }}>
      <section
        style={{
          padding: "90px 20px",
          background: "linear-gradient(135deg, #0f172a, #2563eb)",
          color: "white",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 56, marginBottom: 20 }}>
          Hire Trusted Freelancers in South Africa
        </h1>

        <p style={{ fontSize: 20, maxWidth: 760, margin: "0 auto 35px" }}>
          Post jobs, receive proposals, manage projects, message freelancers,
          and pay securely on one professional platform.
        </p>

        <div style={{ display: "flex", gap: 15, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={primaryBtn}>
            Get Started
          </Link>

          <Link href="/search" style={secondaryBtn}>
            Search Marketplace
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "60px auto", padding: 20 }}>
        <h2 style={sectionTitle}>Popular Services</h2>

        <div style={grid}>
          {[
            "Web Development",
            "Graphic Design",
            "Writing",
            "Marketing",
            "Video Editing",
            "Engineering",
          ].map((item) => (
            <div key={item} style={card}>
              <h3>{item}</h3>
              <p>Find skilled freelancers for {item.toLowerCase()} projects.</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "white", padding: "70px 20px" }}>
        <h2 style={sectionTitle}>How It Works</h2>

        <div style={{ ...grid, maxWidth: 1100, margin: "0 auto" }}>
          <div style={card}>
            <h3>1. Post a Job</h3>
            <p>Clients create projects with budget, category, and details.</p>
          </div>

          <div style={card}>
            <h3>2. Get Proposals</h3>
            <p>Freelancers apply with pricing and cover messages.</p>
          </div>

          <div style={card}>
            <h3>3. Hire & Pay</h3>
            <p>Accept a freelancer, create a project, and pay securely.</p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "70px auto", padding: 20 }}>
        <h2 style={sectionTitle}>Why Users Trust Us</h2>

        <div style={grid}>
          <div style={card}>
            <h3>Secure Payments</h3>
            <p>PayFast integration helps clients pay through the platform.</p>
          </div>

          <div style={card}>
            <h3>Reviews & Profiles</h3>
            <p>View freelancer profiles, portfolios, CVs, and ratings.</p>
          </div>

          <div style={card}>
            <h3>Controlled Messaging</h3>
            <p>Messaging helps reduce unsafe off-platform communication.</p>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "#0f172a",
          color: "white",
          textAlign: "center",
          padding: "70px 20px",
        }}
      >
        <h2 style={{ fontSize: 40 }}>Ready to build your next project?</h2>
        <p style={{ fontSize: 18, marginBottom: 30 }}>
          Join South Africa’s growing freelance marketplace.
        </p>

        <Link href="/register" style={primaryBtn}>
          Create Free Account
        </Link>
      </section>

      <footer style={{ padding: 25, textAlign: "center", background: "#e5e7eb" }}>
        © 2026 SA Freelancers. Built for South African talent.
      </footer>
    </main>
  );
}

const primaryBtn = {
  backgroundColor: "#22c55e",
  color: "white",
  padding: "14px 24px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: "bold",
};

const secondaryBtn = {
  backgroundColor: "white",
  color: "#0f172a",
  padding: "14px 24px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: "bold",
};

const sectionTitle = {
  textAlign: "center" as const,
  fontSize: 36,
  marginBottom: 35,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 22,
};

const card = {
  backgroundColor: "white",
  padding: 25,
  borderRadius: 14,
  boxShadow: "0 8px 25px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb",
};