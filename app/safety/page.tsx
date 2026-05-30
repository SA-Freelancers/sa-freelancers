import Link from "next/link";

export default function SafetyPage() {
  return (
    <main className="safety-page">
      <section className="safety-hero dark-card">
        <p className="dashboard-badge">Trust & Safety</p>

        <h1>Platform safety rules</h1>

        <p>
          SA Freelancers is built to help clients and freelancers work safely,
          professionally and transparently.
        </p>
      </section>

      <section className="safety-grid">
        <div className="dark-card safety-card">
          <h2>No off-platform contact before hiring</h2>
          <p>
            Users should not share phone numbers, WhatsApp, email addresses or
            outside contact details before a project is accepted.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Keep proposals professional</h2>
          <p>
            Freelancers should explain their skills, timeline, pricing and work
            plan without trying to move the client away from the platform.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Use profiles and reviews</h2>
          <p>
            Clients should review freelancer profiles, documents and ratings
            before accepting a proposal.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Payments should stay protected</h2>
          <p>
            Future payment features should keep transactions inside the platform
            before contact details are shared.
          </p>
        </div>
      </section>

      <section className="home-cta dark-card">
        <h2>Ready to hire safely?</h2>
        <p>Browse freelancers and manage proposals from your dashboard.</p>

        <Link href="/search" className="home-primary-btn">
          Search Marketplace
        </Link>
      </section>
    </main>
  );
}