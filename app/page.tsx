import Link from "next/link";

const services = [
  "Web Development",
  "Graphic Design",
  "Writing",
  "Marketing",
  "Video Editing",
  "Engineering",
];

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="dashboard-badge">South African Freelance Marketplace</p>

          <h1>
            Hire trusted freelancers
            <span> faster and safer.</span>
          </h1>

          <p>
            Post jobs, receive proposals, manage projects, message freelancers
            and grow your business on one professional platform.
          </p>

          <div className="home-actions">
            <Link href="/register" className="home-primary-btn">
              Get Started
            </Link>

            <Link href="/search" className="home-secondary-btn">
              Search Marketplace
            </Link>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="dark-card stats-card">
          <h3>12K+</h3>
          <p>Freelancers</p>
        </div>

        <div className="dark-card stats-card">
          <h3>4.8★</h3>
          <p>Platform Rating</p>
        </div>

        <div className="dark-card stats-card">
          <h3>8K+</h3>
          <p>Projects Completed</p>
        </div>

        <div className="dark-card stats-card">
          <h3>24/7</h3>
          <p>Marketplace Access</p>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-header">
          <p className="dashboard-badge">Popular Services</p>
          <h2>Find skills for every project</h2>
        </div>

        <div className="home-grid">
          {services.map((item) => (
            <div key={item} className="dark-card home-card">
              <h3>{item}</h3>
              <p>Find skilled freelancers for {item.toLowerCase()} projects.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-header">
          <p className="dashboard-badge">How It Works</p>
          <h2>Simple steps to get work done</h2>
        </div>

        <div className="home-grid">
          <div className="dark-card home-card">
            <h3>1. Post a Job</h3>
            <p>Create a project with your budget, category and full details.</p>
          </div>

          <div className="dark-card home-card">
            <h3>2. Get Proposals</h3>
            <p>Freelancers apply with pricing, skills and cover messages.</p>
          </div>

          <div className="dark-card home-card">
            <h3>3. Hire & Manage</h3>
            <p>Choose the best freelancer and manage progress from dashboard.</p>
          </div>
        </div>
      </section>

      <section className="home-cta dark-card">
        <h2>Ready to build your next project?</h2>
        <p>Join South Africa’s growing freelance marketplace today.</p>

        <Link href="/register" className="home-primary-btn">
          Create Free Account
        </Link>
      </section>
    </main>
  );
}