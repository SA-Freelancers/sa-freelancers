"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function ReportUserPage() {
  const params = useParams();
  const router = useRouter();
  const reportedUserId = params.id as string;

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submitReport = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setLoading(false);
      return;
    }

    if (!reason.trim()) {
      setMessage("Please select a reason.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("reports").insert({
      reported_user_id: reportedUserId,
      reporter_user_id: user.id,
      reason,
      details,
      status: "pending",
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Report submitted successfully.");

    setTimeout(() => {
      router.push(`/freelancers/${reportedUserId}`);
    }, 1200);

    setLoading(false);
  };

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Safety Report</p>

        <h1>Report User</h1>

        <p>
          Help keep the marketplace safe by reporting suspicious or unsafe
          behaviour.
        </p>
      </section>

      <section className="dark-card contract-card">
        <label className="form-label">Reason</label>

        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="form-input"
        >
          <option value="">Select reason</option>
          <option value="Spam">Spam</option>
          <option value="Fake profile">Fake profile</option>
          <option value="Outside contact request">Outside contact request</option>
          <option value="Harassment">Harassment</option>
          <option value="Scam">Scam</option>
        </select>

        <label className="form-label">Details</label>

        <textarea
          placeholder="Provide more details..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="form-input proposal-textarea"
        />

        <button onClick={submitReport} disabled={loading} className="reject-btn">
          {loading ? "Submitting..." : "Submit Report"}
        </button>

        {message && <p className="upload-message">{message}</p>}
      </section>
    </main>
  );
}