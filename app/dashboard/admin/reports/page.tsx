export default function AdminReportsPage() {
  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin Reports</p>
        <h1>Moderation Center</h1>
        <p>Review unsafe jobs, suspicious users and off-platform contact issues.</p>
      </section>

      <section className="contracts-grid">
        <div className="dark-card contract-card">
          <h2>Unsafe Contact Sharing</h2>
          <p>Monitor users trying to share WhatsApp, email or phone numbers before hiring.</p>
        </div>

        <div className="dark-card contract-card">
          <h2>Suspicious Jobs</h2>
          <p>Review jobs that may be fake, spam, unsafe or misleading.</p>
        </div>

        <div className="dark-card contract-card">
          <h2>User Reports</h2>
          <p>Client and freelancer reports will appear here in future updates.</p>
        </div>
      </section>
    </main>
  );
}