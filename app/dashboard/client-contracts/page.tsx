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
  profiles?: {
    full_name?: string;
    role?: string;
    category?: string;
  };
};

export default function ClientContractsPage() {
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
      .select(`
        *,
        profiles (
          full_name,
          role,
          category
        )
      `)
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    setContracts((data as Contract[]) || []);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Client Contracts</p>

        <h1>Hiring requests sent</h1>

        <p>Track contracts you sent to freelancers.</p>
      </section>

      {contracts.length === 0 ? (
        <EmptyState
          emoji="📄"
          title="No contracts sent yet"
          description="Hire a freelancer from their profile to create a contract."
          buttonText="Find Freelancers"
          buttonLink="/search"
        />
      ) : (
        <div className="contracts-grid">
          {contracts.map((contract) => (
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

              <p className="contract-budget">
                Budget: ZAR {contract.budget || 0}
              </p>

              <p className="contract-description">
                {contract.project_description || "No description provided."}
              </p>

              <small>
                {new Date(contract.created_at || "").toLocaleDateString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
