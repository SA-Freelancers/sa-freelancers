import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="safety-page">
      <section className="safety-hero dark-card">
        <p className="dashboard-badge">Privacy Policy</p>

        <h1>Your privacy matters</h1>

        <p>
          Freelance Hub SA is committed to protecting user information and keeping
          platform activity secure.
        </p>
      </section>

      <section className="safety-grid">
        <div className="dark-card safety-card">
          <h2>Profile Information</h2>

          <p>
            Your profile details, uploads and proposals are used to help clients
            and freelancers connect professionally.
          </p>
        </div>
        <div className="dark-card safety-card">
  <h2>Data Security</h2>

  <p>
    User information is stored securely and access is restricted to authorised
    platform functions. We continuously monitor the platform to improve
    security and reliability.
  </p>
</div>
        
        

        <div className="dark-card safety-card">
          <h2>Safe Communication</h2>

          <p>
            Users should avoid sharing outside contact details before hiring
            through the platform.
          </p>
        </div>
        <div className="dark-card safety-card">
  <h2>Data Security</h2>

  <p>
    User information is stored securely and access is restricted to authorised
    platform functions. We continuously monitor the platform to improve
    security and reliability.
  </p>
</div>

        <div className="dark-card safety-card">
          <h2>Protected Access</h2>

          <p>
            Authentication and account management are secured using Supabase
            services and protected dashboards.
          </p>
        </div>

        <div className="dark-card safety-card">
          <h2>Platform Improvements</h2>

          <p>
            Usage information may be used to improve features, security and user
            experience across the marketplace.
          </p>
        </div>
      </section>

      <section className="home-cta dark-card">
        <h2>Continue safely on the platform</h2>

        <p>
          Explore projects, freelancers and opportunities with confidence.
        </p>

        <Link href="/register" className="home-primary-btn">
  Join Freelance Hub SA
</Link>
      </section>
    </main>
  );
}