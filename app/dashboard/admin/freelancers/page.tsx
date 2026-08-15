"use client";


import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

import FreelancerStats from "./components/FreelancerStats";
import FreelancerFilters from "./components/FreelancerFilters";
import FreelancerTable from "./components/FreelancerTable";
import FreelancerProfileModal from "./components/FreelancerProfileModal";
import FreelancerEditModal from "./components/FreelancerEditModal";
import DeleteFreelancerModal from "./components/DeleteFreelancerModal";
import FreelancerPagination from "./components/FreelancerPagination";

import type { UserProfile } from "../users/types";

export default function FreelancerManagementPage() {
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [freelancers, setFreelancers] = useState<UserProfile[]>([]);

  const [selectedFreelancer, setSelectedFreelancer] =
    useState<UserProfile | null>(null);

  const [editingFreelancer, setEditingFreelancer] =
    useState<UserProfile | null>(null);

  const [deletingFreelancer, setDeletingFreelancer] =
    useState<UserProfile | null>(null);

  const [page, setPage] = useState(1);
  const [verifiedOnly, setVerifiedOnly] =
  useState(false);

const [activeOnly, setActiveOnly] =
  useState(false);

const [suspendedOnly, setSuspendedOnly] =
  useState(false);

const [demoOnly, setDemoOnly] =
  useState(false);

const [topRatedOnly, setTopRatedOnly] =
  useState(false);
  const [sortField, setSortField] = useState<
  keyof UserProfile | ""
>("");

const [sortDirection, setSortDirection] = useState<
  "asc" | "desc"
>("asc");

  const pageSize = 20;

  useEffect(() => {
    loadFreelancers();
  }, []);
useEffect(() => {
  setPage(1);
}, [
  search,
  verifiedOnly,
  activeOnly,
  suspendedOnly,
  demoOnly,
  topRatedOnly,
]);
  async function loadFreelancers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "freelancer")
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      setFreelancers((data as UserProfile[]) ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function suspendFreelancer(
    id: string,
    suspended?: boolean | null
  ) {
    const { error } = await supabase
      .from("profiles")
      .update({
        suspended: !suspended,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadFreelancers();
  }
function handleSort(field: keyof UserProfile) {
  if (sortField === field) {
    setSortDirection((prev) =>
      prev === "asc" ? "desc" : "asc"
    );
  } else {
    setSortField(field);
    setSortDirection("asc");
  }
}
  // Search Filter
  const filteredFreelancers = useMemo(() => {
  const filtered = freelancers.filter((freelancer) => {
    const text =
      `${freelancer.full_name ?? ""} ${freelancer.email ?? ""} ${freelancer.category ?? ""} ${freelancer.location ?? ""}`
        .toLowerCase();

    if (!text.includes(search.toLowerCase()))
      return false;

    if (verifiedOnly && !freelancer.verified)
      return false;

    if (activeOnly && freelancer.suspended)
      return false;

    if (suspendedOnly && !freelancer.suspended)
      return false;

    if (demoOnly && !freelancer.is_demo)
      return false;

    if (topRatedOnly && !freelancer.top_rated)
      return false;

    return true;
  });

  if (!sortField) return filtered;

  return [...filtered].sort((a, b) => {
    const aValue = String(a[sortField] ?? "");
    const bValue = String(b[sortField] ?? "");

    return sortDirection === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });
}, [
  freelancers,
  search,
  verifiedOnly,
  activeOnly,
  suspendedOnly,
  demoOnly,
  topRatedOnly,
  sortField,
  sortDirection,
]);
  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredFreelancers.length / pageSize)
  );

  const paginatedFreelancers = filteredFreelancers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Statistics
  const stats = useMemo(() => {
    return {
      total: freelancers.length,

      verified: freelancers.filter((f) => f.verified).length,

      available: freelancers.filter((f) => !f.suspended).length,

      suspended: freelancers.filter((f) => f.suspended).length,

      topRated: freelancers.filter((f) => f.top_rated).length,

      demo: freelancers.filter((f) => f.is_demo).length,
    };
  }, [freelancers]);

  if (loading) {
    return (
      <main className="contracts-page">
        <h1>Loading freelancers...</h1>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Administration
        </p>

        <h1>Freelancer Management</h1>

        <p>
          Manage all registered freelancers on the platform.
        </p>

        <div style={{ marginTop: 20 }}>
          <Link
            href="/dashboard/admin"
            className="accept-btn"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </section>

      <FreelancerStats
        total={stats.total}
        verified={stats.verified}
        available={stats.available}
        suspended={stats.suspended}
        topRated={stats.topRated}
        demo={stats.demo}
      />

      <FreelancerFilters
  search={search}
  setSearch={setSearch}
  verifiedOnly={verifiedOnly}
  setVerifiedOnly={setVerifiedOnly}
  activeOnly={activeOnly}
  setActiveOnly={setActiveOnly}
  suspendedOnly={suspendedOnly}
  setSuspendedOnly={setSuspendedOnly}
  demoOnly={demoOnly}
  setDemoOnly={setDemoOnly}
  topRatedOnly={topRatedOnly}
  setTopRatedOnly={setTopRatedOnly}
/>

      <FreelancerTable
  freelancers={paginatedFreelancers}
  onView={setSelectedFreelancer}
  onEdit={setEditingFreelancer}
  onSuspend={suspendFreelancer}
  onDelete={setDeletingFreelancer}
  sortField={sortField}
  sortDirection={sortDirection}
  onSort={handleSort}
/>

      <FreelancerPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <FreelancerProfileModal
        freelancer={selectedFreelancer}
        onClose={() => setSelectedFreelancer(null)}
      />

      <FreelancerEditModal
        freelancer={editingFreelancer}
        onClose={() => setEditingFreelancer(null)}
        onSaved={loadFreelancers}
      />

      <DeleteFreelancerModal
        freelancer={deletingFreelancer}
        onClose={() => setDeletingFreelancer(null)}
        onDeleted={loadFreelancers}
      />
    </main>
  );
}