"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type UserProfile = {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  is_admin?: boolean;
  suspended?: boolean;
  created_at?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setUsers((data as UserProfile[]) || []);
    setLoading(false);
  };

  const toggleSuspension = async (userId: string, currentStatus?: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ suspended: !currentStatus })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, suspended: !currentStatus } : user
      )
    );

    setMessage(currentStatus ? "User unsuspended." : "User suspended.");
  };

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Admin</p>
          <h1>Access Restricted</h1>
          <p>Only admins can manage users.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin</p>
        <h1>User Management</h1>
        <p>View users and suspend or unsuspend accounts.</p>
      </section>

      {message && <p className="upload-message">{message}</p>}

      <section className="contracts-grid">
        {users.map((user) => (
          <div key={user.id} className="dark-card contract-card">
            <h2>{user.full_name || "Unnamed User"}</h2>

            <p>
              <strong>Email:</strong> {user.email || "N/A"}
            </p>

            <p>
              <strong>Role:</strong> {user.role || "N/A"}
            </p>

            <p>
              <strong>Admin:</strong> {user.is_admin ? "Yes" : "No"}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {user.suspended ? "Suspended" : "Active"}
            </p>

            <div className="contract-actions">
              <button
                onClick={() => toggleSuspension(user.id, user.suspended)}
                className={user.suspended ? "accept-btn" : "reject-btn"}
              >
                {user.suspended ? "Unsuspend" : "Suspend"}
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}