import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="safety-page">
      <section className="safety-hero dark-card">
        <p className="dashboard-badge">Contact Support</p>

        <h1>How can we help?</h1>

        <p>
          Contact SA Freelancers for account support, payment questions,
          reporting issues or marketplace help.
        </p>
      </section>

      <section className="safety-grid">
        <div className="dark-card safety-card">
          <h2>Support Email</h2>
          <p>support@safreelancers.co.za</p>
        </div>

        <div className="dark-card safety-card">
          <h2>Response Time</h2>
          <p>We aim to respond within 24 to 48 hours.</p>
        </div>

        <div className="dark-card safety-card">
          <h2>Report Abuse</h2>
          <p>
            Use the report button on profiles to report suspicious or unsafe
            behaviour.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Account Help</h2>
          <p>
            For suspended accounts, login problems or payment issues, contact
            support with your account email.
          </p>
        </div>
      </section>

      <section className="home-cta dark-card">
        <h2>Need help with your account?</h2>

        <p>
          Include your registered email address and a clear description of the
          issue when contacting support.
        </p>

        <Link href="/login" className="home-primary-btn">
          Back to Login
        </Link>
      </section>
    </main>
  );
}