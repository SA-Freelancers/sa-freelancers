"use client";

export type DashboardActivityItem = {
  id: string;
  icon: string;
  title: string;
  createdAt: string;
};

type DashboardActivityProps = {
  activities:
    DashboardActivityItem[];
};

function formatActivityTime(
  dateString: string
) {
  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  const seconds =
    Math.max(
      0,
      Math.floor(
        difference / 1000
      )
    );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    return `${minutes} minute${
      minutes === 1
        ? ""
        : "s"
    } ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} hour${
      hours === 1
        ? ""
        : "s"
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default function DashboardActivity({
  activities,
}: DashboardActivityProps) {
  return (
    <section
      className="dark-card"
      style={{
        padding: 24,
        marginTop: 24,
      }}
    >
      <div>
        <h2>
          Recent Activity
        </h2>

        <p
          style={{
            marginTop: 6,
            opacity: 0.65,
            fontSize: 13,
          }}
        >
          Latest real activity
          across Freelance Hub SA
        </p>
      </div>

      <div
        style={{
          marginTop: 20,
        }}
      >
        {activities.length ===
        0 ? (
          <div
            style={{
              padding:
                "24px 0",
              opacity: 0.65,
            }}
          >
            No recent platform
            activity yet.
          </div>
        ) : (
          activities.map(
            (activity) => (
              <div
                key={
                  activity.id
                }
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: 16,
                  padding:
                    "14px 0",
                  borderBottom:
                    "1px solid rgba(255,255,255,.06)",
                }}
              >
                <div
                  style={{
                    fontSize:
                      26,
                    width: 34,
                    textAlign:
                      "center",
                    flexShrink:
                      0,
                  }}
                >
                  {
                    activity.icon
                  }
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontWeight:
                        600,
                    }}
                  >
                    {
                      activity.title
                    }
                  </div>

                  <div
                    style={{
                      opacity:
                        0.6,
                      fontSize:
                        13,
                      marginTop:
                        3,
                    }}
                  >
                    {formatActivityTime(
                      activity.createdAt
                    )}
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </section>
  );
}