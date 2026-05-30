import type { CSSProperties } from "react";

export default function LoadingSkeleton() {
  return (
    <div style={container}>
      <div className="dark-card skeleton-shimmer" style={heroSkeleton} />

      <div style={grid}>
        <div className="dark-card skeleton-shimmer" style={cardSkeleton} />
        <div className="dark-card skeleton-shimmer" style={cardSkeleton} />
        <div className="dark-card skeleton-shimmer" style={cardSkeleton} />
      </div>
    </div>
  );
}

const container: CSSProperties = {
  display: "grid",
  gap: 22,
};

const heroSkeleton: CSSProperties = {
  height: 140,
  borderRadius: 18,
  opacity: 0.8,
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 22,
};

const cardSkeleton: CSSProperties = {
  height: 180,
  borderRadius: 18,
  opacity: 0.8,
};