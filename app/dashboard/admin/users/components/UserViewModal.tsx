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
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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

        <hr />

        <h3>{user.full_name}</h3>

        <p>

          <strong>Email:</strong>

          {user.email}

        </p>

        <p>

          <strong>Role:</strong>

          {user.is_admin
            ? "Administrator"
            : user.role}

        </p>

        <p>

          <strong>Category:</strong>

          {user.category || "-"}

        </p>

        <p>

          <strong>Location:</strong>

          {user.location || "-"}

        </p>

        <p>

          <strong>Country:</strong>

          {user.country || "-"}

        </p>

        <p>

          <strong>Completed Jobs:</strong>

          {user.completed_jobs ?? 0}

        </p>

        <p>

          <strong>Verified:</strong>

          {user.verified ? "Yes" : "No"}

        </p>

        <p>

          <strong>Top Rated:</strong>

          {user.top_rated ? "Yes" : "No"}

        </p>

        <p>

          <strong>Demo Account:</strong>

          {user.is_demo ? "Yes" : "No"}

        </p>

        <p>

          <strong>Status:</strong>

          {user.suspended
            ? "Suspended"
            : "Active"}

        </p>

        <p>

          <strong>Created:</strong>

          {user.created_at
            ? new Date(
                user.created_at
              ).toLocaleString()
            : "-"}

        </p>

        <p>

          <strong>Last Seen:</strong>

          {user.last_seen
            ? new Date(
                user.last_seen
              ).toLocaleString()
            : "-"}

        </p>

        <hr />

        <h3>Biography</h3>

        <p>

          {user.bio || "No biography"}

        </p>

      </div>

    </div>
  );
}