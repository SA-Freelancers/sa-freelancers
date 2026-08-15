"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import type { UserProfile } from "../../users/types";

type Props = {
  freelancer: UserProfile | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function FreelancerEditModal({
  freelancer,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<UserProfile | null>(null);

  useEffect(() => {
    setForm(freelancer);
  }, [freelancer]);

  if (!form) return null;

 async function saveChanges() {
  if (!form) return;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: form.full_name,
      category: form.category,
      location: form.location,
      bio: form.bio,
    })
    .eq("id", form.id);

  if (error) {
    alert(error.message);
    return;
  }

  onSaved();
  onClose();
}

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
          width: 700,
          maxWidth: "95%",
          padding: 30,
        }}
      >
        <h2>Edit Freelancer</h2>

        <input
          value={form.full_name ?? ""}
          placeholder="Full Name"
          onChange={(e) =>
            setForm({
              ...form,
              full_name: e.target.value,
            })
          }
        />

        <br />
        <br />

        <input
          value={form.category ?? ""}
          placeholder="Category"
          onChange={(e) =>
            setForm({
              ...form,
              category: e.target.value,
            })
          }
        />

        <br />
        <br />

        <input
          value={form.location ?? ""}
          placeholder="Location"
          onChange={(e) =>
            setForm({
              ...form,
              location: e.target.value,
            })
          }
        />

        <br />
        <br />

        <textarea
          value={form.bio ?? ""}
          placeholder="Biography"
          rows={5}
          onChange={(e) =>
            setForm({
              ...form,
              bio: e.target.value,
            })
          }
          style={{
            width: "100%",
          }}
        />

        <br />
        <br />

        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >
          <button
            className="accept-btn"
            onClick={saveChanges}
          >
            Save
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