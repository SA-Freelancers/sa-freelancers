"use client";

type Props = {
  name: string;
  subtitle?: string;
};

export default function DashboardHeader({
  name,
  subtitle,
}: Props) {
  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12)
    greeting = "Good Morning";

  else if (hour < 18)
    greeting = "Good Afternoon";

  return (
    <section
      className="dark-card"
      style={{
        padding: 25,
      }}
    >
      <h1>
        {greeting}, {name} 👋
      </h1>

      {subtitle && (
        <p>{subtitle}</p>
      )}
    </section>
  );
}