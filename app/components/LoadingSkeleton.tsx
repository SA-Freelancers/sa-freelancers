import type { CSSProperties } from "react";

export default function LoadingSkeleton() {
  return (
    <div style={container}>
      {/* Hero Skeleton */}
      <div className="dark-card skeleton-shimmer" style={heroSection}>
        <div className="skeleton-shimmer" style={heroTitle} />
        <div className="skeleton-shimmer" style={heroSubtitle} />
      </div>

      {/* Cards */}
      <div style={grid}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="dark-card skeleton-card"
            style={card}
          >
            <div className="skeleton-shimmer" style={image} />

            <div style={content}>
              <div className="skeleton-shimmer" style={title} />
              <div className="skeleton-shimmer" style={text} />
              <div className="skeleton-shimmer" style={smallText} />

              <div style={footer}>
                <div className="skeleton-shimmer" style={avatar} />
                <div className="skeleton-shimmer" style={button} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const container: CSSProperties = {
  display: "grid",
  gap: 28,
};

const heroSection: CSSProperties = {
  padding: 30,
  borderRadius: 24,
  display: "grid",
  gap: 16,
};

const heroTitle: CSSProperties = {
  width: "55%",
  height: 28,
  borderRadius: 12,
};

const heroSubtitle: CSSProperties = {
  width: "35%",
  height: 18,
  borderRadius: 10,
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 24,
};

const card: CSSProperties = {
  borderRadius: 24,
  overflow: "hidden",
  display: "grid",
};

const image: CSSProperties = {
  height: 170,
  width: "100%",
};

const content: CSSProperties = {
  padding: 18,
  display: "grid",
  gap: 14,
};

const title: CSSProperties = {
  width: "70%",
  height: 22,
  borderRadius: 10,
};

const text: CSSProperties = {
  width: "100%",
  height: 16,
  borderRadius: 10,
};

const smallText: CSSProperties = {
  width: "60%",
  height: 16,
  borderRadius: 10,
};

const footer: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 10,
};

const avatar: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
};

const button: CSSProperties = {
  width: 90,
  height: 38,
  borderRadius: 14,
};