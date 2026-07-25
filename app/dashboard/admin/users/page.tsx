"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/app/lib/supabase";

import LoadingSkeleton from "@/app/components/LoadingSkeleton";

import UserStatistics from "./components/UserStatistics";
import UserFilters from "./components/UserFilters";
import UserTable from "./components/UserTable";
import UserPagination from "./components/UserPagination";
import UserViewModal from "./components/UserViewModal";
import UserEditModal from "./components/UserEditModal";
import type { UserProfile } from "./types";


export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [loading, setLoading] = useState(true);

  const [allowed, setAllowed] = useState(false);

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [role, setRole] = useState("all");

  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] =
    useState<UserProfile | null>(null);

  const [editingUser, setEditingUser] =
    useState<UserProfile | null>(null);

  const pageSize = 20;

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);

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
      .order("created_at", {
        ascending: false,
      });

    setUsers((data as UserProfile[]) || []);

    setLoading(false);
  }

  async function toggleSuspension(
    id: string,
    current?: boolean | null
  ) {
    const { error } = await supabase
      .from("profiles")
      .update({
        suspended: !current,
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              suspended: !current,
            }
          : u
      )
    );
  }
  const filteredUsers = useMemo(() => {
  return users.filter((user) => {
    const term = search.toLowerCase();

    const searchMatch =
      user.full_name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term);

    const roleMatch =
      role === "all" ||
      user.role === role ||
      (role === "admin" && user.is_admin);

    const statusMatch =
      status === "all" ||
      (status === "active" && !user.suspended) ||
      (status === "suspended" && user.suspended) ||
      (status === "demo" && user.is_demo) ||
      (status === "real" && !user.is_demo);

    return (
      searchMatch &&
      roleMatch &&
      statusMatch
    );
  });
}, [users, search, role, status]);

const statistics = {
  total: users.length,

  freelancers: users.filter(
    (u) => u.role === "freelancer"
  ).length,

  clients: users.filter(
    (u) => u.role === "client"
  ).length,

  admins: users.filter(
    (u) => u.is_admin
  ).length,

  demo: users.filter(
    (u) => u.is_demo
  ).length,

  suspended: users.filter(
    (u) => u.suspended
  ).length,

  verified: users.filter(
    (u) => u.verified
  ).length,
};

const totalPages = Math.max(
  1,
  Math.ceil(filteredUsers.length / pageSize)
);

const pageUsers = filteredUsers.slice(
  (page - 1) * pageSize,
  page * pageSize
);

async function saveUser(
  editedUser: UserProfile
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: editedUser.full_name,
      email: editedUser.email,
      category: editedUser.category,
      location: editedUser.location,
      bio: editedUser.bio,
    })
    .eq("id", editedUser.id);

  if (error) {
    setMessage(error.message);
    return;
  }

  setUsers((prev) =>
    prev.map((user) =>
      user.id === editedUser.id
        ? editedUser
        : user
    )
  );

  setEditingUser(null);

  setMessage("User updated.");
}

function deleteUser(user: UserProfile) {
  if (
    confirm(
      `Delete ${user.full_name}?`
    )
  ) {
    setMessage(
      "Delete function will be connected to Auth later."
    );
  }
}
    if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">
            Administrator
          </p>

          <h1>Access Restricted</h1>

          <p>
            Only administrators can access this page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">

      <section className="contracts-header dark-card">

        <p className="dashboard-badge">
          Administrator
        </p>

        <h1>User Management</h1>

        <p>
          Manage freelancers, clients and administrators.
        </p>

      </section>

      {message && (
        <p className="upload-message">
          {message}
        </p>
      )}

      <UserStatistics
        total={statistics.total}
        freelancers={statistics.freelancers}
        clients={statistics.clients}
        admins={statistics.admins}
        demo={statistics.demo}
        suspended={statistics.suspended}
        verified={statistics.verified}
      />

      <div
        style={{
          marginTop: 25,
        }}
      >

        <UserFilters
          search={search}
          setSearch={setSearch}
          role={role}
          setRole={setRole}
          status={status}
          setStatus={setStatus}
        />

      </div>

      <UserTable
        users={pageUsers}
        onSuspend={toggleSuspension}
        onView={setSelectedUser}
        onEdit={setEditingUser}
        onDelete={deleteUser}
      />

      <UserPagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />

      <UserViewModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />

      <UserEditModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={saveUser}
      />

    </main>
  );
}