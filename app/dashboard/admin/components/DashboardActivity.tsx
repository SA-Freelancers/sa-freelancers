"use client";

type Activity = {
  id: number;
  icon: string;
  title: string;
  time: string;
};

const activities: Activity[] = [
  {
    id: 1,
    icon: "👤",
    title: "John Smith registered as a Freelancer",
    time: "5 minutes ago",
  },
  {
    id: 2,
    icon: "💼",
    title: "ABC Engineering posted a new Job",
    time: "18 minutes ago",
  },
  {
    id: 3,
    icon: "💰",
    title: "Payment received from Demo Client",
    time: "42 minutes ago",
  },
  {
    id: 4,
    icon: "⭐",
    title: "A new review was submitted",
    time: "1 hour ago",
  },
  {
    id: 5,
    icon: "📄",
    title: "Proposal submitted for Mechanical Draughtsman",
    time: "2 hours ago",
  },
];

export default function DashboardActivity() {
  return (
    <section
      className="dark-card"
      style={{
        padding: 24,
        marginTop: 24,
      }}
    >
      <h2>Recent Activity</h2>

      <div
        style={{
          marginTop: 20,
        }}
      >
        {activities.map((activity) => (
          <div
            key={activity.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 0",
              borderBottom:
                "1px solid rgba(255,255,255,.06)",
            }}
          >
            <div
              style={{
                fontSize: 26,
              }}
            >
              {activity.icon}
            </div>

            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                }}
              >
                {activity.title}
              </div>

              <div
                style={{
                  opacity: 0.6,
                  fontSize: 13,
                }}
              >
                {activity.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}