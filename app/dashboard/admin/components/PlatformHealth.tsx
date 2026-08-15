"use client";

type HealthItem = {
  name: string;
  status: "online" | "warning" | "offline";
};

const services: HealthItem[] = [
  { name: "Supabase Database", status: "online" },
  { name: "Authentication", status: "online" },
  { name: "Storage", status: "online" },
  { name: "Payments", status: "online" },
  { name: "Email Service", status: "online" },
  { name: "Notifications", status: "online" },
  { name: "Demo Data", status: "warning" },
];

function getColor(status: HealthItem["status"]) {
  switch (status) {
    case "online":
      return "#22c55e";

    case "warning":
      return "#f59e0b";

    case "offline":
      return "#ef4444";
  }
}

function getLabel(status: HealthItem["status"]) {
  switch (status) {
    case "online":
      return "Online";

    case "warning":
      return "Attention";

    case "offline":
      return "Offline";
  }
}

export default function PlatformHealth() {
  return (
    <section
      className="dark-card"
      style={{
        padding: 24,
        marginTop: 24,
      }}
    >
      <h2>Platform Health</h2>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gap: 14,
        }}
      >
        {services.map((service) => (
          <div
            key={service.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderRadius: 10,
              background: "rgba(255,255,255,.03)",
            }}
          >
            <span>{service.name}</span>

            <span
              style={{
                color: getColor(service.status),
                fontWeight: 700,
              }}
            >
              ● {getLabel(service.status)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}