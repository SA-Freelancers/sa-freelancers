"use client";

import DashboardCard from "./DashboardCard";
import StatCard from "./StatCard";

type Props = {
  totalUsers: number;
  freelancers: number;
  clients: number;
  jobs: number;
  applications: number;
  revenue: number;
};

export default function DashboardStats({
  totalUsers,
  freelancers,
  clients,
  jobs,
  applications,
  revenue,
}: Props) {
  return (
<div
style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
gap:20,
marginTop:24,
}}
>

<StatCard
title="Users"
value={totalUsers}
subtitle="Registered users"
icon="👥"
trend="+12% this month"
/>

<StatCard
title="Freelancers"
value={freelancers}
subtitle="Available freelancers"
icon="🧑‍💻"
trend="+5 today"
/>

<StatCard
title="Clients"
value={clients}
subtitle="Registered clients"
icon="🏢"
trend="+2 today"
/>

<StatCard
title="Jobs"
value={jobs}
subtitle="Posted jobs"
icon="💼"
trend="+18 this week"
/>

<StatCard
title="Applications"
value={applications}
subtitle="Submitted proposals"
icon="📄"
trend="+31 today"
/>

<StatCard
title="Revenue"
value={`R ${revenue.toLocaleString()}`}
subtitle="Platform revenue"
icon="💰"
trend="+8.4%"
/>

</div>
);
}