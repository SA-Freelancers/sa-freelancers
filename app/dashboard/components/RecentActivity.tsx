"use client";

type Activity = {
  id: string;
  title: string;
  description: string;
  time: string;
};

type Props = {
  items: Activity[];
};

export default function RecentActivity({
  items,
}: Props) {
  return (
    <div className="dark-card" style={{ padding: 24 }}>
      <h2>Recent Activity</h2>

      {items.length === 0 ? (
        <p>No recent activity.</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "14px 0",
              borderBottom:
                "1px solid rgba(255,255,255,.08)",
            }}
          >
            <strong>{item.title}</strong>

            <p
              style={{
                margin: "6px 0",
                opacity: 0.8,
              }}
            >
              {item.description}
            </p>

            <small
              style={{
                opacity: 0.6,
              }}
            >
              {item.time}
            </small>
          </div>
        ))
      )}
    </div>
  );
}