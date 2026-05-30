import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="safety-page">
      <section className="safety-hero dark-card">
        <p className="dashboard-badge">Support</p>

        <h1>Need help?</h1>

        <p>
          Contact the SA Freelancers support team for assistance with projects,
          proposals, profiles and platform safety.
        </p>
      </section>

      <section className="safety-grid">
        <div className="dark-card safety-card">
          <h2>Account Support</h2>

          <p>
            Get help with login issues, dashboard access and account management.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Project Assistance</h2>

          <p>
            Need help posting jobs, reviewing proposals or managing projects?
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Trust & Safety</h2>

          <p>
            Report suspicious behaviour, outside contact requests or unsafe
            platform activity.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Platform Feedback</h2>

          <p>
            Share ideas and feedback to help improve SA Freelancers.
          </p>
        </div>
      </section>

      <section className="home-cta dark-card">
        <h2>Continue exploring opportunities</h2>

        <p>Browse freelancers and projects across the marketplace.</p>

        <Link href="/search" className="home-primary-btn">
          Search Marketplace
        </Link>
      </section>
    </main>
  );
}