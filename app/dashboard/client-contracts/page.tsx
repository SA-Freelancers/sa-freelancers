
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";
import ClientWorkApproval from "@/app/components/ClientWorkApproval";

type FreelancerProfile = {
  id: string;
  full_name?: string | null;
  role?: string | null;
  category?: string | null;
};

type Contract = {
  id: string;
  client_id?: string | null;
  freelancer_id?: string | null;
  project_id?: string | null;
  application_id?: string | null;
  project_title?: string | null;
  project_description?: string | null;
  budget?: number | null;
  status?: string | null;
  created_at?: string | null;
  profiles?: FreelancerProfile | null;
};

type Project = {
  id: string;
  job_id?: string | null;
  application_id?: string | null;
  client_id?: string | null;
  freelancer_id?: string | null;
  status?: string | null;
  payment_status?: string | null;
  paid_at?: string | null;
};

export default function ClientContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadContracts();
  }, []);

  // Load contracts belonging to the authenticated client
  const loadContracts = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setAllowed(false);
        setErrorMessage(
          "Please log in to view your contracts."
        );
        return;
      }

      // Verify client role and account status
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, role, suspended")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setAllowed(false);
        setErrorMessage(
          "We could not verify your client account."
        );
        return;
      }

      if (profile.suspended === true) {
        setAllowed(false);
        setErrorMessage(
          "Your account is currently suspended."
        );
        return;
      }

      if (profile.role !== "client") {
        setAllowed(false);
        setErrorMessage(
          "Only clients can access Sent Contracts."
        );
        return;
      }

      setAllowed(true);

      // Load the client's contracts
      const {
        data: contractData,
        error: contractError,
      } = await supabase
        .from("contracts")
        .select(`
          id,
          client_id,
          freelancer_id,
          project_id,
          application_id,
          project_title,
          project_description,
          budget,
          status,
          created_at
        `)
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
        setErrorMessage(
          `Unable to load contracts: ${contractError.message}`
        );
        return;
      }

      const loadedContracts =
        (contractData as Contract[]) || [];

      // Load projects belonging to the client
      const {
        data: projectData,
        error: projectError,
      } = await supabase
        .from("projects")
        .select(`
          id,
          job_id,
          application_id,
          client_id,
          freelancer_id,
          status,
          payment_status,
          paid_at
        `)
        .eq("client_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (projectError) {
        console.error(
          "Client projects loading error:",
          projectError
        );
        setProjects([]);
      } else {
        setProjects(
          (projectData as Project[]) || []
        );
      }

      // Collect freelancer IDs
      const freelancerIds = Array.from(
        new Set(
          loadedContracts
            .map((contract) => contract.freelancer_id)
            .filter(
              (id): id is string =>
                typeof id === "string" &&
                id.length > 0
            )
        )
      );

      let freelancerProfiles: FreelancerProfile[] = [];

      if (freelancerIds.length > 0) {
        const {
          data: freelancerData,
          error: freelancerError,
        } = await supabase
          .from("profiles")
          .select("id, full_name, role, category")
          .in("id", freelancerIds);

        if (freelancerError) {
          console.error(
            "Freelancer profiles loading error:",
            freelancerError
          );
        } else {
          freelancerProfiles =
            (freelancerData as FreelancerProfile[]) || [];
        }
      }

      // Attach freelancer profiles to contracts
      const contractsWithProfiles =
        loadedContracts.map((contract) => {
          const freelancerProfile =
            freelancerProfiles.find(
              (freelancer) =>
                freelancer.id === contract.freelancer_id
            );

          return {
            ...contract,
            profiles: freelancerProfile || null,
          };
        });

      setContracts(contractsWithProfiles);
    } catch (error) {
      console.error(
        "Client contracts page error:",
        error
      );

      setErrorMessage(
        "Something went wrong while loading your contracts."
      );
    } finally {
      setLoading(false);
    }
  };

  // Match each contract to its actual project
  const getProjectForContract = (
    contract: Contract
  ): Project | undefined => {
    if (!contract.project_id) {
      return undefined;
    }

    return projects.find(
      (project) => project.id === contract.project_id
    );
  };

  // Funding is available only for accepted,
  // pending and unpaid projects
  const shouldShowFundButton = (
    contract: Contract,
    project?: Project
  ) => {
    if (!project) {
      return false;
    }

    return (
      contract.status === "accepted" &&
      project.status === "pending" &&
      project.payment_status === "unpaid" &&
      !project.paid_at
    );
  };

  const formatAmount = (amount: number | null | undefined) =>
    Number(amount || 0).toLocaleString("en-ZA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

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
            {errorMessage ||
              "Only clients can access Sent Contracts."}
          </p>
        </section>
      </main>
    );
  }

  // Group contracts by status
  const pendingContracts = contracts.filter(
    (contract) => contract.status === "pending"
  );

  const acceptedContracts = contracts.filter(
    (contract) => contract.status === "accepted"
  );

  const completedContracts = contracts.filter(
    (contract) => contract.status === "completed"
  );

  const rejectedContracts = contracts.filter(
    (contract) => contract.status === "rejected"
  );

  // Render contract cards
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
          const project = getProjectForContract(contract);

          const showFundButton =
            shouldShowFundButton(contract, project);

          const isPaid =
            project?.payment_status === "paid" ||
            !!project?.paid_at;

          // Approval is shown only when both
          // contract and funded project are completed
          const showApproval =
            contract.status === "completed" &&
            project?.status === "completed" &&
            project?.payment_status === "paid" &&
            !!project?.paid_at &&
            !!contract.id;

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
                    contract.status || "pending"
                  }`}
                >
                  {contract.status || "pending"}
                </span>
              </div>

              <p>
                <strong>Freelancer:</strong>{" "}
                {contract.profiles?.full_name ||
                  "Unknown"}
              </p>

              <p>
                <strong>Role:</strong>{" "}
                {contract.profiles?.role || "N/A"}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {contract.profiles?.category || "N/A"}
              </p>

              <p className="contract-budget">
                Budget: ZAR{" "}
                {formatAmount(contract.budget)}
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
                  ).toLocaleDateString("en-ZA")}
                </small>
              )}

              {/* Project information */}
              {project ? (
                <div
                  className="dark-card"
                  style={{
                    marginTop: 15,
                    padding: 15,
                  }}
                >
                  <p>
                    <strong>Project Status:</strong>{" "}
                    {project.status || "Unknown"}
                  </p>

                  <p>
                    <strong>Payment Status:</strong>{" "}
                    {project.payment_status || "Unknown"}
                  </p>

                  <p>
                    <strong>Paid At:</strong>{" "}
                    {project.paid_at
                      ? new Date(
                          project.paid_at
                        ).toLocaleString("en-ZA")
                      : "Not paid"}
                  </p>

                  {/* Payment required notice */}
                  {showFundButton && (
                    <div
                      style={{
                        marginTop: 15,
                        padding: 15,
                        borderRadius: 12,
                        background:
                          "rgba(245, 158, 11, 0.12)",
                      }}
                    >
                      <strong>
                        Payment Required
                      </strong>

                      <p
                        style={{
                          marginTop: 6,
                          marginBottom: 0,
                          opacity: 0.8,
                        }}
                      >
                        The freelancer has accepted
                        this contract. Fund the
                        project before work begins.
                      </p>
                    </div>
                  )}

                  {/* Funded project notice */}
                  {isPaid &&
                    project.status === "active" && (
                      <div
                        style={{
                          marginTop: 15,
                          padding: 15,
                          borderRadius: 12,
                          background:
                            "rgba(34, 197, 94, 0.12)",
                        }}
                      >
                        <strong>
                          Project Funded
                        </strong>

                        <p
                          style={{
                            marginTop: 6,
                            marginBottom: 0,
                            opacity: 0.8,
                          }}
                        >
                          Payment has been confirmed
                          and the project is active.
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                <div
                  className="dark-card"
                  style={{
                    marginTop: 15,
                    padding: 15,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      opacity: 0.7,
                    }}
                  >
                    Project information is
                    unavailable for this contract.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="contract-actions">
                <Link
                  href={`/dashboard/contracts/${contract.id}`}
                  className="primary-action-link"
                >
                  View Details
                </Link>

                {/* Work files */}
                {contract.status === "completed" && (
                  <Link
                    href={`/dashboard/contracts/${contract.id}/deliveries`}
                    className="primary-action-link"
                  >
                    View Work Files
                  </Link>
                )}

                {/* Fund project */}
                {showFundButton && project && (
                  <Link
                    href={`/dashboard/payment/${project.id}`}
                    className="primary-action-link"
                    style={{
                      background: "#16a34a",
                    }}
                  >
                    Fund Project — ZAR{" "}
                    {formatAmount(contract.budget)}
                  </Link>
                )}

                {/* Review freelancer */}
                {showReviewLink &&
                  contract.application_id && (
                    <Link
                      href={`/dashboard/review/${contract.application_id}`}
                      className="primary-action-link"
                    >
                      Leave Review
                    </Link>
                  )}
              </div>

              {/* Work approval panel */}
              {/* Important: outside contract-actions */}
              {showApproval && (
                <div
                  style={{
                    width: "100%",
                    minWidth: 0,
                    marginTop: 16,
                    boxSizing: "border-box",
                  }}
                >
                  <ClientWorkApproval
                    contractId={contract.id}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="dashboard-page">
      {/* Page heading */}
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Client
        </p>

        <h1>Hiring Requests Sent</h1>

        <p>
          Track your contracts, payments and
          active projects.
        </p>

        {errorMessage && (
          <p
            style={{
              marginTop: 15,
              color: "#f59e0b",
            }}
          >
            {errorMessage}
          </p>
        )}
      </section>

      {/* Pending contracts */}
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

      {/* Accepted contracts */}
      <section style={{ marginTop: 40 }}>
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

      {/* Completed contracts */}
      <section style={{ marginTop: 40 }}>
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

      {/* Rejected contracts */}
      <section style={{ marginTop: 40 }}>
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
