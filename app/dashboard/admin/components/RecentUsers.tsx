"use client";

import type {
  UserProfile,
} from "../users/types";

type Props = {
  users:
    UserProfile[];
};

function formatDate(
  date:
    string | null | undefined
) {
  if (!date) {
    return "-";
  }

  return new Date(
    date
  ).toLocaleDateString();
}

function getRole(
  user:
    UserProfile
) {
  if (
    user.is_admin
  ) {
    return "Administrator";
  }

  if (
    user.role ===
    "freelancer"
  ) {
    return "Freelancer";
  }

  if (
    user.role ===
    "client"
  ) {
    return "Client";
  }

  return (
    user.role ||
    "User"
  );
}

export default function RecentUsers({
  users,
}: Props) {
  return (
    <section className="dark-card admin-recent-card">
      <h2>
        Recent Users
      </h2>

      {/* DESKTOP TABLE */}

      <div className="admin-desktop-table">
        <table className="admin-recent-table">
          <thead>
            <tr>
              <th>
                Name
              </th>

              <th>
                Email
              </th>

              <th>
                Role
              </th>

              <th>
                Joined
              </th>
            </tr>
          </thead>

          <tbody>
            {users.map(
              (
                user
              ) => (
                <tr
                  key={
                    user.id
                  }
                >
                  <td>
                    {user.full_name ||
                      "Unnamed User"}
                  </td>

                  <td>
                    {user.email ||
                      "-"}
                  </td>

                  <td>
                    {getRole(
                      user
                    )}
                  </td>

                  <td>
                    {formatDate(
                      user.created_at
                    )}
                  </td>
                </tr>
              )
            )}

            {users.length ===
              0 && (
              <tr>
                <td
                  colSpan={
                    4
                  }
                  className="admin-empty-table"
                >
                  No users
                  found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}

      <div className="admin-mobile-list">
        {users.map(
          (
            user
          ) => (
            <article
              key={
                user.id
              }
              className="admin-mobile-record"
            >
              <div className="admin-mobile-record-top">
                <strong>
                  {user.full_name ||
                    "Unnamed User"}
                </strong>

                <span className="admin-mobile-role">
                  {getRole(
                    user
                  )}
                </span>
              </div>

              <div className="admin-mobile-record-row">
                <span>
                  Email
                </span>

                <span>
                  {user.email ||
                    "-"}
                </span>
              </div>

              <div className="admin-mobile-record-row">
                <span>
                  Joined
                </span>

                <span>
                  {formatDate(
                    user.created_at
                  )}
                </span>
              </div>
            </article>
          )
        )}

        {users.length ===
          0 && (
          <div className="admin-empty-mobile">
            No users found.
          </div>
        )}
      </div>
    </section>
  );
}