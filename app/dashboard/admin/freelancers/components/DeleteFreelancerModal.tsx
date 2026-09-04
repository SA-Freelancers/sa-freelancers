"use client";

import { createClient } from "@supabase/supabase-js";
import type { UserProfile } from "../../users/types";

type Props = {
  freelancer: UserProfile | null;
  onClose: () => void;
  onDeleted: () => void;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !session?.access_token
      ) {
        alert(
          "Your session has expired. Please log in again."
        );
        return;
      }

      const response = await fetch(
        "/api/admin/delete-user",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            id: current.id,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ??
            "Unable to delete freelancer."
        );
        return;
      }

      alert(
        "Freelancer deleted successfully."
      );

      onDeleted();
      onClose();
    } catch (error) {
      console.error(error);

      alert(
        "An unexpected error occurred."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Delete Freelancer
        </h2>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete{" "}
          <strong>
            {current.full_name}
          </strong>
          ?
        </p>

        <p className="mt-2 text-sm text-red-600">
          This action permanently removes
          the freelancer account and cannot
          be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={deleteFreelancer}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete Freelancer
          </button>
        </div>
      </div>
    </div>
  );
}