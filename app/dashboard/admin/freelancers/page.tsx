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

type VerificationStatus =
  | "not_submitted"
  | "pending"
  | "verified"
  | "rejected";

type FreelancerProfile = UserProfile & {
  avatar_url?: string | null;
  cv_url?: string | null;
  portfolio_url?: string | null;

  verification_status?: VerificationStatus | string | null;
  verification_document_url?: string | null;
  verification_document_signed_url?: string | null;
};

export default function FreelancerManagementPage() {
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [freelancers, setFreelancers] = useState<
    FreelancerProfile[]
  >([]);

  const [selectedFreelancer, setSelectedFreelancer] =
    useState<FreelancerProfile | null>(null);

  const [editingFreelancer, setEditingFreelancer] =
    useState<FreelancerProfile | null>(null);

  const [deletingFreelancer, setDeletingFreelancer] =
    useState<FreelancerProfile | null>(null);

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

  const [
    pendingVerificationOnly,
    setPendingVerificationOnly,
  ] = useState(false);

  const [sortField, setSortField] = useState<
    keyof FreelancerProfile | ""
  >("");

  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("asc");

  const [
    processingVerificationId,
    setProcessingVerificationId,
  ] = useState<string | null>(null);

  const [
    verificationMessage,
    setVerificationMessage,
  ] = useState("");

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
    pendingVerificationOnly,
  ]);

  async function getFreshAdminSession() {
    const {
      data,
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      console.error(
        "Session refresh error:",
        error
      );

      throw new Error(
        "Your admin session has expired. Please log in again."
      );
    }

    if (!data.session?.access_token) {
      throw new Error(
        "Your admin session has expired. Please log in again."
      );
    }

    return data.session;
  }

  async function loadFreelancers() {
    setLoading(true);
    setVerificationMessage("");

    try {
      const session =
        await getFreshAdminSession();

      const response = await fetch(
        "/api/admin/freelancer-verifications?status=all",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The freelancer verification API returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Unable to load freelancers."
        );
      }

      setFreelancers(
        Array.isArray(result.verifications)
          ? result.verifications
          : []
      );
    } catch (error) {
      console.error(
        "Freelancer loading error:",
        error
      );

      setVerificationMessage(
        error instanceof Error
          ? error.message
          : "Unable to load freelancers."
      );

      setFreelancers([]);
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

    await loadFreelancers();
  }

  async function handleVerificationAction(
    freelancer: FreelancerProfile,
    action: "approve" | "reject"
  ) {
    const name =
      freelancer.full_name ||
      freelancer.email ||
      "this freelancer";

    const confirmed = window.confirm(
      action === "approve"
        ? `Approve freelancer verification for ${name}?`
        : `Reject freelancer verification for ${name}?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingVerificationId(
      freelancer.id
    );

    setVerificationMessage("");

    try {
      const session =
        await getFreshAdminSession();

      const response = await fetch(
        "/api/admin/freelancer-verifications",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            freelancerId:
              freelancer.id,
            action,
          }),
        }
      );

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The freelancer verification API returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Unable to update freelancer verification."
        );
      }

      setVerificationMessage(
        result.message ||
          "Verification updated successfully."
      );

      await loadFreelancers();
    } catch (error) {
      console.error(
        "Verification action error:",
        error
      );

      setVerificationMessage(
        error instanceof Error
          ? error.message
          : "Unable to update freelancer verification."
      );
    } finally {
      setProcessingVerificationId(
        null
      );
    }
  }

  function handleSort(
    field: keyof FreelancerProfile
  ) {
    if (sortField === field) {
      setSortDirection((prev) =>
        prev === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  const filteredFreelancers =
    useMemo(() => {
      const filtered =
        freelancers.filter(
          (freelancer) => {
            const text =
              `${freelancer.full_name ?? ""} ${freelancer.email ?? ""} ${freelancer.category ?? ""} ${freelancer.location ?? ""}`.toLowerCase();

            if (
              !text.includes(
                search.toLowerCase()
              )
            ) {
              return false;
            }

            if (
              verifiedOnly &&
              !freelancer.verified
            ) {
              return false;
            }

            if (
              activeOnly &&
              freelancer.suspended
            ) {
              return false;
            }

            if (
              suspendedOnly &&
              !freelancer.suspended
            ) {
              return false;
            }

            if (
              demoOnly &&
              !freelancer.is_demo
            ) {
              return false;
            }

            if (
              topRatedOnly &&
              !freelancer.top_rated
            ) {
              return false;
            }

            if (
              pendingVerificationOnly &&
              freelancer.verification_status !==
                "pending"
            ) {
              return false;
            }

            return true;
          }
        );

      if (!sortField) {
        return filtered;
      }

      return [...filtered].sort(
        (a, b) => {
          const aValue = String(
            a[sortField] ?? ""
          );

          const bValue = String(
            b[sortField] ?? ""
          );

          return sortDirection ===
            "asc"
            ? aValue.localeCompare(
                bValue
              )
            : bValue.localeCompare(
                aValue
              );
        }
      );
    }, [
      freelancers,
      search,
      verifiedOnly,
      activeOnly,
      suspendedOnly,
      demoOnly,
      topRatedOnly,
      pendingVerificationOnly,
      sortField,
      sortDirection,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFreelancers.length /
        pageSize
    )
  );

  const paginatedFreelancers =
    filteredFreelancers.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

  const stats = useMemo(() => {
    return {
      total:
        freelancers.length,

      verified:
        freelancers.filter(
          (f) =>
            f.verified ||
            f.verification_status ===
              "verified"
        ).length,

      pendingVerification:
        freelancers.filter(
          (f) =>
            f.verification_status ===
            "pending"
        ).length,

      rejectedVerification:
        freelancers.filter(
          (f) =>
            f.verification_status ===
            "rejected"
        ).length,

      available:
        freelancers.filter(
          (f) => !f.suspended
        ).length,

      suspended:
        freelancers.filter(
          (f) => f.suspended
        ).length,

      topRated:
        freelancers.filter(
          (f) => f.top_rated
        ).length,

      demo:
        freelancers.filter(
          (f) => f.is_demo
        ).length,
    };
  }, [freelancers]);

  if (loading) {
    return (
      <main className="contracts-page">
        <h1>
          Loading freelancers...
        </h1>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Administration
        </p>

        <h1>
          Freelancer Management
        </h1>

        <p>
          Manage registered
          freelancers and review
          freelancer verification
          requests.
        </p>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/dashboard/admin"
            className="accept-btn"
          >
            ← Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={() =>
              setPendingVerificationOnly(
                (current) =>
                  !current
              )
            }
            style={{
              minHeight: 42,
              padding:
                "0 16px",
              borderRadius: 10,
              cursor:
                "pointer",
              fontWeight: 800,

              border:
                pendingVerificationOnly
                  ? "1px solid rgba(245,158,11,.5)"
                  : "1px solid rgba(148,163,184,.2)",

              background:
                pendingVerificationOnly
                  ? "rgba(245,158,11,.15)"
                  : "rgba(148,163,184,.08)",

              color:
                pendingVerificationOnly
                  ? "#f59e0b"
                  : "inherit",
            }}
          >
            Pending Verification (
            {
              stats.pendingVerification
            }
            )
          </button>
        </div>
      </section>

      <FreelancerStats
        total={stats.total}
        verified={
          stats.verified
        }
        available={
          stats.available
        }
        suspended={
          stats.suspended
        }
        topRated={
          stats.topRated
        }
        demo={stats.demo}
      />

      {verificationMessage && (
        <section
          className="dark-card"
          style={{
            padding: 16,
            marginBottom: 20,
          }}
        >
          {verificationMessage}
        </section>
      )}

      {stats.pendingVerification >
        0 && (
        <section
          className="dark-card"
          style={{
            padding: 22,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <p className="dashboard-badge">
                Verification Queue
              </p>

              <h2
                style={{
                  margin:
                    "6px 0",
                }}
              >
                Pending Freelancer
                Verification
              </h2>

              <p
                style={{
                  margin: 0,
                  opacity: 0.75,
                }}
              >
                Review the submitted
                identity document
                before approving an
                account.
              </p>
            </div>

            <strong
              style={{
                color:
                  "#f59e0b",
              }}
            >
              {
                stats.pendingVerification
              }{" "}
              pending
            </strong>
          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
            }}
          >
            {freelancers
              .filter(
                (
                  freelancer
                ) =>
                  freelancer.verification_status ===
                  "pending"
              )
              .map(
                (
                  freelancer
                ) => {
                  const processing =
                    processingVerificationId ===
                    freelancer.id;

                  return (
                    <article
                      key={
                        freelancer.id
                      }
                      style={{
                        padding: 18,
                        borderRadius:
                          14,
                        border:
                          "1px solid rgba(148,163,184,.16)",
                        background:
                          "rgba(148,163,184,.05)",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: 18,
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin:
                                "0 0 5px",
                            }}
                          >
                            {freelancer.full_name ||
                              "Unnamed Freelancer"}
                          </h3>

                          <p
                            style={{
                              margin:
                                "0 0 5px",
                              opacity:
                                0.76,
                            }}
                          >
                            {freelancer.email ||
                              "No email"}
                          </p>

                          <p
                            style={{
                              margin:
                                0,
                              opacity:
                                0.7,
                            }}
                          >
                            {freelancer.category ||
                              "No category"}

                            {freelancer.location
                              ? ` • ${freelancer.location}`
                              : ""}
                          </p>
                        </div>

                        <span
                          style={{
                            padding:
                              "8px 12px",
                            borderRadius:
                              999,
                            background:
                              "rgba(245,158,11,.12)",
                            border:
                              "1px solid rgba(245,158,11,.25)",
                            color:
                              "#f59e0b",
                            fontWeight:
                              800,
                          }}
                        >
                          Pending
                          Verification
                        </span>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: 10,
                          flexWrap:
                            "wrap",
                          marginTop:
                            18,
                        }}
                      >
                        {freelancer.verification_document_signed_url ? (
                          <a
                            href={
                              freelancer.verification_document_signed_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              minHeight:
                                42,
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              padding:
                                "0 15px",
                              borderRadius:
                                10,
                              textDecoration:
                                "none",
                              fontWeight:
                                800,
                              background:
                                "rgba(59,130,246,.12)",
                              border:
                                "1px solid rgba(59,130,246,.25)",
                            }}
                          >
                            View ID
                            Document
                          </a>
                        ) : (
                          <span
                            style={{
                              minHeight:
                                42,
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              opacity:
                                0.65,
                            }}
                          >
                            No ID
                            document
                          </span>
                        )}

                        {freelancer.cv_url && (
                          <a
                            href={
                              freelancer.cv_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              minHeight:
                                42,
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              padding:
                                "0 15px",
                              borderRadius:
                                10,
                              textDecoration:
                                "none",
                              fontWeight:
                                800,
                              background:
                                "rgba(148,163,184,.08)",
                              border:
                                "1px solid rgba(148,163,184,.18)",
                            }}
                          >
                            View CV
                          </a>
                        )}

                        <button
                          type="button"
                          disabled={
                            processing ||
                            !freelancer.verification_document_url
                          }
                          onClick={() =>
                            handleVerificationAction(
                              freelancer,
                              "approve"
                            )
                          }
                          style={{
                            minHeight:
                              42,
                            padding:
                              "0 16px",
                            borderRadius:
                              10,
                            border:
                              "none",
                            cursor:
                              processing
                                ? "not-allowed"
                                : "pointer",
                            background:
                              "#22c55e",
                            color:
                              "#07130b",
                            fontWeight:
                              900,
                            opacity:
                              processing
                                ? 0.65
                                : 1,
                          }}
                        >
                          {processing
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            processing
                          }
                          onClick={() =>
                            handleVerificationAction(
                              freelancer,
                              "reject"
                            )
                          }
                          style={{
                            minHeight:
                              42,
                            padding:
                              "0 16px",
                            borderRadius:
                              10,
                            cursor:
                              processing
                                ? "not-allowed"
                                : "pointer",
                            background:
                              "rgba(239,68,68,.12)",
                            color:
                              "#ef4444",
                            border:
                              "1px solid rgba(239,68,68,.25)",
                            fontWeight:
                              900,
                            opacity:
                              processing
                                ? 0.65
                                : 1,
                          }}
                        >
                          {processing
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
          </div>
        </section>
      )}

      <FreelancerFilters
        search={search}
        setSearch={setSearch}
        verifiedOnly={
          verifiedOnly
        }
        setVerifiedOnly={
          setVerifiedOnly
        }
        activeOnly={
          activeOnly
        }
        setActiveOnly={
          setActiveOnly
        }
        suspendedOnly={
          suspendedOnly
        }
        setSuspendedOnly={
          setSuspendedOnly
        }
        demoOnly={demoOnly}
        setDemoOnly={
          setDemoOnly
        }
        topRatedOnly={
          topRatedOnly
        }
        setTopRatedOnly={
          setTopRatedOnly
        }
      />

      <FreelancerTable
        freelancers={
          paginatedFreelancers
        }
        onView={
          setSelectedFreelancer
        }
        onEdit={
          setEditingFreelancer
        }
        onSuspend={
          suspendFreelancer
        }
        onDelete={
          setDeletingFreelancer
        }
        sortField={
          sortField
        }
        sortDirection={
          sortDirection
        }
        onSort={handleSort}
      />

      <FreelancerPagination
        page={page}
        totalPages={
          totalPages
        }
        onPageChange={
          setPage
        }
      />

      <FreelancerProfileModal
        freelancer={
          selectedFreelancer
        }
        onClose={() =>
          setSelectedFreelancer(
            null
          )
        }
      />

      <FreelancerEditModal
        freelancer={
          editingFreelancer
        }
        onClose={() =>
          setEditingFreelancer(
            null
          )
        }
        onSaved={
          loadFreelancers
        }
      />

      <DeleteFreelancerModal
        freelancer={
          deletingFreelancer
        }
        onClose={() =>
          setDeletingFreelancer(
            null
          )
        }
        onDeleted={
          loadFreelancers
        }
      />
    </main>
  );
}