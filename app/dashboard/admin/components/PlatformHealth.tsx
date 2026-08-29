"use client";

type HealthItem = {
  name: string;

  status:
    | "online"
    | "warning"
    | "offline";
};

const services: HealthItem[] = [
  {
    name:
      "Supabase Database",
    status:
      "online",
  },

  {
    name:
      "Authentication",
    status:
      "online",
  },

  {
    name:
      "Storage",
    status:
      "online",
  },

  {
    name:
      "Payments",
    status:
      "online",
  },

  {
    name:
      "Email Service",
    status:
      "online",
  },

  {
    name:
      "Notifications",
    status:
      "online",
  },

  {
    name:
      "Demo Data",
    status:
      "warning",
  },
];

function getColor(
  status:
    HealthItem["status"]
) {
  switch (status) {
    case "online":
      return "#22c55e";

    case "warning":
      return "#f59e0b";

    case "offline":
      return "#ef4444";
  }
}

function getLabel(
  status:
    HealthItem["status"]
) {
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
    <section className="dark-card admin-health-card">
      <h2>
        Platform Health
      </h2>

      <div className="admin-health-list">
        {services.map(
          (
            service
          ) => (
            <div
              key={
                service.name
              }
              className="admin-health-item"
            >
              <span className="admin-health-name">
                {
                  service.name
                }
              </span>

              <span
                className="admin-health-status"
                style={{
                  color:
                    getColor(
                      service.status
                    ),
                }}
              >
                <span
                  className="admin-health-dot"
                  style={{
                    background:
                      getColor(
                        service.status
                      ),
                  }}
                />

                {getLabel(
                  service.status
                )}
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}