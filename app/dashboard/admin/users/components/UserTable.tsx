"use client";

import type { UserProfile } from "../types";

type Props = {
  users: UserProfile[];

  onSuspend: (
    id: string,
    suspended?: boolean | null
  ) => void;

  onView: React.Dispatch<
    React.SetStateAction<UserProfile | null>
  >;

  onEdit: React.Dispatch<
    React.SetStateAction<UserProfile | null>
  >;

  onDelete: (user: UserProfile) => void;
};

export default function UserTable({
  users,
  onSuspend,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <section
      className="dark-card"
      style={{
        overflowX: "auto",
        marginTop: 20,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 1100,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid rgba(255,255,255,.15)",
            }}
          >
            <th style={{ padding: "14px", textAlign: "left" }}>
              Name
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Email
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Role
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Category
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Location
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Status
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Verified
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Demo
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              style={{
                borderBottom:
                  "1px solid rgba(255,255,255,.06)",
              }}
            >
              <td style={{ padding: "14px" }}>
                {user.full_name || "Unnamed User"}
              </td>

              <td style={{ padding: "14px" }}>
                {user.email}
              </td>

              <td style={{ padding: "14px" }}>
                {user.is_admin ? (
                  <span className="verified-badge">
                    Administrator
                  </span>
                ) : user.role === "client" ? (
                  <span className="accept-btn">
                    Client
                  </span>
                ) : (
                  <span className="top-rated-badge">
                    Freelancer
                  </span>
                )}
              </td>

              <td style={{ padding: "14px" }}>
                {user.category || "-"}
              </td>

              <td style={{ padding: "14px" }}>
                {user.location || "-"}
              </td>

              <td style={{ padding: "14px" }}>
                {user.suspended ? (
                  <span className="reject-btn">
                    Suspended
                  </span>
                ) : (
                  <span className="accept-btn">
                    Active
                  </span>
                )}
              </td>

              <td style={{ padding: "14px" }}>
                {user.verified ? (
                  <span className="verified-badge">
                    Verified
                  </span>
                ) : (
                  "-"
                )}
              </td>

              <td style={{ padding: "14px" }}>
                {user.is_demo ? (
                  <span className="top-rated-badge">
                    Demo
                  </span>
                ) : (
                  "Real"
                )}
              </td>

              <td style={{ padding: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="accept-btn"
                    onClick={() => onView(user)}
                  >
                    View
                  </button>

                  <button
                    className="verified-btn"
                    onClick={() => onEdit(user)}
                  >
                    Edit
                  </button>

                  <button
                    className={
                      user.suspended
                        ? "accept-btn"
                        : "reject-btn"
                    }
                    onClick={() =>
                      onSuspend(
                        user.id,
                        user.suspended
                      )
                    }
                  >
                    {user.suspended
                      ? "Unsuspend"
                      : "Suspend"}
                  </button>

                  <button
                    className="reject-btn"
                    onClick={() =>
                      onDelete(user)
                    }
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {users.length === 0 && (
            <tr>
              <td
                colSpan={9}
                style={{
                  padding: 40,
                  textAlign: "center",
                  opacity: 0.7,
                }}
              >
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}