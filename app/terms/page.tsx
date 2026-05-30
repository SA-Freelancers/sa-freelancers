import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="safety-page">
      <section className="safety-hero dark-card">
        <p className="dashboard-badge">Terms of Service</p>

        <h1>Platform rules and user responsibilities</h1>

        <p>
          These terms help keep SA Freelancers safe, professional and fair for
          both clients and freelancers.
        </p>
      </section>

      <section className="safety-grid">
        <div className="dark-card safety-card">
          <h2>Use the platform honestly</h2>
          <p>
            Users must provide accurate profile, project and proposal
            information.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>No off-platform bypassing</h2>
          <p>
            Users should not move work away from the platform before hiring or
            payment protection is completed.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Respectful communication</h2>
          <p>
            Clients and freelancers should communicate professionally and avoid
            abusive, misleading or harmful behaviour.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Payments and hiring</h2>
          <p>
            Future payment features should be used to keep work protected and
            properly tracked.
          </p>
        </div>
      </section>

      <section className="home-cta dark-card">
        <h2>Continue using SA Freelancers</h2>

        <p>Browse trusted opportunities and manage your work safely.</p>

        <Link href="/search" className="home-primary-btn">
          Search Marketplace
        </Link>
      </section>
    </main>
  );
}