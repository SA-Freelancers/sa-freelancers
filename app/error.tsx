"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
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
        <p className="dashboard-badge">System Error</p>

        <h1>Something went wrong</h1>

        <p>{error.message}</p>

        <button
          onClick={() => reset()}
          className="primary-action-btn"
        >
          Try Again
        </button>
      </section>
    </main>
  );
}