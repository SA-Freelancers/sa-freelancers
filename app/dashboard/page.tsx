export default function DashboardPage() {
  return (
    <div className="dashboard-home">
      {/* Hero */}
      <section className="dashboard-hero dark-card">
        <div>
          <p className="dashboard-badge">Welcome back</p>

          <h1>
            Build your freelance
            <span> career faster</span>
          </h1>

          <p className="dashboard-description">
            Manage projects, applications, uploads and freelancers from one
            professional dashboard.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="dashboard-stats">
        <div className="dark-card stat-card">
          <h3>12</h3>
          <p>Active Projects</p>
        </div>

        <div className="dark-card stat-card">
          <h3>34</h3>
          <p>Applications</p>
        </div>

        <div className="dark-card stat-card">
          <h3>8</h3>
          <p>Completed Jobs</p>
        </div>
      </section>

      {/* Activity */}
      <section className="dark-card dashboard-activity">
        <h2>Recent Activity</h2>

        <div className="activity-item">
          <div className="activity-dot" />
          <p>New freelancer application received</p>
        </div>

        <div className="activity-item">
          <div className="activity-dot" />
          <p>Project uploaded successfully</p>
        </div>

        <div className="activity-item">
          <div className="activity-dot" />
          <p>Profile updated</p>
        </div>
      </section>
    </div>
  );
}