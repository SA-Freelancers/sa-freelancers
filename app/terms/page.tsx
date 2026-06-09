import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="safety-page">
      <section className="safety-hero dark-card">
        <p className="dashboard-badge">Terms of Service</p>

        <h1>Platform rules and user responsibilities</h1>

        <p>
          These terms help keep Freelance Hub SA safe, professional and fair for
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
  <h2>Account Suspension</h2>

  <p>
    Freelance Hub SA reserves the right to suspend or remove accounts involved
    in fraud, abuse, harassment, spam, fake projects or attempts to bypass
    platform protections.
  </p>
</div>

<div className="dark-card safety-card">
  <h2>Contracts & Deliverables</h2>

  <p>
    Freelancers are responsible for delivering agreed work and clients are
    responsible for providing clear project requirements and timely feedback.
  </p>
</div>

<div className="dark-card safety-card">
  <h2>Dispute Resolution</h2>

  <p>
    In the event of disagreements, platform records such as contracts,
    messages and project activity may be reviewed to help resolve disputes.
  </p>
</div>

<div className="dark-card safety-card">
  <h2>Intellectual Property</h2>

  <p>
    Ownership of completed work should be agreed between the client and
    freelancer. Users must not upload copyrighted content without permission.
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
        <h2>Continue using Freelance Hub SA</h2>

        <p>Browse trusted opportunities and manage your work safely.</p>

        <Link href="/register" className="home-primary-btn">
  Join Freelance Hub SA
</Link>
      </section>
    </main>
  );
}