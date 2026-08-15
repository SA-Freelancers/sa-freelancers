"use client";

import type { UserProfile } from "../../users/types";

type Props = {
  freelancers: UserProfile[];

  onView: (freelancer: UserProfile) => void;

  onEdit: (freelancer: UserProfile) => void;

  onSuspend: (
    id: string,
    suspended?: boolean | null
  ) => void;

  onDelete: (freelancer: UserProfile) => void;

  sortField: string;

  sortDirection: "asc" | "desc";

  onSort: (field: keyof UserProfile) => void;
};

export default function FreelancerTable({
  freelancers,
  onView,
  onEdit,
  onSuspend,
  onDelete,
  sortField,
  sortDirection,
  onSort,
}: Props) {
  return (
    <section
      className="dark-card"
      style={{
        padding: 20,
        marginTop: 24,
        overflowX: "auto",
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
    <th
      style={{ cursor: "pointer" }}
      onClick={() => onSort("full_name")}
    >
      Name{" "}
      {sortField === "full_name"
        ? sortDirection === "asc"
          ? "▲"
          : "▼"
        : ""}
    </th>

    <th
      style={{ cursor: "pointer" }}
      onClick={() => onSort("email")}
    >
      Email{" "}
      {sortField === "email"
        ? sortDirection === "asc"
          ? "▲"
          : "▼"
        : ""}
    </th>

    <th
      style={{ cursor: "pointer" }}
      onClick={() => onSort("category")}
    >
      Category{" "}
      {sortField === "category"
        ? sortDirection === "asc"
          ? "▲"
          : "▼"
        : ""}
    </th>

    <th
      style={{ cursor: "pointer" }}
      onClick={() => onSort("location")}
    >
      Location{" "}
      {sortField === "location"
        ? sortDirection === "asc"
          ? "▲"
          : "▼"
        : ""}
    </th>

    <th>Status</th>
    <th>Verified</th>
    <th>Demo</th>
    <th>Actions</th>
  </tr>
</thead>

        <tbody>
          {freelancers.map((freelancer) => (
            <tr key={freelancer.id}>
              <td>{freelancer.full_name}</td>

              <td>{freelancer.email}</td>

              <td>{freelancer.category ?? "-"}</td>

              <td>{freelancer.location ?? "-"}</td>

              <td>
                {freelancer.suspended ? (
                  <span className="reject-btn">
                    Suspended
                  </span>
                ) : (
                  <span className="accept-btn">
                    Active
                  </span>
                )}
              </td>

              <td>
                {freelancer.verified ? "✔" : "—"}
              </td>

              <td>
                {freelancer.is_demo ? "Demo" : "Real"}
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
                    onClick={() => onView(freelancer)}
                  >
                    View
                  </button>

                  <button
  className="verified-btn"
  onClick={() => onEdit(freelancer)}
>
  Edit
</button>

                  <button
  className={
    freelancer.suspended
      ? "accept-btn"
      : "reject-btn"
  }
  onClick={() =>
    onSuspend(
      freelancer.id,
      freelancer.suspended
    )
  }
>
  {freelancer.suspended
    ? "Unsuspend"
    : "Suspend"}
</button>
<button
  className="reject-btn"
  onClick={() => onDelete(freelancer)}
>
  Delete
</button>
                </div>
              </td>
            </tr>
          ))}

          {freelancers.length === 0 && (
            <tr>
              <td
                colSpan={8}
                style={{
                  textAlign: "center",
                  padding: 40,
                }}
              >
                No freelancers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}