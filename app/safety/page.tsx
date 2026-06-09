import Link from "next/link";

export default function SafetyPage() {
  return (
    <main className="safety-page">
      <section className="safety-hero dark-card">
        <p className="dashboard-badge">Trust & Safety</p>

        <h1>Keeping clients and freelancers safe</h1>

        <p>
          Freelance Hub SA is designed to promote professional relationships,
          secure hiring and responsible platform usage.
        </p>
      </section>

      <section className="safety-grid">
        <div className="dark-card safety-card">
          <h2>Verified Profiles</h2>
          <p>
            Complete profiles help build trust and improve hiring decisions.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Protected Communication</h2>
          <p>
            Users are encouraged to keep communication inside the platform.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Contracts</h2>
          <p>
            Contracts help define responsibilities and provide transparency.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Reporting Tools</h2>
          <p>
            Suspicious activity can be reported for review by administrators.
          </p>
        </div>
      </section>

      <section className="home-cta dark-card">
        <h2>Work with confidence</h2>

        <p>
          Join a marketplace focused on professionalism, transparency and trust.
        </p>

        <Link href="/register" className="home-primary-btn">
          Create Account
        </Link>
      </section>
    </main>
  );
}