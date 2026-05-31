"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Contract = {
  id: string;
  project_title?: string;
  project_description?: string;
  budget?: number;
  status?: string;
  created_at?: string;
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

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

    const { data } = await supabase
      .from("contracts")
      .select("*")
      .eq("freelancer_id", user.id)
      .order("created_at", { ascending: false });

    setContracts((data as Contract[]) || []);
    setLoading(false);
  };

  const updateContract = async (contractId: string, status: string) => {
    await supabase
      .from("contracts")
      .update({ status })
      .eq("id", contractId);

    await supabase.from("contract_activity").insert({
      contract_id: contractId,
      action: `Contract marked as ${status}`,
    });

    loadContracts();
  };

  if (loading) return <LoadingSkeleton />;

  const pendingContracts = contracts.filter(
    (contract) => contract.status === "pending"
  );

  const activeContracts = contracts.filter(
    (contract) => contract.status === "accepted"
  );

  const completedContracts = contracts.filter(
    (contract) => contract.status === "completed"
  );

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Contracts</p>

        <h1>Hiring Requests</h1>

        <p>Accept, manage and complete professional project contracts.</p>
      </section>

      <section>
        <h2 style={{ marginBottom: 18 }}>Pending Requests</h2>

        {pendingContracts.length === 0 ? (
          <EmptyState
            emoji="📭"
            title="No pending requests"
            description="New hiring requests will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {pendingContracts.map((contract) => (
              <div key={contract.id} className="dark-card contract-card">
                <div className="contract-top">
                  <h2>{contract.project_title || "Untitled Project"}</h2>

                  <span className={`contract-status ${contract.status}`}>
                    {contract.status || "pending"}
                  </span>
                </div>

                <p className="contract-budget">
                  Budget: ZAR {contract.budget || 0}
                </p>

                <p className="contract-description">
                  {contract.project_description || "No description provided."}
                </p>

                <div className="contract-actions">
                  <a
                    href={`/dashboard/contracts/${contract.id}`}
                    className="primary-action-link"
                  >
                    View Details
                  </a>

                  <button
                    onClick={() => updateContract(contract.id, "accepted")}
                    className="accept-btn"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => updateContract(contract.id, "rejected")}
                    className="reject-btn"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 18 }}>Active Contracts</h2>

        {activeContracts.length === 0 ? (
          <EmptyState
            emoji="📄"
            title="No active contracts"
            description="Accepted contracts will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {activeContracts.map((contract) => (
              <div key={contract.id} className="dark-card contract-card">
                <div className="contract-top">
                  <h2>{contract.project_title || "Untitled Project"}</h2>

                  <span className="contract-status accepted">Active</span>
                </div>

                <p className="contract-budget">
                  Budget: ZAR {contract.budget || 0}
                </p>

                <p className="contract-description">
                  {contract.project_description || "No description provided."}
                </p>

                <div className="contract-actions">
                  <a
                    href={`/dashboard/contracts/${contract.id}`}
                    className="primary-action-link"
                  >
                    View Details
                  </a>

                  <button
                    onClick={() => updateContract(contract.id, "completed")}
                    className="accept-btn"
                  >
                    Mark Completed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 18 }}>Completed Contracts</h2>

        {completedContracts.length === 0 ? (
          <EmptyState
            emoji="✅"
            title="No completed contracts"
            description="Completed work will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {completedContracts.map((contract) => (
              <div key={contract.id} className="dark-card contract-card">
                <div className="contract-top">
                  <h2>{contract.project_title || "Untitled Project"}</h2>

                  <span className="contract-status accepted">Completed</span>
                </div>

                <p className="contract-budget">
                  Budget: ZAR {contract.budget || 0}
                </p>

                <p className="contract-description">
                  {contract.project_description || "No description provided."}
                </p>

                <div className="contract-actions">
                  <a
                    href={`/dashboard/contracts/${contract.id}`}
                    className="primary-action-link"
                  >
                    View Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}