import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero-section" style={hero}>
        <h1 style={{ fontSize: 56, marginBottom: 20 }}>
          Hire Trusted Freelancers in South Africa
        </h1>

        <p style={{ fontSize: 20, maxWidth: 760, margin: "0 auto 35px" }}>
          Post jobs, receive proposals, manage projects, message freelancers,
          and pay securely on one professional platform.
        </p>

        <div style={{ display: "flex", gap: 15, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={primaryBtn}>Get Started</Link>
          <Link href="/search" style={secondaryBtn}>Search Marketplace</Link>
        </div>
      </section>

      <section style={section}>
        <h2 style={sectionTitle}>Popular Services</h2>

        <div style={grid}>
          {["Web Development", "Graphic Design", "Writing", "Marketing", "Video Editing", "Engineering"].map((item) => (
            <div key={item} className="dark-card" style={card}>
              <h3>{item}</h3>
              <p>Find skilled freelancers for {item.toLowerCase()} projects.</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <h2 style={sectionTitle}>How It Works</h2>

        <div style={grid}>
          <div className="dark-card" style={card}>
            <h3>1. Post a Job</h3>
            <p>Clients create projects with budget, category, and details.</p>
          </div>

          <div className="dark-card" style={card}>
            <h3>2. Get Proposals</h3>
            <p>Freelancers apply with pricing and cover messages.</p>
          </div>

          <div className="dark-card" style={card}>
            <h3>3. Hire & Pay</h3>
            <p>Accept a freelancer and pay securely.</p>
          </div>
        </div>
      </section>

      <section style={section}>
        <h2 style={sectionTitle}>Why Users Trust Us</h2>

        <div style={grid}>
          <div className="dark-card" style={card}>
            <h3>Secure Payments</h3>
            <p>PayFast integration protects users.</p>
          </div>

          <div className="dark-card" style={card}>
            <h3>Reviews & Profiles</h3>
            <p>Ratings and portfolios improve trust.</p>
          </div>

          <div className="dark-card" style={card}>
            <h3>Protected Messaging</h3>
            <p>Safer communication between users.</p>
          </div>
        </div>
      </section>

      <section className="hero-section" style={cta}>
        <h2 style={{ fontSize: 40 }}>Ready to build your next project?</h2>
        <p style={{ fontSize: 18, marginBottom: 30 }}>
          Join South Africa’s growing freelance marketplace.
        </p>
        <Link href="/register" style={primaryBtn}>Create Free Account</Link>
      </section>
    </main>
  );
}

const hero = {
  padding: "90px 20px",
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  textAlign: "center" as const,
};

const section = {
  maxWidth: 1200,
  margin: "60px auto",
  padding: 20,
};

const cta = {
  background: "#0f172a",
  textAlign: "center" as const,
  padding: "70px 20px",
};

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
  padding: 25,
  borderRadius: 14,
  boxShadow: "0 8px 25px rgba(15, 23, 42, 0.08)",
};