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

  const updateContract = async (
    contractId: string,
    status: string
  ) => {
    await supabase
      .from("contracts")
      .update({ status })
      .eq("id", contractId);

    loadContracts();
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Contracts</p>

        <h1>Hiring Requests</h1>

        <p>
          Accept or reject professional project contracts from clients.
        </p>
      </section>

      {contracts.length === 0 ? (
        <EmptyState
          emoji="📄"
          title="No contracts yet"
          description="Hiring requests from clients will appear here."
        />
      ) : (
        <div className="contracts-grid">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="dark-card contract-card"
            >
              <div className="contract-top">
                <h2>
                  {contract.project_title || "Untitled Project"}
                </h2>

                <span
                  className={`contract-status ${contract.status}`}
                >
                  {contract.status}
                </span>
              </div>

              <p className="contract-budget">
                Budget: ZAR {contract.budget || 0}
              </p>

              <p className="contract-description">
                {contract.project_description ||
                  "No description provided."}
              </p>

              <small>
                {new Date(
                  contract.created_at || ""
                ).toLocaleDateString()}
              </small>

              {contract.status === "pending" && (
                <div className="contract-actions">
                  <button
                    onClick={() =>
                      updateContract(contract.id, "accepted")
                    }
                    className="accept-btn"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() =>
                      updateContract(contract.id, "rejected")
                    }
                    className="reject-btn"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}