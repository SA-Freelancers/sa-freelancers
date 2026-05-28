"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
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

    setUsers(usersData || []);
    setJobs(jobsData || []);
    setApplications(applicationsData || []);
    setLoading(false);
  };

  const deleteJob = async (jobId: string) => {
    const confirmDelete = confirm("Delete this job?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("jobs").delete().eq("id", jobId);

    if (error) {
      alert(error.message);
      return;
    }

    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  const deleteUser = async (userId: string) => {
    alert("For safety, delete users from Supabase Authentication → Users.");
  };

  if (loading) return <p>Loading admin...</p>;

  if (!isAdmin) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Access denied</h1>
        <p>You are not an admin.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto" }}>
      <h1>Admin Dashboard</h1>

      <div style={statsGrid}>
        <div style={card}>
          <h3>Users</h3>
          <p style={bigNumber}>{users.length}</p>
        </div>

        <div style={card}>
          <h3>Jobs</h3>
          <p style={bigNumber}>{jobs.length}</p>
        </div>

        <div style={card}>
          <h3>Applications</h3>
          <p style={bigNumber}>{applications.length}</p>
        </div>
      </div>

      <section style={{ marginTop: 40 }}>
        <h2>Users</h2>

        {users.map((user) => (
          <div key={user.id} style={listItem}>
            <div>
              <strong>{user.full_name || "No name"}</strong>
              <p>{user.email}</p>
              <p>{user.role}</p>
            </div>

            <button onClick={() => deleteUser(user.id)} style={dangerButton}>
              Delete User
            </button>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Jobs</h2>

        {jobs.map((job) => (
          <div key={job.id} style={listItem}>
            <div>
              <strong>{job.title}</strong>
              <p>{job.category}</p>
              <p>ZAR {job.budget}</p>
            </div>

            <button onClick={() => deleteJob(job.id)} style={dangerButton}>
              Delete Job
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 20,
};

const card = {
  backgroundColor: "white",
  padding: 20,
  borderRadius: 10,
  border: "1px solid #ddd",
};

const bigNumber = {
  fontSize: 36,
  fontWeight: "bold",
};

const listItem = {
  backgroundColor: "white",
  padding: 16,
  borderRadius: 10,
  border: "1px solid #ddd",
  marginBottom: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 15,
};

const dangerButton = {
  backgroundColor: "red",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "8px 12px",
  height: 40,
};