"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "@/app/lib/supabase";

import LoadingSkeleton from "@/app/components/LoadingSkeleton";

import UserStatistics from "./components/UserStatistics";
import UserFilters from "./components/UserFilters";
import UserTable from "./components/UserTable";
import UserPagination from "./components/UserPagination";
import UserViewModal from "./components/UserViewModal";
import UserEditModal from "./components/UserEditModal";

import type {
  UserProfile,
} from "./types";

export default function AdminUsersPage() {
  const [
    users,
    setUsers,
  ] = useState<
    UserProfile[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    allowed,
    setAllowed,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    role,
    setRole,
  ] = useState("all");

  const [
    status,
    setStatus,
  ] = useState("all");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<UserProfile | null>(
      null
    );

  const [
    editingUser,
    setEditingUser,
  ] =
    useState<UserProfile | null>(
      null
    );

  const [
    actionLoadingId,
    setActionLoadingId,
  ] =
    useState<string | null>(
      null
    );

  const pageSize =
    20;

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    void loadUsers();
  }, []);

  // ==================================================
  // LOAD USERS
  // ==================================================

  async function loadUsers() {
    setLoading(
      true
    );

    setMessage(
      ""
    );

    try {
      const {
        data:
          sessionData,
        error:
          sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        setAllowed(
          false
        );

        setMessage(
          "Please login again."
        );

        return;
      }

      const user =
        sessionData.session.user;

      const {
        data:
          adminProfile,
        error:
          adminError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "is_admin"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      if (
        adminError
      ) {
        console.error(
          "Admin verification error:",
          adminError
        );

        setAllowed(
          false
        );

        setMessage(
          "Unable to verify administrator access."
        );

        return;
      }

      if (
        !adminProfile
          ?.is_admin
      ) {
        setAllowed(
          false
        );

        return;
      }

      setAllowed(
        true
      );

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "*"
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (
        error
      ) {
        console.error(
          "Users loading error:",
          error
        );

        setMessage(
          error.message
        );

        return;
      }

      setUsers(
        (
          data as
            UserProfile[]
        ) || []
      );
    } catch (
      error
    ) {
      console.error(
        "Admin users loading error:",
        error
      );

      setMessage(
        "Unable to load users."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  // ==================================================
  // GET SESSION TOKEN
  // ==================================================

  async function getAccessToken() {
    const {
      data:
        sessionData,
      error:
        sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError ||
      !sessionData.session
    ) {
      throw new Error(
        "Please login again."
      );
    }

    return sessionData
      .session
      .access_token;
  }

  // ==================================================
  // SUSPEND / UNSUSPEND
  // ==================================================

  async function toggleSuspension(
    id: string,
    current?: boolean | null
  ) {
    if (
      actionLoadingId
    ) {
      return;
    }

    setMessage(
      ""
    );

    setActionLoadingId(
      id
    );

    try {
      const accessToken =
        await getAccessToken();

      const suspended =
        !Boolean(
          current
        );

      const response =
        await fetch(
          "/api/admin/users",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                id,
                action:
                  "suspension",
                suspended,
              }),
          }
        );

      const text =
        await response.text();

      let result: {
        success?: boolean;
        suspended?: boolean;
        error?: string;
      } = {};

      try {
        result =
          text
            ? JSON.parse(
                text
              )
            : {};
      } catch {
        setMessage(
          `Server returned an invalid response (${response.status}).`
        );

        return;
      }

      if (
        !response.ok ||
        !result.success
      ) {
        setMessage(
          result.error ||
            "Unable to update user status."
        );

        return;
      }

      setUsers(
        (
          previous
        ) =>
          previous.map(
            (
              user
            ) =>
              user.id ===
              id
                ? {
                    ...user,
                    suspended:
                      Boolean(
                        result.suspended
                      ),
                  }
                : user
          )
      );

      if (
        selectedUser
          ?.id === id
      ) {
        setSelectedUser(
          (
            previous
          ) =>
            previous
              ? {
                  ...previous,
                  suspended:
                    Boolean(
                      result.suspended
                    ),
                }
              : previous
        );
      }

      setMessage(
        result.suspended
          ? "User suspended."
          : "User unsuspended."
      );
    } catch (
      error
    ) {
      console.error(
        "User suspension error:",
        error
      );

      setMessage(
        error instanceof
          Error
          ? error.message
          : "Unable to update user status."
      );
    } finally {
      setActionLoadingId(
        null
      );
    }
  }

  // ==================================================
  // FILTER USERS
  // ==================================================

  const filteredUsers =
    useMemo(() => {
      return users.filter(
        (
          user
        ) => {
          const term =
            search
              .trim()
              .toLowerCase();

          const searchMatch =
            !term ||
            user.full_name
              ?.toLowerCase()
              .includes(
                term
              ) ||
            user.email
              ?.toLowerCase()
              .includes(
                term
              );

          const roleMatch =
            role ===
              "all" ||
            user.role ===
              role ||
            (
              role ===
                "admin" &&
              user.is_admin
            );

          const statusMatch =
            status ===
              "all" ||
            (
              status ===
                "active" &&
              !user.suspended
            ) ||
            (
              status ===
                "suspended" &&
              user.suspended
            ) ||
            (
              status ===
                "demo" &&
              user.is_demo
            ) ||
            (
              status ===
                "real" &&
              !user.is_demo
            );

          return (
            searchMatch &&
            roleMatch &&
            statusMatch
          );
        }
      );
    }, [
      users,
      search,
      role,
      status,
    ]);

  // ==================================================
  // RESET PAGE WHEN FILTERS CHANGE
  // ==================================================

  useEffect(() => {
    setPage(
      1
    );
  }, [
    search,
    role,
    status,
  ]);

  // ==================================================
  // STATISTICS
  // ==================================================

  const statistics = {
    total:
      users.length,

    freelancers:
      users.filter(
        (
          user
        ) =>
          user.role ===
          "freelancer"
      ).length,

    clients:
      users.filter(
        (
          user
        ) =>
          user.role ===
          "client"
      ).length,

    admins:
      users.filter(
        (
          user
        ) =>
          Boolean(
            user.is_admin
          )
      ).length,

    demo:
      users.filter(
        (
          user
        ) =>
          Boolean(
            user.is_demo
          )
      ).length,

    suspended:
      users.filter(
        (
          user
        ) =>
          Boolean(
            user.suspended
          )
      ).length,

    verified:
      users.filter(
        (
          user
        ) =>
          Boolean(
            user.verified
          )
      ).length,
  };

  // ==================================================
  // PAGINATION
  // ==================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredUsers.length /
          pageSize
      )
    );

  useEffect(() => {
    if (
      page >
      totalPages
    ) {
      setPage(
        totalPages
      );
    }
  }, [
    page,
    totalPages,
  ]);

  const pageUsers =
    filteredUsers.slice(
      (
        page -
        1
      ) *
        pageSize,
      page *
        pageSize
    );

  // ==================================================
  // SAVE USER
  // ==================================================

  async function saveUser(
    editedUser:
      UserProfile
  ) {
    if (
      actionLoadingId
    ) {
      return;
    }

    setMessage(
      ""
    );

    setActionLoadingId(
      editedUser.id
    );

    try {
      const accessToken =
        await getAccessToken();

      const response =
        await fetch(
          "/api/admin/users",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                id:
                  editedUser.id,

                action:
                  "edit",

                full_name:
                  editedUser.full_name,

                email:
                  editedUser.email,

                category:
                  editedUser.category,

                location:
                  editedUser.location,

                country:
                  editedUser.country,

                bio:
                  editedUser.bio,
              }),
          }
        );

      const text =
        await response.text();

      let result: {
        success?: boolean;
        user?: UserProfile;
        error?: string;
      } = {};

      try {
        result =
          text
            ? JSON.parse(
                text
              )
            : {};
      } catch {
        setMessage(
          `Server returned an invalid response (${response.status}).`
        );

        return;
      }

      if (
        !response.ok ||
        !result.success ||
        !result.user
      ) {
        setMessage(
          result.error ||
            "Unable to update user."
        );

        return;
      }

      const updatedUser =
        result.user;

      setUsers(
        (
          previous
        ) =>
          previous.map(
            (
              user
            ) =>
              user.id ===
              updatedUser.id
                ? updatedUser
                : user
          )
      );

      if (
        selectedUser
          ?.id ===
        updatedUser.id
      ) {
        setSelectedUser(
          updatedUser
        );
      }

      setEditingUser(
        null
      );

      setMessage(
        "User updated successfully."
      );
    } catch (
      error
    ) {
      console.error(
        "User update error:",
        error
      );

      setMessage(
        error instanceof
          Error
          ? error.message
          : "Unable to update user."
      );
    } finally {
      setActionLoadingId(
        null
      );
    }
  }

  // ==================================================
  // DELETE USER
  // ==================================================

  async function deleteUser(
    user: UserProfile
  ) {
    if (
      actionLoadingId
    ) {
      return;
    }

    const displayName =
      user.full_name ||
      user.email ||
      "this user";

    const confirmed =
      window.confirm(
        `Delete ${displayName}?\n\nThis will permanently remove the user's authentication account. This action cannot be undone.`
      );

    if (
      !confirmed
    ) {
      return;
    }

    setMessage(
      ""
    );

    setActionLoadingId(
      user.id
    );

    try {
      const accessToken =
        await getAccessToken();

      const response =
        await fetch(
          "/api/admin/users",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                id:
                  user.id,
              }),
          }
        );

      const text =
        await response.text();

      let result: {
        success?: boolean;
        id?: string;
        error?: string;
      } = {};

      try {
        result =
          text
            ? JSON.parse(
                text
              )
            : {};
      } catch {
        setMessage(
          `Server returned an invalid response (${response.status}).`
        );

        return;
      }

      if (
        !response.ok ||
        !result.success
      ) {
        setMessage(
          result.error ||
            "Unable to delete user."
        );

        return;
      }

      setUsers(
        (
          previous
        ) =>
          previous.filter(
            (
              item
            ) =>
              item.id !==
              user.id
          )
      );

      if (
        selectedUser
          ?.id ===
        user.id
      ) {
        setSelectedUser(
          null
        );
      }

      if (
        editingUser
          ?.id ===
        user.id
      ) {
        setEditingUser(
          null
        );
      }

      setMessage(
        "User deleted successfully."
      );
    } catch (
      error
    ) {
      console.error(
        "User deletion error:",
        error
      );

      setMessage(
        error instanceof
          Error
          ? error.message
          : "Unable to delete user."
      );
    } finally {
      setActionLoadingId(
        null
      );
    }
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (
    loading
  ) {
    return (
      <LoadingSkeleton />
    );
  }

  // ==================================================
  // ACCESS DENIED
  // ==================================================

  if (
    !allowed
  ) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">
            Administrator
          </p>

          <h1>
            Access Restricted
          </h1>

          <p>
            Only administrators
            can access this page.
          </p>
        </section>
      </main>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Administrator
        </p>

        <h1>
          User Management
        </h1>

        <p>
          Manage freelancers,
          clients and
          administrators.
        </p>
      </section>

      {message && (
        <p className="upload-message">
          {message}
        </p>
      )}

      <UserStatistics
        total={
          statistics.total
        }
        freelancers={
          statistics.freelancers
        }
        clients={
          statistics.clients
        }
        admins={
          statistics.admins
        }
        demo={
          statistics.demo
        }
        suspended={
          statistics.suspended
        }
        verified={
          statistics.verified
        }
      />

      <div
        style={{
          marginTop:
            25,
        }}
      >
        <UserFilters
          search={
            search
          }
          setSearch={
            setSearch
          }
          role={
            role
          }
          setRole={
            setRole
          }
          status={
            status
          }
          setStatus={
            setStatus
          }
        />
      </div>

      <UserTable
        users={
          pageUsers
        }
        onSuspend={
          toggleSuspension
        }
        onView={
          setSelectedUser
        }
        onEdit={
          setEditingUser
        }
        onDelete={
          deleteUser
        }
      />

      <UserPagination
        page={
          page
        }
        totalPages={
          totalPages
        }
        setPage={
          setPage
        }
      />

      <UserViewModal
        user={
          selectedUser
        }
        onClose={() =>
          setSelectedUser(
            null
          )
        }
      />

      <UserEditModal
        user={
          editingUser
        }
        onClose={() =>
          setEditingUser(
            null
          )
        }
        onSave={
          saveUser
        }
      />
    </main>
  );
}