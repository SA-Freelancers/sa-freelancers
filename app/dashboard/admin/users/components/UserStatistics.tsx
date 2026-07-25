type Props = {
  total: number;
  freelancers: number;
  clients: number;
  admins: number;
  demo: number;
  suspended: number;
  verified: number;
};

export default function UserStatistics({
  total,
  freelancers,
  clients,
  admins,
  demo,
  suspended,
  verified,
}: Props) {
  const cards = [
    { title: "Total Users", value: total },
    { title: "Freelancers", value: freelancers },
    { title: "Clients", value: clients },
    { title: "Administrators", value: admins },
    { title: "Demo Accounts", value: demo },
    { title: "Suspended", value: suspended },
    { title: "Verified", value: verified },
  ];

  return (
    <section className="dashboard-stats">
      {cards.map((card) => (
        <div key={card.title} className="dark-card stat-card">
          <h2>{card.value}</h2>
          <p>{card.title}</p>
        </div>
      ))}
    </section>
  );
}