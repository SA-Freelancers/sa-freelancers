"use client";

type PlatformOverviewProps = {
  totalUsers: number;
  jobs: number;
  applications: number;
  openReports: number;
  pendingPayouts: number;
  pendingVerifications: number;
};

type OverviewItem = {
  name: string;
  value: number;
  note: string;
  icon: string;
  attention?: boolean;
};

export default function PlatformHealth({
  totalUsers,
  jobs,
  applications,
  openReports,
  pendingPayouts,
  pendingVerifications,
}: PlatformOverviewProps) {
  const items: OverviewItem[] = [
    {
      name: "Registered Users",
      value: totalUsers,
      note: "Total accounts",
      icon: "👥",
    },
    {
      name: "Posted Jobs",
      value: jobs,
      note: "Jobs on platform",
      icon: "💼",
    },
    {
      name: "Applications",
      value: applications,
      note: "Submitted proposals",
      icon: "📄",
    },
    {
      name: "Open Reports",
      value: openReports,
      note:
        openReports > 0
          ? "Needs review"
          : "No reports waiting",
      icon: "🚩",
      attention:
        openReports > 0,
    },
    {
      name: "Pending Payouts",
      value: pendingPayouts,
      note:
        pendingPayouts > 0
          ? "Needs processing"
          : "Nothing waiting",
      icon: "💳",
      attention:
        pendingPayouts > 0,
    },
    {
      name: "Pending Verifications",
      value: pendingVerifications,
      note:
        pendingVerifications > 0
          ? "Needs review"
          : "Nothing waiting",
      icon: "🛡️",
      attention:
        pendingVerifications >
        0,
    },
  ];

  return (
    <section className="dark-card admin-health-card">
      <div>
        <h2>
          Platform Overview
        </h2>

        <p
          style={{
            marginTop: 6,
            marginBottom: 18,
            opacity: 0.65,
            fontSize: 13,
          }}
        >
          Current operational
          activity from the
          platform database
        </p>
      </div>

      <div className="admin-health-list">
        {items.map(
          (item) => (
            <div
              key={item.name}
              className="admin-health-item"
            >
              <span
                className="admin-health-name"
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 10,
                }}
              >
                <span>
                  {item.icon}
                </span>

                <span>
                  {item.name}
                </span>
              </span>

              <span
                className="admin-health-status"
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "flex-end",
                  gap: 2,
                }}
              >
                <strong
                  style={{
                    color:
                      item.attention
                        ? "#f59e0b"
                        : "#22c55e",
                    fontSize: 16,
                  }}
                >
                  {item.value}
                </strong>

                <span
                  style={{
                    fontSize: 11,
                    opacity: 0.65,
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {item.note}
                </span>
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}