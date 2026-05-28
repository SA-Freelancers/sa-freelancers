import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >
      {/* HERO SECTION */}
      <section
        style={{
          backgroundColor: "#111827",
          color: "white",
          padding: "80px 20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 48,
            marginBottom: 20,
          }}
        >
          Find Top Freelancers in South Africa
        </h1>

        <p
          style={{
            fontSize: 20,
            maxWidth: 700,
            margin: "0 auto 30px",
          }}
        >
          Hire developers, designers,
          writers, marketers and more.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 15,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/register"
            style={primaryButton}
          >
            Get Started
          </Link>

          <Link
            href="/search"
            style={secondaryButton}
          >
            Search Marketplace
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section
        style={{
          padding: "70px 20px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: 36,
            marginBottom: 50,
          }}
        >
          Why Choose SA Freelancers?
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 25,
          }}
        >
          <div style={cardStyle}>
            <h3>Verified Freelancers</h3>

            <p>
              Browse trusted professionals
              with portfolios and reviews.
            </p>
          </div>

          <div style={cardStyle}>
            <h3>Secure Messaging</h3>

            <p>
              Communicate safely inside the
              platform.
            </p>
          </div>

          <div style={cardStyle}>
            <h3>Ratings & Reviews</h3>

            <p>
              Hire freelancers with proven
              track records.
            </p>
          </div>

          <div style={cardStyle}>
            <h3>South African Focus</h3>

            <p>
              Built specifically for local
              businesses and freelancers.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        style={{
          backgroundColor: "white",
          padding: "70px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: 36,
              marginBottom: 50,
            }}
          >
            How It Works
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 25,
            }}
          >
            <div style={cardStyle}>
              <h3>1. Post a Job</h3>

              <p>
                Clients post projects and
                requirements.
              </p>
            </div>

            <div style={cardStyle}>
              <h3>2. Receive Applications</h3>

              <p>
                Freelancers apply with
                proposals and pricing.
              </p>
            </div>

            <div style={cardStyle}>
              <h3>3. Hire Talent</h3>

              <p>
                Review profiles, portfolios
                and ratings.
              </p>
            </div>

            <div style={cardStyle}>
              <h3>4. Complete Projects</h3>

              <p>
                Collaborate and grow your
                business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          backgroundColor: "#111827",
          color: "white",
          textAlign: "center",
          padding: "70px 20px",
        }}
      >
        <h2
          style={{
            fontSize: 40,
            marginBottom: 20,
          }}
        >
          Ready to Start?
        </h2>

        <p
          style={{
            fontSize: 18,
            marginBottom: 30,
          }}
        >
          Join South Africa’s growing
          freelance marketplace today.
        </p>

        <Link
          href="/register"
          style={primaryButton}
        >
          Create Account
        </Link>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: 20,
          textAlign: "center",
          backgroundColor: "#f3f4f6",
        }}
      >
        <p>
          © 2026 SA Freelancers. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}

const primaryButton = {
  backgroundColor: "#2563eb",
  color: "white",
  padding: "14px 24px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: "bold",
};

const secondaryButton = {
  backgroundColor: "white",
  color: "#111827",
  padding: "14px 24px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: "bold",
};

const cardStyle = {
  backgroundColor: "white",
  padding: 25,
  borderRadius: 10,
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.08)",
};