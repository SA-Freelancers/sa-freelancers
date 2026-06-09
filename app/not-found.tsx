import Link from "next/link";

export default function NotFound() {
  return (
    <main className="home-page">
      <section
        className="dark-card"
        style={{
          padding: 50,
          borderRadius: 24,
          textAlign: "center",
        }}
      >
        <p className="dashboard-badge">404 Error</p>

        <h1>Page Not Found</h1>

        <p>
          The page you are looking for does not exist or may have been moved.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <Link href="/" className="home-primary-btn">
            Go Home
          </Link>

          <Link href="/dashboard" className="home-secondary-btn">
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}