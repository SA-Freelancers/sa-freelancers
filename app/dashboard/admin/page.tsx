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

  if (loading) return <p>Loading admin dashboard...</p>;

  if (!isAdmin) {
    return (
      <div style={card}>
        <h1>Access denied</h1>
        <p>You are not an admin.</p>
      </div>
    );
  }

  return (
    <div>
      <section style={hero}>
        <h1>Admin Dashboard</h1>
        <p>Monitor users, jobs, applications, and platform activity.</p>
      </section>

      <div style={statsGrid}>
        <div style={statCard}>
          <h3>Total Users</h3>
          <p style={bigNumber}>{users.length}</p>
        </div>

        <div style={statCard}>
          <h3>Total Jobs</h3>
          <p style={bigNumber}>{jobs.length}</p>
        </div>

        <div style={statCard}>
          <h3>Applications</h3>
          <p style={bigNumber}>{applications.length}</p>
        </div>
      </div>

      <section style={section}>
        <h2>Users</h2>

        {users.map((user) => (
          <div key={user.id} style={listItem}>
            <div>
              <strong>{user.full_name || "No name"}</strong>
              <p>{user.email}</p>
              <p>
                {user.role} {user.is_admin ? "• Admin" : ""}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section style={section}>
        <h2>Jobs</h2>

        {jobs.map((job) => (
          <div key={job.id} style={listItem}>
            <div>
              <strong>{job.title}</strong>
              <p>{job.category}</p>
              <p>ZAR {job.budget}</p>
            </div>

            <button onClick={() => deleteJob(job.id)} style={dangerBtn}>
              Delete Job
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #7c3aed)",
  color: "white",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 22,
};

const statCard = {
  background: "white",
  padding: 25,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const bigNumber = {
  fontSize: 42,
  fontWeight: "bold",
  color: "#2563eb",
};

const section = {
  marginTop: 40,
};

const listItem = {
  background: "white",
  padding: 18,
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  marginBottom: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 15,
};

const dangerBtn = {
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
};

const card = {
  background: "white",
  padding: 30,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
};