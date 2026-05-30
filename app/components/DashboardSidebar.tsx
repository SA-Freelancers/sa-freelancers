import Link from "next/link";

export default function DashboardSidebar() {
  return (
    <aside className="dashboard-sidebar dark-card">
      <div>
        <h2>Dashboard</h2>
        <p>Manage your work</p>
      </div>

      <nav className="dashboard-sidebar-nav">
        <Link href="/dashboard">Overview</Link>
        <Link href="/dashboard/projects">Projects</Link>
        <Link href="/dashboard/upload">Upload</Link>
        <Link href="/search">Find Freelancers</Link>
      </nav>
    </aside>
  );
}
