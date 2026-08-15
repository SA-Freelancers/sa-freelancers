"use client";

type Props = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  trend?: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: Props) {
  return (
    <div
      className="dark-card"
      style={{
        padding: 24,
        borderRadius: 16,
        transition: ".25s",
        cursor: "default",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>{title}</h3>

        <span
          style={{
            fontSize: 30,
          }}
        >
          {icon}
        </span>
      </div>

      <h1
        style={{
          fontSize: 34,
          marginTop: 20,
          marginBottom: 8,
        }}
      >
        {value}
      </h1>

      <p
        style={{
          opacity: .7,
        }}
      >
        {subtitle}
      </p>

      {trend && (
        <p
          style={{
            marginTop: 12,
            color: "#22c55e",
            fontWeight: 600,
          }}
        >
          {trend}
        </p>
      )}
    </div>
  );
}