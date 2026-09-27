"use client";

type Props = {
  total: number;
  available: number;
  suspended: number;
  topRated: number;
  demo: number;
};

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div
      className="dark-card"
      style={{
        padding: 20,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            fontWeight: 600,
          }}
        >
          {title}
        </span>

        <span
          aria-hidden="true"
          style={{
            fontSize: 28,
            lineHeight: 1,
          }}
        >
          {icon}
        </span>
      </div>

      <h2
        style={{
          marginTop: 18,
          marginBottom: 0,
          fontSize: 34,
        }}
      >
        {value}
      </h2>
    </div>
  );
}

export default function FreelancerStats({
  total,
  available,
  suspended,
  topRated,
  demo,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 18,
        marginTop: 24,
      }}
    >
      <Card
        title="Freelancers"
        value={total}
        icon="👥"
      />

      <Card
        title="Active"
        value={available}
        icon="🟢"
      />

      <Card
        title="Top Rated"
        value={topRated}
        icon="⭐"
      />

      <Card
        title="Suspended"
        value={suspended}
        icon="⛔"
      />

      <Card
        title="Demo"
        value={demo}
        icon="🎯"
      />
    </div>
  );
}