"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

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

  /*
   * Permanent link between the contract
   * and its corresponding project.
   */
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
  const [contracts, setContracts] =
    useState<Contract[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [allowed, setAllowed] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  /*
   * =========================================================
   * LOAD PAGE
   * =========================================================
   */

  useEffect(() => {
    void loadContracts();
  }, []);

  /*
   * =========================================================
   * LOAD CLIENT CONTRACTS
   * =========================================================
   */

  const loadContracts = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      /*
       * =====================================================
       * STEP 1
       * AUTHENTICATED USER
       * =====================================================
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Client contracts authentication error:",
          userError
        );

        setAllowed(false);

        setErrorMessage(
          "We could not verify your account."
        );

        return;
      }

      if (!user) {
        setAllowed(false);

        setErrorMessage(
          "Please log in to view your contracts."
        );

        return;
      }

      /*
       * =====================================================
       * STEP 2
       * VERIFY CLIENT ROLE
       * =====================================================
       */

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          role,
          suspended
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Client profile loading error:",
          profileError
        );

        setAllowed(false);

        setErrorMessage(
          "We could not verify your client account."
        );

        return;
      }

      if (!profile) {
        setAllowed(false);

        setErrorMessage(
          "Your profile could not be found."
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

      /*
       * =====================================================
       * STEP 3
       * LOAD CONTRACTS
       * =====================================================
       *
       * We load contracts directly rather than using
       * a nested profiles relationship.
       * =====================================================
       */

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

      /*
       * =====================================================
       * STEP 4
       * LOAD PROJECTS
       * =====================================================
       *
       * We still load the client's projects once.
       *
       * The important difference is that a contract now
       * identifies its project using project_id.
       * =====================================================
       */

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

      /*
       * =====================================================
       * STEP 5
       * LOAD FREELANCER PROFILES
       * =====================================================
       */

      const freelancerIds = Array.from(
        new Set(
          loadedContracts
            .map(
              (contract) =>
                contract.freelancer_id
            )
            .filter(
              (id): id is string =>
                typeof id === "string" &&
                id.length > 0
            )
        )
      );

      let freelancerProfiles:
        FreelancerProfile[] = [];

      if (freelancerIds.length > 0) {
        const {
          data: freelancerData,
          error: freelancerError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            role,
            category
          `)
          .in("id", freelancerIds);

        if (freelancerError) {
          console.error(
            "Freelancer profiles loading error:",
            freelancerError
          );
        } else {
          freelancerProfiles =
            (freelancerData as FreelancerProfile[]) ||
            [];
        }
      }

      /*
       * =====================================================
       * STEP 6
       * ATTACH FREELANCER PROFILE LOCALLY
       * =====================================================
       */

      const contractsWithProfiles =
        loadedContracts.map(
          (contract) => {
            const freelancerProfile =
              freelancerProfiles.find(
                (freelancer) =>
                  freelancer.id ===
                  contract.freelancer_id
              );

            return {
              ...contract,

              profiles:
                freelancerProfile || null,
            };
          }
        );

      setContracts(
        contractsWithProfiles
      );
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

  /*
   * =========================================================
   * FIND PROJECT FOR CONTRACT
   * =========================================================
   *
   * PRIMARY METHOD:
   *
   * contract.project_id === project.id
   *
   * We no longer use freelancer_id as a direct-hire
   * fallback because the same client may hire the same
   * freelancer more than once.
   * =========================================================
   */

  const getProjectForContract = (
    contract: Contract
  ): Project | undefined => {
    if (!contract.project_id) {
      return undefined;
    }

    return projects.find(
      (project) =>
        project.id === contract.project_id
    );
  };

  /*
   * =========================================================
   * PAYMENT STATE
   * =========================================================
   */

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

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <main className="dashboard-page">
        <LoadingSkeleton />
      </main>
    );
  }

  /*
   * =========================================================
   * ACCESS RESTRICTED
   * =========================================================
   */

  if (!allowed) {
    return (
      <main className="dashboard-page">
        <section className="dark-card contracts-header">
          <p className="dashboard-badge">
            Client Area
          </p>

          <h1>
            Access Restricted
          </h1>

          <p>
            {errorMessage ||
              "Only clients can access Sent Contracts."}
          </p>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * CONTRACT GROUPS
   * =========================================================
   */

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

  /*
   * =========================================================
   * CONTRACT CARD RENDERER
   * =========================================================
   */

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
            getProjectForContract(
              contract
            );

          const showFundButton =
            shouldShowFundButton(
              contract,
              project
            );

          const isPaid =
            project?.payment_status ===
              "paid" ||
            !!project?.paid_at;

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
                    contract.status ||
                    "pending"
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
                <strong>
                  Role:
                </strong>{" "}
                {contract.profiles
                  ?.role || "N/A"}
              </p>

              <p>
                <strong>
                  Category:
                </strong>{" "}
                {contract.profiles
                  ?.category || "N/A"}
              </p>

              <p className="contract-budget">
                Budget: ZAR{" "}
                {Number(
                  contract.budget || 0
                ).toLocaleString(
                  "en-ZA",
                  {
                    minimumFractionDigits:
                      0,
                    maximumFractionDigits:
                      2,
                  }
                )}
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

              {project ? (
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
                        ).toLocaleString(
                          "en-ZA"
                        )
                      : "Not paid"}
                  </p>

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
                        The freelancer has
                        accepted this contract.
                        Fund the project before
                        work begins.
                      </p>
                    </div>
                  )}

                  {isPaid &&
                    project.status ===
                      "active" && (
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
                          Payment has been
                          confirmed and the
                          project is active.
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
                    unavailable for this
                    contract.
                  </p>
                </div>
              )}

              <div className="contract-actions">
                <Link
                  href={`/dashboard/contracts/${contract.id}`}
                  className="primary-action-link"
                >
                  View Details
                </Link>

                {showFundButton &&
                  project && (
                    <Link
                      href={`/dashboard/payment/${project.id}`}
                      className="primary-action-link"
                      style={{
                        background:
                          "#16a34a",
                      }}
                    >
                      Fund Project — ZAR{" "}
                      {Number(
                        contract.budget || 0
                      ).toLocaleString(
                        "en-ZA",
                        {
                          minimumFractionDigits:
                            0,
                          maximumFractionDigits:
                            2,
                        }
                      )}
                    </Link>
                  )}

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
            </div>
          );
        })}
      </div>
    );
  };

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <main className="dashboard-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Client
        </p>

        <h1>
          Hiring Requests Sent
        </h1>

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

      <section>
        <h2
          style={{
            marginBottom: 18,
          }}
        >
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
        style={{
          marginTop: 40,
        }}
      >
        <h2
          style={{
            marginBottom: 18,
          }}
        >
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
        style={{
          marginTop: 40,
        }}
      >
        <h2
          style={{
            marginBottom: 18,
          }}
        >
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
        style={{
          marginTop: 40,
        }}
      >
        <h2
          style={{
            marginBottom: 18,
          }}
        >
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