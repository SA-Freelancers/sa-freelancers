"use client";

import type { UserProfile } from "../types";

type Props = {
  user: UserProfile | null;
  onClose: () => void;
};

export default function UserViewModal({
  user,
  onClose,
}: Props) {
  if (!user) return null;

  return (
    <div className="modal-overlay">
      <div
        className="dark-card"
        style={{
          width: 700,
          maxWidth: "95%",
          padding: 30,
          borderRadius: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2>User Profile</h2>

          <button
            className="reject-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            rowGap: 16,
            columnGap: 20,
          }}
        >
          <strong>Full Name</strong>
          <span>{user.full_name}</span>

          <strong>Email</strong>
          <span>{user.email}</span>

          <strong>Role</strong>
          <span>
            {user.is_admin
              ? "Administrator"
              : user.role}
          </span>

          <strong>Category</strong>
          <span>{user.category || "-"}</span>

          <strong>Country</strong>
          <span>{user.country || "-"}</span>

          <strong>Location</strong>
          <span>{user.location || "-"}</span>

          <strong>Completed Jobs</strong>
          <span>{user.completed_jobs ?? 0}</span>

          <strong>Verified</strong>
          <span>
            {user.verified ? "Yes" : "No"}
          </span>

          <strong>Demo Account</strong>
          <span>
            {user.is_demo ? "Yes" : "No"}
          </span>

          <strong>Status</strong>
          <span>
            {user.suspended
              ? "Suspended"
              : "Active"}
          </span>

          <strong>Biography</strong>

          <div
            style={{
              whiteSpace: "pre-wrap",
            }}
          >
            {user.bio || "No biography"}
          </div>
        </div>
      </div>
    </div>
  );
}