"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Props = {
  contractId: string;
};

type PayoutResponse = {
  payoutStatus?: string | null;
  error?: string;
  message?: string;
};

export default function ClientWorkApproval({ contractId }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      setLoading(true);
      setError("");
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          throw new Error("Please log in again to check the approval status.");
        }

        const response = await fetch(
          `/api/contracts/approve-work?contractId=${encodeURIComponent(contractId)}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: "no-store",
          }
        );
        const result = (await response.json()) as PayoutResponse;
        if (!response.ok) throw new Error(result.error || "Unable to load approval status.");
        if (!cancelled) setStatus(result.payoutStatus ?? null);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Unable to load approval status.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStatus();
    return () => { cancelled = true; };
  }, [contractId]);

  async function approveWork() {
    if (approving || status !== "held") return;
    if (!window.confirm("Have you reviewed the submitted work files and confirmed that the work is satisfactory? Approving will release the payout for processing.")) return;

    setApproving(true);
    setError("");
    setMessage("");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Please log in again before approving the work.");
      }

      const response = await fetch("/api/contracts/approve-work", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ contractId }),
      });
      const result = (await response.json()) as PayoutResponse;
      if (!response.ok) throw new Error(result.error || "Work approval failed.");

      setStatus(result.payoutStatus ?? "ready_for_payout");
      setMessage(result.message || "Work approved successfully.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Work approval failed.");
    } finally {
      setApproving(false);
    }
  }

  if (loading) return <p role="status">Checking work approval status...</p>;

  return (
    <div className="dark-card" style={{ marginTop: 16, padding: 16 }}>
      {status === "held" ? (
        <>
          <strong>Work submitted — awaiting your approval</strong>
          <p>Review the work files before approving the freelancer's completed work.</p>
          <button
            type="button"
            className="primary-action-btn"
            onClick={() => void approveWork()}
            disabled={approving}
          >
            {approving ? "Approving..." : "Approve Work"}
          </button>
        </>
      ) : status === "ready_for_payout" ? (
        <p role="status"><strong>Work Approved</strong> — payment is ready for payout processing.</p>
      ) : status === "paid_out" ? (
        <p role="status"><strong>Payment Completed</strong> — the freelancer payout has been recorded as paid.</p>
      ) : status === "processing" || status === "processing_payout" ? (
        <p role="status"><strong>Work Approved</strong> — payout processing is underway.</p>
      ) : status ? (
        <p role="status">Payout status: {status.replace(/_/g, " ")}</p>
      ) : !error ? (
        <p>Direct-hire payout information is not yet available.</p>
      ) : null}
      {message && <p role="status" style={{ marginTop: 12 }}>{message}</p>}
      {error && <p role="alert" style={{ color: "#f59e0b", marginTop: 12 }}>{error}</p>}
    </div>
  );
}
