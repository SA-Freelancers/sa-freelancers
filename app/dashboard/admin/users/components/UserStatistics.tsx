"use client";

type Props = {
  total: number;
  freelancers: number;
  clients: number;
  admins: number;
  demo: number;
  suspended: number;
  verified: number;
};

function Card({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      className="dark-card"
      style={{
        padding: 22,
        borderRadius: 16,
        minWidth: 180,
        flex: 1,
        textAlign: "center",
      }}
    >
      <h3
        style={{
          fontSize: 15,
          opacity: .75,
          marginBottom: 10,
        }}
      >
        {title}
      </h3>

      <div
        style={{
          fontSize: 34,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function UserStatistics({
  total,
  freelancers,
  clients,
  admins,
  demo,
  suspended,
  verified,
}: Props) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(180px,1fr))",
        gap: 18,
        marginTop: 25,
      }}
    >
      <Card title="Total Users" value={total} />

      <Card title="Freelancers" value={freelancers} />

      <Card title="Clients" value={clients} />

      <Card title="Administrators" value={admins} />

      <Card title="Demo Users" value={demo} />

      <Card title="Verified" value={verified} />

      <Card title="Suspended" value={suspended} />
    </section>
  );
}