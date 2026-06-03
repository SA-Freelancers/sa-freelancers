"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Profile = {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  category?: string;
  is_admin?: boolean;
  verified?: boolean;
  top_rated?: boolean;
};

type Job = {
  id: string;
  title?: string;
  category?: string;
  budget?: number | string;
};

type Application = {
  id: string;
};

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: applicationsData } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    setUsers((usersData as Profile[]) || []);
    setJobs((jobsData as Job[]) || []);
    setApplications((applicationsData as Application[]) || []);
    setLoading(false);
  };
const deleteUser = async (userId: string) => {
  const confirmDelete = confirm(
    "Delete this user profile?"
  );

  if (!confirmDelete) return;

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) {
    setMessage(error.message);
    return;
  }

  setUsers((prev) =>
    prev.filter((user) => user.id !== userId)
  );

  setMessage("User deleted successfully.");
};
  const deleteJob = async (jobId: string) => {
    const confirmDelete = confirm("Delete this job?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("jobs").delete().eq("id", jobId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setJobs((prev) => prev.filter((job) => job.id !== jobId));
    setMessage("Job deleted successfully.");
  };

  const updateProfileBadge = async (
    profileId: string,
    field: "verified" | "top_rated" | "is_admin",
    value: boolean
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", profileId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("User badge updated successfully.");

    setUsers((prev) =>
      prev.map((user) =>
        user.id === profileId
          ? {
              ...user,
              [field]: value,
            }
          : user
      )
    );
  };

  if (loading) return <LoadingSkeleton />;

  if (!isAdmin) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Admin</p>
          <h1>Access denied</h1>
          <p>You are not allowed to access this page.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin</p>

        <h1>Admin Dashboard</h1>

        <p>Monitor users, jobs, applications and freelancer badges.</p>
      </section>

      {message && <p className="upload-message">{message}</p>}
      <div className="dark-card search-filter-card">
  <input
    type="text"
    placeholder="Search users by name, email or role..."
    value={userSearch}
    onChange={(e) => setUserSearch(e.target.value)}
    className="form-input"
  />
</div>
<section className="dashboard-quick-actions">
  <div className="dark-card quick-action-card">
    <span>🛡️</span>
    <h3>Verification Control</h3>
    <p>Manage verified and top-rated freelancer badges.</p>
  </div>

  <div className="dark-card quick-action-card">
    <span>💼</span>
    <h3>Job Moderation</h3>
    <p>Review and remove inappropriate jobs.</p>
  </div>

  <div className="dark-card quick-action-card">
    <span>📊</span>
    <h3>Platform Analytics</h3>
    <p>Monitor users, projects and marketplace growth.</p>
  </div>
  <a
  href="/dashboard/admin/reports"
  className="dark-card quick-action-card"
>
  <span>🚩</span>
  <h3>Reports & Moderation</h3>
  <p>Review unsafe jobs, suspicious users and platform reports.</p>
</a>
<a
  href="/dashboard/admin/user-reports"
  className="dark-card quick-action-card"
>
  <span>🚩</span>
  <h3>User Reports</h3>
  <p>Review reports submitted by clients and freelancers.</p>
</a>
</section>
      <section className="dashboard-stats">
        <div className="dark-card stat-card">
          <h3>{users.length}</h3>
          <p>Total Users</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{jobs.length}</h3>
          <p>Total Jobs</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{applications.length}</h3>
          <p>Applications</p>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: 18 }}>Users & Freelancer Badges</h2>
<div className="dark-card search-filter-card">
  <input
    type="text"
    placeholder="Search jobs by title or category..."
    value={jobSearch}
    onChange={(e) => setJobSearch(e.target.value)}
    className="form-input"
  />
</div>
        {users.length === 0 ? (
          <EmptyState
            emoji="👤"
            title="No users found"
            description="Registered users will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {users
  .filter((user) => {
    const text = `${user.full_name || ""} ${
      user.email || ""
    } ${user.role || ""}`.toLowerCase();

    return text.includes(userSearch.toLowerCase());
  })
  .map((user) => (
              <div key={user.id} className="dark-card contract-card">
                <h2>{user.full_name || "Unnamed User"}</h2>

                <p>
                  <strong>Email:</strong> {user.email || "N/A"}
                </p>

                <p>
                  <strong>Role:</strong> {user.role || "N/A"}
                </p>

                <p>
                  <strong>Category:</strong> {user.category || "N/A"}
                </p>

                <div className="marketplace-badges">
                  {user.is_admin && (
                    <span className="verified-badge">🛡️ Admin</span>
                  )}

                  {user.verified && (
                    <span className="verified-badge">✔ Verified</span>
                  )}

                  {user.top_rated && (
                    <span className="top-rated-badge">★ Top Rated</span>
                  )}
                </div>

                <div className="contract-actions">
                  
                  <button
                    onClick={() =>
                      updateProfileBadge(user.id, "verified", !user.verified)
                    }
                    className="accept-btn"
                  >
                    {user.verified ? "Remove Verified" : "Mark Verified"}
                  </button>

                  <button
                    onClick={() =>
                      updateProfileBadge(user.id, "top_rated", !user.top_rated)
                    }
                    className="primary-action-btn"
                  >
                    {user.top_rated ? "Remove Top Rated" : "Mark Top Rated"}
                  </button>
                  <button
  onClick={() =>
    updateProfileBadge(
      user.id,
      "is_admin",
      !user.is_admin
    )
  }
  className="primary-action-btn"
>
  {user.is_admin ? "Remove Admin" : "Make Admin"}
</button>
                  <button
  onClick={() => deleteUser(user.id)}
  className="reject-btn"
>
  Delete User
</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
<section style={{ marginTop: 40 }}>
  <h2 style={{ marginBottom: 18 }}>
    Recent Platform Activity
  </h2>

  <div className="contracts-grid">
    <div className="dark-card contract-card">
      <h3>👥 Users Registered</h3>

      <p>
        Track how many freelancers and clients are joining
        the platform.
      </p>

      <p className="contract-budget">
        {users.length} Users
      </p>
    </div>

    <div className="dark-card contract-card">
      <h3>💼 Jobs Posted</h3>

      <p>
        Monitor marketplace activity and new project demand.
      </p>

      <p className="contract-budget">
        {jobs.length} Jobs
      </p>
    </div>

    <div className="dark-card contract-card">
      <h3>📨 Applications</h3>

      <p>
        View freelancer application growth across projects.
      </p>

      <p className="contract-budget">
        {applications.length} Applications
      </p>
    </div>
  </div>
</section>
      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 18 }}>Jobs</h2>

        {jobs.length === 0 ? (
          <EmptyState
            emoji="💼"
            title="No jobs found"
            description="Posted jobs will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {jobs
  .filter((job) => {
    const text = `${job.title || ""} ${job.category || ""}`.toLowerCase();

    return text.includes(jobSearch.toLowerCase());
  })
  .map((job) => (
              <div key={job.id} className="dark-card contract-card">
                <h2>{job.title || "Untitled Job"}</h2>

                <p>
                  <strong>Category:</strong> {job.category || "N/A"}
                </p>

                <p>
                  <strong>Budget:</strong> ZAR {job.budget || "N/A"}
                </p>

                <div className="contract-actions">
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="reject-btn"
                  >
                    Delete Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}