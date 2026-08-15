"use client";

import type { UserProfile } from "../../users/types";

type Props = {
  freelancer: UserProfile | null;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteFreelancerModal({
  freelancer,
  onClose,
  onDeleted,
}: Props) {
  if (!freelancer) return null;

  const current = freelancer;

  async function deleteFreelancer() {
    const confirmed = confirm(
      `Delete ${current.full_name}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: current.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error ?? "Unable to delete freelancer.");
        return;
      }

      alert("Freelancer deleted successfully.");

      onDeleted();

      onClose();
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="dark-card"
        style={{
          width: 500,
          maxWidth: "95%",
          padding: 30,
          borderRadius: 12,
        }}
      >
        <h2>Delete Freelancer</h2>

        <p style={{ marginTop: 20 }}>
          Are you sure you want to permanently delete:
        </p>

        <h3>{current.full_name}</h3>

        <p
          style={{
            color: "#ff8080",
            marginTop: 10,
          }}
        >
          This will permanently remove the freelancer's profile and login account.
          This action cannot be undone.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 30,
          }}
        >
          <button
            className="reject-btn"
            onClick={deleteFreelancer}
          >
            Delete
          </button>

          <button
            className="accept-btn"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}