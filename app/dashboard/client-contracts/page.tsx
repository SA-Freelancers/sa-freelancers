"use client";

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Contract = {
  id: string;
  client_id?: string;
  freelancer_id?: string;
  job_id?: string | null;
  application_id?: string | null;
  project_title?: string;
  project_description?: string;
  budget?: number;
  status?: string;
  created_at?: string;

  profiles?: {
    id?: string;
    full_name?: string | null;
    role?: string | null;
    category?: string | null;
  } | null;
};

type Project = {
  id: string;
  job_id?: string | null;
  application_id?: string | null;
  client_id?: string;
  freelancer_id?: string;
  status?: string;
  payment_status?: string;
  paid_at?: string | null;
};

export default function ClientContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
  setLoading(true);

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

  /*
   * Load contracts directly.
   *
   * IMPORTANT:
   * We intentionally do NOT use:
   *
   * profiles (...)
   *
   * here because the profiles relationship can cause
   * Supabase relationship/RLS errors.
   */
  const {
    data: contractData,
    error: contractError,
  } = await supabase
    .from("contracts")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (contractError) {
    console.error(
      "Client contracts loading error:",
      contractError
    );

    setContracts([]);
    setLoading(false);
    return;
  }

  /*
   * Load projects belonging to this client.
   */
  const {
    data: projectData,
    error: projectError,
  } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (projectError) {
    console.error(
      "Client projects loading error:",
      projectError
    );
  }

  /*
   * Load freelancer profiles separately.
   */
  const freelancerIds = Array.from(
    new Set(
      ((contractData as Contract[]) || [])
        .map(
          (contract) =>
            contract.freelancer_id
        )
        .filter(Boolean)
    )
  );

  let freelancerProfiles: {
    id: string;
    full_name?: string | null;
    role?: string | null;
    category?: string | null;
  }[] = [];

  if (freelancerIds.length > 0) {
    const {
      data: freelancerData,
      error: freelancerError,
    } = await supabase
      .from("profiles")
      .select(
        "id, full_name, role, category"
      )
      .in("id", freelancerIds);

    if (freelancerError) {
      console.error(
        "Freelancer profiles loading error:",
        freelancerError
      );
    } else {
      freelancerProfiles =
        freelancerData || [];
    }
  }

  /*
   * Attach freelancer profile information
   * to each contract locally.
   */
  const contractsWithProfiles =
    ((contractData as Contract[]) || []).map(
      (contract) => {
        const freelancerProfile =
          freelancerProfiles.find(
            (profile) =>
              profile.id ===
              contract.freelancer_id
          );

        return {
          ...contract,
          profiles:
            freelancerProfile || null,
        };
      }
    );

  setContracts(contractsWithProfiles);

  setProjects(
    (projectData as Project[]) || []
  );

  setLoading(false);
};

  /*
   * Find the project associated with a contract.
   *
   * Direct-hire contracts may not have job_id or
   * application_id, so freelancer_id is also used.
   */
  const getProjectForContract = (
    contract: Contract
  ): Project | undefined => {
    return projects.find((project) => {
      /*
       * Best match: application ID.
       */
      if (
        contract.application_id &&
        project.application_id &&
        contract.application_id ===
          project.application_id
      ) {
        return true;
      }

      /*
       * Second match: job ID.
       */
      if (
        contract.job_id &&
        project.job_id &&
        contract.job_id === project.job_id
      ) {
        return true;
      }

      /*
       * Direct-hire fallback.
       *
       * Direct hires have no job/application,
       * so match the client + freelancer.
       */
      if (
        !contract.job_id &&
        !contract.application_id &&
        contract.freelancer_id &&
        project.freelancer_id ===
          contract.freelancer_id
      ) {
        return true;
      }

      return false;
    });
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <LoadingSkeleton />
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="dashboard-page">
        <section className="dark-card contracts-header">
          <p className="dashboard-badge">
            Client Area
          </p>

          <h1>Access Restricted</h1>

          <p>
            Only clients can access Sent
            Contracts.
          </p>
        </section>
      </main>
    );
  }

  const pendingContracts =
    contracts.filter(
      (contract) =>
        contract.status === "pending"
    );

  const acceptedContracts =
    contracts.filter(
      (contract) =>
        contract.status === "accepted"
    );

  const completedContracts =
    contracts.filter(
      (contract) =>
        contract.status === "completed"
    );

  const rejectedContracts =
    contracts.filter(
      (contract) =>
        contract.status === "rejected"
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
        {items.map((contract) => {
          const project =
            getProjectForContract(contract);

          return (
            <div
              key={contract.id}
              className="dark-card contract-card"
            >
              <div className="contract-top">
                <h2>
                  {contract.project_title ||
                    "Untitled Project"}
                </h2>

                <span
                  className={`contract-status ${
                    contract.status
                  }`}
                >
                  {contract.status ||
                    "pending"}
                </span>
              </div>

              <p>
                <strong>
                  Freelancer:
                </strong>{" "}
                {contract.profiles
                  ?.full_name ||
                  "Unknown"}
              </p>

              <p>
                <strong>Role:</strong>{" "}
                {contract.profiles
                  ?.role || "N/A"}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {contract.profiles
                  ?.category || "N/A"}
              </p>

              <p className="contract-budget">
                Budget: ZAR{" "}
                {contract.budget || 0}
              </p>

              <p className="contract-description">
                {contract.project_description ||
                  "No description provided."}
              </p>

              {contract.created_at && (
                <small>
                  Created:{" "}
                  {new Date(
                    contract.created_at
                  ).toLocaleDateString(
                    "en-ZA"
                  )}
                </small>
              )}

              {project && (
                <div
                  className="dark-card"
                  style={{
                    marginTop: 15,
                    padding: 15,
                  }}
                >
                  <p>
                    <strong>
                      Project Status:
                    </strong>{" "}
                    {project.status ||
                      "Unknown"}
                  </p>

                  <p>
                    <strong>
                      Payment Status:
                    </strong>{" "}
                    {project.payment_status ||
                      "Unknown"}
                  </p>

                  <p>
                    <strong>
                      Paid At:
                    </strong>{" "}
                    {project.paid_at
                      ? new Date(
                          project.paid_at
                        ).toLocaleDateString(
                          "en-ZA"
                        )
                      : "Not paid"}
                  </p>
                </div>
              )}

              <div className="contract-actions">
                <a
                  href={`/dashboard/contracts/${contract.id}`}
                  className="primary-action-link"
                >
                  View Details
                </a>

                {showReviewLink &&
                  contract.application_id && (
                    <a
                      href={`/dashboard/review/${contract.application_id}`}
                      className="primary-action-link"
                    >
                      Leave Review
                    </a>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="dashboard-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Client
        </p>

        <h1>Hiring Requests Sent</h1>

        <p>
          Track contracts you sent to
          freelancers.
        </p>
      </section>

      <section>
        <h2 style={{ marginBottom: 18 }}>
          Pending Contracts
        </h2>

        {renderContracts(
          pendingContracts,
          "📭",
          "No pending contracts",
          "Pending hiring requests will appear here."
        )}
      </section>

      <section
        style={{ marginTop: 40 }}
      >
        <h2 style={{ marginBottom: 18 }}>
          Accepted Contracts
        </h2>

        {renderContracts(
          acceptedContracts,
          "📄",
          "No accepted contracts",
          "Accepted freelancer contracts will appear here."
        )}
      </section>

      <section
        style={{ marginTop: 40 }}
      >
        <h2 style={{ marginBottom: 18 }}>
          Completed Contracts
        </h2>

        {renderContracts(
          completedContracts,
          "✅",
          "No completed contracts",
          "Completed work will appear here.",
          true
        )}
      </section>

      <section
        style={{ marginTop: 40 }}
      >
        <h2 style={{ marginBottom: 18 }}>
          Rejected Contracts
        </h2>

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