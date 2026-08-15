"use client";

type Props = {
  total: number;
  verified: number;
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
        }}
      >
        <span>{title}</span>

        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>

      <h2
        style={{
          marginTop: 18,
          fontSize: 34,
        }}
      >
        {value}
      </h2>
    </div>
  );
}

export default function FreelancerStats(props: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(180px,1fr))",
        gap: 18,
        marginTop: 24,
      }}
    >
      <Card
        title="Freelancers"
        value={props.total}
        icon="🧑‍💻"
      />

      <Card
        title="Verified"
        value={props.verified}
        icon="✔"
      />

      <Card
        title="Available"
        value={props.available}
        icon="🟢"
      />

      <Card
        title="Top Rated"
        value={props.topRated}
        icon="⭐"
      />

      <Card
        title="Suspended"
        value={props.suspended}
        icon="⛔"
      />

      <Card
        title="Demo"
        value={props.demo}
        icon="🎯"
      />
    </div>
  );
}