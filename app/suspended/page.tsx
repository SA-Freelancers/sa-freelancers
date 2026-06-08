import Link from "next/link";

export default function SuspendedPage() {
  return (
    <main className="home-page">
      <section className="dark-card" style={{ padding: 40, borderRadius: 24 }}>
        <p className="dashboard-badge">Account Suspended</p>

        <h1>Your account has been suspended</h1>

        <p>
          This account has been restricted due to platform safety or policy
          concerns. Please contact support if you believe this is a mistake.
        </p>

        <Link href="/contact" className="home-primary-btn">
          Contact Support
        </Link>
      </section>
    </main>
  );
}