"use client";

import type { UserProfile } from "../users/types";

type Props = {
  users: UserProfile[];
};

export default function RecentUsers({
  users,
}: Props) {
  return (
    <section
      className="dark-card"
      style={{
        padding: 24,
        marginTop: 24,
      }}
    >
      <h2
        style={{
          marginBottom: 20,
        }}
      >
        Recent Users
      </h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 10 }}>
              Name
            </th>

            <th style={{ textAlign: "left", padding: 10 }}>
              Email
            </th>

            <th style={{ textAlign: "left", padding: 10 }}>
              Role
            </th>

            <th style={{ textAlign: "left", padding: 10 }}>
              Joined
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: 10 }}>
                {user.full_name}
              </td>

              <td style={{ padding: 10 }}>
                {user.email}
              </td>

              <td style={{ padding: 10 }}>
                {user.is_admin
                  ? "Administrator"
                  : user.role}
              </td>

              <td style={{ padding: 10 }}>
                {user.created_at
                  ? new Date(
                      user.created_at
                    ).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
          ))}

          {users.length === 0 && (
            <tr>
              <td
                colSpan={4}
                style={{
                  padding: 25,
                  textAlign: "center",
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