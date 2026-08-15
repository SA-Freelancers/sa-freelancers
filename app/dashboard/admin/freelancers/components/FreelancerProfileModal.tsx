"use client";

import type { UserProfile } from "../../users/types";

type Props = {
  freelancer: UserProfile | null;
  onClose: () => void;
};

export default function FreelancerProfileModal({
  freelancer,
  onClose,
}: Props) {
  if (!freelancer) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="dark-card"
        style={{
          width: 850,
          maxWidth: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 30,
          borderRadius: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 25,
          }}
        >
          <h2>{freelancer.full_name}</h2>

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
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 20,
          }}
        >
          <Info
            label="Email"
            value={freelancer.email}
          />

          <Info
            label="Role"
            value={freelancer.role}
          />

          <Info
            label="Category"
            value={freelancer.category}
          />

          <Info
            label="Location"
            value={freelancer.location}
          />

          <Info
            label="Verified"
            value={
              freelancer.verified
                ? "Yes"
                : "No"
            }
          />

          <Info
            label="Top Rated"
            value={
              freelancer.top_rated
                ? "Yes"
                : "No"
            }
          />

          <Info
            label="Demo"
            value={
              freelancer.is_demo
                ? "Yes"
                : "No"
            }
          />

          <Info
            label="Status"
            value={
              freelancer.suspended
                ? "Suspended"
                : "Active"
            }
          />
        </div>

        <div
          style={{
            marginTop: 30,
          }}
        >
          <h3>Biography</h3>

          <p>
            {freelancer.bio ??
              "No biography available."}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 30,
            flexWrap: "wrap",
          }}
        >
          <button className="accept-btn">
            Verify
          </button>

          <button className="verified-btn">
            Edit
          </button>

          <button className="reject-btn">
            Suspend
          </button>

          <button className="reject-btn">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <strong>{label}</strong>

      <p>{value || "-"}</p>
    </div>
  );
}