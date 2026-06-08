"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Contract = {
  id: string;
  application_id?: string;
  project_title?: string;
  project_description?: string;
  budget?: number;
  status?: string;
  created_at?: string;
  profiles?: {
    full_name?: string;
    role?: string;
    category?: string;
  };
};

export default function ClientContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "client") {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    const { data } = await supabase
      .from("contracts")
      .select(
        `
        *,
        profiles (
          full_name,
          role,
          category
        )
      `
      )
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    setContracts((data as Contract[]) || []);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Client Area</p>
          <h1>Access Restricted</h1>
          <p>Only clients can access Sent Contracts.</p>
        </section>
      </main>
    );
  }

  const pendingContracts = contracts.filter(
    (contract) => contract.status === "pending"
  );

  const acceptedContracts = contracts.filter(
    (contract) => contract.status === "accepted"
  );

  const rejectedContracts = contracts.filter(
    (contract) => contract.status === "rejected"
  );

  const completedContracts = contracts.filter(
    (contract) => contract.status === "completed"
  );

  const renderContracts = (
    items: Contract[],
    emptyEmoji: string,
    emptyTitle: string,
    emptyDescription: string,
    showReviewLink = false
  ) => {
    if (items.length === 0) {
      return (
        <EmptyState
          emoji={emptyEmoji}
          title={emptyTitle}
          description={emptyDescription}
        />
      );
    }

    return (
      <div className="contracts-grid">
        {items.map((contract) => (
          <div key={contract.id} className="dark-card contract-card">
            <div className="contract-top">
              <h2>{contract.project_title || "Untitled Project"}</h2>

              <span className={`contract-status ${contract.status}`}>
                {contract.status || "pending"}
              </span>
            </div>

            <p>
              <strong>Freelancer:</strong>{" "}
              {contract.profiles?.full_name || "Unknown"}
            </p>

            <p>
              <strong>Role:</strong> {contract.profiles?.role || "N/A"}
            </p>

            <p className="contract-budget">
              Budget: ZAR {contract.budget || 0}
            </p>

            <p className="contract-description">
              {contract.project_description || "No description provided."}
            </p>

            <small>
              {contract.created_at
                ? new Date(contract.created_at).toLocaleDateString()
                : ""}
            </small>

            <div className="contract-actions">
              <a
                href={`/dashboard/contracts/${contract.id}`}
                className="primary-action-link"
              >
                View Details
              </a>

              {showReviewLink && contract.application_id && (
                <a
                  href={`/dashboard/review/${contract.application_id}`}
                  className="primary-action-link"
                >
                  Leave Review
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Client Contracts</p>

        <h1>Hiring requests sent</h1>

        <p>Track contracts you sent to freelancers.</p>
      </section>

      <section>
        <h2 style={{ marginBottom: 18 }}>Pending Contracts</h2>
        {renderContracts(
          pendingContracts,
          "📭",
          "No pending contracts",
          "Pending hiring requests will appear here."
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 18 }}>Accepted Contracts</h2>
        {renderContracts(
          acceptedContracts,
          "📄",
          "No accepted contracts",
          "Accepted freelancer contracts will appear here."
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 18 }}>Completed Contracts</h2>
        {renderContracts(
          completedContracts,
          "✅",
          "No completed contracts",
          "Completed work will appear here.",
          true
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 18 }}>Rejected Contracts</h2>
        {renderContracts(
          rejectedContracts,
          "❌",
          "No rejected contracts",
          "Rejected hiring requests will appear here."
        )}
      </section>
    </main>
  );
}