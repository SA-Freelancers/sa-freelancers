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
        }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Category</th>
            <th>Location</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Demo</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.full_name}</td>

              <td>{user.email}</td>

              <td>
                {user.is_admin
                  ? "Administrator"
                  : user.role}
              </td>

              <td>{user.category}</td>

              <td>{user.location}</td>

              <td>
                {user.suspended
                  ? "Suspended"
                  : "Active"}
              </td>

              <td>
                {user.verified ? "✔" : "—"}
              </td>

              <td>
                {user.is_demo ? "Demo" : "Real"}
              </td>

              <td>
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
        </tbody>
      </table>
    </section>
  );
}