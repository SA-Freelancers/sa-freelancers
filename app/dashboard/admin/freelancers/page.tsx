"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "@/app/lib/supabase";

import FreelancerStats from "./components/FreelancerStats";
import FreelancerFilters from "./components/FreelancerFilters";
import FreelancerTable from "./components/FreelancerTable";
import FreelancerProfileModal from "./components/FreelancerProfileModal";
import FreelancerEditModal from "./components/FreelancerEditModal";
import DeleteFreelancerModal from "./components/DeleteFreelancerModal";
import FreelancerPagination from "./components/FreelancerPagination";

import type {
  UserProfile,
} from "../users/types";


type FreelancerProfile =
  UserProfile & {
    avatar_url?:
      | string
      | null;

    cv_url?:
      | string
      | null;

    portfolio_url?:
      | string
      | null;
  };


export default function FreelancerManagementPage() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadMessage,
    setLoadMessage,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    freelancers,
    setFreelancers,
  ] =
    useState<
      FreelancerProfile[]
    >([]);

  const [
    selectedFreelancer,
    setSelectedFreelancer,
  ] =
    useState<
      FreelancerProfile | null
    >(null);

  const [
    editingFreelancer,
    setEditingFreelancer,
  ] =
    useState<
      FreelancerProfile | null
    >(null);

  const [
    deletingFreelancer,
    setDeletingFreelancer,
  ] =
    useState<
      FreelancerProfile | null
    >(null);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    activeOnly,
    setActiveOnly,
  ] = useState(false);

  const [
    suspendedOnly,
    setSuspendedOnly,
  ] = useState(false);

  const [
    demoOnly,
    setDemoOnly,
  ] = useState(false);

  const [
    topRatedOnly,
    setTopRatedOnly,
  ] = useState(false);

  const [
    sortField,
    setSortField,
  ] =
    useState<
      keyof FreelancerProfile | ""
    >("");

  const [
    sortDirection,
    setSortDirection,
  ] =
    useState<
      "asc" | "desc"
    >("asc");

  const pageSize = 20;


  /* =========================================================
     LOAD FREELANCERS
     ========================================================= */

  useEffect(() => {
    void loadFreelancers();
  }, []);


  /* =========================================================
     RESET PAGINATION WHEN FILTERS CHANGE
     ========================================================= */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    activeOnly,
    suspendedOnly,
    demoOnly,
    topRatedOnly,
  ]);


  async function loadFreelancers() {
    setLoading(true);
    setLoadMessage("");

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setLoadMessage(
          "Your admin session has expired. Please log in again."
        );

        setFreelancers([]);

        return;
      }


      /*
       * Freelancer management now loads directly
       * from the profiles table.
       *
       * ID/passport verification is no longer part
       * of freelancer profile management.
       */

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq(
            "role",
            "freelancer"
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (error) {
        throw error;
      }

      setFreelancers(
        Array.isArray(data)
          ? (
              data as FreelancerProfile[]
            )
          : []
      );
    } catch (error) {
      console.error(
        "Freelancer loading error:",
        error
      );

      setLoadMessage(
        error instanceof Error
          ? error.message
          : "Unable to load freelancers."
      );

      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  }


  /* =========================================================
     SUSPEND / UNSUSPEND
     ========================================================= */

  async function suspendFreelancer(
    id: string,
    suspended?:
      | boolean
      | null
  ) {
    const {
      error,
    } =
      await supabase
        .from("profiles")
        .update({
          suspended:
            !suspended,
        })
        .eq(
          "id",
          id
        );

    if (error) {
      alert(
        error.message
      );

      return;
    }

    await loadFreelancers();
  }


  /* =========================================================
     SORTING
     ========================================================= */

  function handleSort(
    field:
      keyof FreelancerProfile
  ) {
    if (
      sortField ===
      field
    ) {
      setSortDirection(
        (previous) =>
          previous ===
          "asc"
            ? "desc"
            : "asc"
      );
    } else {
      setSortField(
        field
      );

      setSortDirection(
        "asc"
      );
    }
  }


  /* =========================================================
     FILTERING
     ========================================================= */

  const filteredFreelancers =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      const filtered =
        freelancers.filter(
          (
            freelancer
          ) => {
            const text =
              `${
                freelancer.full_name ??
                ""
              } ${
                freelancer.email ??
                ""
              } ${
                freelancer.category ??
                ""
              } ${
                freelancer.location ??
                ""
              }`
                .toLowerCase();

            if (
              searchText &&
              !text.includes(
                searchText
              )
            ) {
              return false;
            }


            /* ACTIVE */

            if (
              activeOnly &&
              freelancer.suspended
            ) {
              return false;
            }


            /* SUSPENDED */

            if (
              suspendedOnly &&
              !freelancer.suspended
            ) {
              return false;
            }


            /* DEMO */

            if (
              demoOnly &&
              !freelancer.is_demo
            ) {
              return false;
            }


            /* TOP RATED */

            if (
              topRatedOnly &&
              !freelancer.top_rated
            ) {
              return false;
            }

            return true;
          }
        );


      /* NO SORT SELECTED */

      if (
        !sortField
      ) {
        return filtered;
      }


      /* SORT RESULTS */

      return [
        ...filtered,
      ].sort(
        (
          a,
          b
        ) => {
          const aValue =
            String(
              a[
                sortField
              ] ?? ""
            );

          const bValue =
            String(
              b[
                sortField
              ] ?? ""
            );

          return (
            sortDirection ===
            "asc"
              ? aValue.localeCompare(
                  bValue
                )
              : bValue.localeCompare(
                  aValue
                )
          );
        }
      );
    }, [
      freelancers,
      search,
      activeOnly,
      suspendedOnly,
      demoOnly,
      topRatedOnly,
      sortField,
      sortDirection,
    ]);


  /* =========================================================
     PAGINATION
     ========================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredFreelancers.length /
          pageSize
      )
    );


  /*
   * Keep the current page valid if the number
   * of filtered results becomes smaller.
   */
  const safePage =
    Math.min(
      page,
      totalPages
    );


  const paginatedFreelancers =
    filteredFreelancers.slice(
      (safePage - 1) *
        pageSize,

      safePage *
        pageSize
    );


  /* =========================================================
     STATS
     ========================================================= */

  const stats =
    useMemo(() => {
      return {
        total:
          freelancers.length,

        available:
          freelancers.filter(
            (
              freelancer
            ) =>
              !freelancer.suspended
          ).length,

        suspended:
          freelancers.filter(
            (
              freelancer
            ) =>
              freelancer.suspended
          ).length,

        topRated:
          freelancers.filter(
            (
              freelancer
            ) =>
              freelancer.top_rated
          ).length,

        demo:
          freelancers.filter(
            (
              freelancer
            ) =>
              freelancer.is_demo
          ).length,
      };
    }, [
      freelancers,
    ]);


  /* =========================================================
     LOADING
     ========================================================= */

  if (
    loading
  ) {
    return (
      <main className="contracts-page">
        <h1>
          Loading freelancers...
        </h1>
      </main>
    );
  }


  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <main className="contracts-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="contracts-header dark-card">

        <p className="dashboard-badge">
          Administration
        </p>

        <h1>
          Freelancer Management
        </h1>

        <p>
          Manage registered freelancers,
          profile information and account
          access.
        </p>

        <div
          style={{
            marginTop: 20,
            display:
              "flex",
            gap: 10,
            flexWrap:
              "wrap",
          }}
        >
          <Link
            href="/dashboard/admin"
            className="accept-btn"
          >
            ← Back to Dashboard
          </Link>
        </div>

      </section>


      {/* =====================================================
          STATS
          ===================================================== */}

      <FreelancerStats
        total={
          stats.total
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

        demo={
          stats.demo
        }
      />


      {/* =====================================================
          LOAD MESSAGE
          ===================================================== */}

      {loadMessage && (
        <section
          className="dark-card"
          style={{
            padding: 16,
            marginBottom: 20,
          }}
        >
          {loadMessage}
        </section>
      )}


      {/* =====================================================
          FILTERS
          ===================================================== */}

      <FreelancerFilters
        search={
          search
        }

        setSearch={
          setSearch
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

        demoOnly={
          demoOnly
        }

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


      {/* =====================================================
          TABLE
          ===================================================== */}

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

        onSort={
          handleSort
        }
      />


      {/* =====================================================
          PAGINATION
          ===================================================== */}

      <FreelancerPagination
        page={
          safePage
        }

        totalPages={
          totalPages
        }

        onPageChange={
          setPage
        }
      />


      {/* =====================================================
          VIEW PROFILE
          ===================================================== */}

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


      {/* =====================================================
          EDIT FREELANCER
          ===================================================== */}

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


      {/* =====================================================
          DELETE FREELANCER
          ===================================================== */}

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