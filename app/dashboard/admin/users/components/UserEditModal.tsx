"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "../types";

type Props = {
  user: UserProfile | null;
  onClose: () => void;
  onSave: (user: UserProfile) => void;
};

export default function UserEditModal({
  user,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<UserProfile | null>(user);

  useEffect(() => {
    setForm(user);
  }, [user]);

  if (!form) return null;

  function update<K extends keyof UserProfile>(
    field: K,
    value: UserProfile[K]
  ) {
    setForm((previous) =>
      previous
        ? {
            ...previous,
            [field]: value,
          }
        : previous
    );
  }

  return (
    <div className="modal-overlay">
      <div className="dark-card contract-card">

        <h2>Edit User</h2>

        <label>Full Name</label>

        <input
          value={form.full_name ?? ""}
          onChange={(e) =>
            update("full_name", e.target.value)
          }
        />

        <label>Email</label>

        <input
          value={form.email ?? ""}
          onChange={(e) =>
            update("email", e.target.value)
          }
        />

        <label>Category</label>

        <input
          value={form.category ?? ""}
          onChange={(e) =>
            update("category", e.target.value)
          }
        />

        <label>Location</label>

        <input
          value={form.location ?? ""}
          onChange={(e) =>
            update("location", e.target.value)
          }
        />

        <label>Country</label>

        <input
          value={form.country ?? ""}
          onChange={(e) =>
            update("country", e.target.value)
          }
        />

        <label>Biography</label>

        <textarea
          rows={5}
          value={form.bio ?? ""}
          onChange={(e) =>
            update("bio", e.target.value)
          }
        />

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 20,
          }}
        >
          <button
            className="accept-btn"
            onClick={() => onSave(form)}
          >
            Save Changes
          </button>

          <button
            className="reject-btn"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}