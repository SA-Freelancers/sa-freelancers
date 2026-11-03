"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

/* =========================================================
   TYPES
========================================================= */

type Contract = {
  id: string;
  client_id?: string | null;
  freelancer_id?: string | null;
  project_title?: string | null;
  project_description?: string | null;
  budget?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type Activity = {
  id: string;
  action?: string | null;
  created_at?: string | null;
};

type Project = {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  paid_at?: string | null;
};

type Payout = {
  id: string;
  payment_type?: string | null;
  status?: string | null;
};

type Delivery = {
  id: string;
  file_url?: string | null;
  note?: string | null;
  created_at?: string | null;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ContractDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  /* =======================================================
     STATE
  ======================================================= */

  const [contract, setContract] =
    useState<Contract | null>(null);

  const [project, setProject] =
    useState<Project | null>(null);

  const [payout, setPayout] =
    useState<Payout | null>(null);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [deliveries, setDeliveries] =
    useState<Delivery[]>([]);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [completing, setCompleting] =
    useState(false);

  const [completionMessage, setCompletionMessage] =
    useState("");

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (!id) return;

    loadContract();
  }, [id]);

  /* =======================================================
     LOAD CONTRACT
  ======================================================= */

  const loadContract = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      /* ---------------------------------------------------
         CURRENT USER
      --------------------------------------------------- */

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(
          "Contract auth error:",
          authError
        );
      }

      const userId =
        authData.user?.id || null;

      setCurrentUserId(userId);

      /* ---------------------------------------------------
         CONTRACT
      --------------------------------------------------- */

      const {
        data: contractData,
        error: contractError,
      } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (contractError) {
        console.error(
          "Contract loading error:",
          contractError
        );

        setErrorMessage(
          "Unable to load this contract."
        );

        setContract(null);
        return;
      }

      if (!contractData) {
        setContract(null);
        return;
      }

      const loadedContract =
        contractData as Contract;

      setContract(loadedContract);

      /* ---------------------------------------------------
         PROJECT
      --------------------------------------------------- */

      let loadedProject: Project | null =
        null;

      if (
        loadedContract.client_id &&
        loadedContract.freelancer_id
      ) {
        const {
          data: projectData,
          error: projectError,
        } = await supabase
          .from("projects")
          .select(`
            id,
            status,
            payment_status,
            paid_at
          `)
          .eq(
            "client_id",
            loadedContract.client_id
          )
          .eq(
            "freelancer_id",
            loadedContract.freelancer_id
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (projectError) {
          console.error(
            "Project loading error:",
            projectError
          );

          setProject(null);
        } else {
          loadedProject =
            (projectData as Project) ||
            null;

          setProject(loadedProject);
        }
      } else {
        setProject(null);
      }

      /* ---------------------------------------------------
         PAYOUT
      --------------------------------------------------- */

      if (loadedProject?.id) {
        const {
          data: payoutData,
          error: payoutError,
        } = await supabase
          .from("freelancer_payouts")
          .select(`
            id,
            payment_type,
            status
          `)
          .eq(
            "project_id",
            loadedProject.id
          )
          .eq(
            "contract_id",
            loadedContract.id
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (payoutError) {
          console.error(
            "Payout loading error:",
            payoutError
          );

          setPayout(null);
        } else {
          setPayout(
            (payoutData as Payout) ||
              null
          );
        }
      } else {
        setPayout(null);
      }

      /* ---------------------------------------------------
         WORK FILES
      --------------------------------------------------- */

      const {
        data: deliveryData,
        error: deliveryError,
      } = await supabase
        .from("contract_deliveries")
        .select(`
          id,
          file_url,
          note,
          created_at
        `)
        .eq("contract_id", id)
        .order("created_at", {
          ascending: false,
        });

      if (deliveryError) {
        console.error(
          "Delivery loading error:",
          deliveryError
        );

        setDeliveries([]);
      } else {
        setDeliveries(
          (deliveryData as Delivery[]) ||
            []
        );
      }

      /* ---------------------------------------------------
         CONTRACT ACTIVITY
      --------------------------------------------------- */

      const {
        data: activityData,
        error: activityError,
      } = await supabase
        .from("contract_activity")
        .select("*")
        .eq("contract_id", id)
        .order("created_at", {
          ascending: false,
        });

      if (activityError) {
        console.error(
          "Contract activity loading error:",
          activityError
        );

        setActivities([]);
      } else {
        setActivities(
          (activityData as Activity[]) ||
            []
        );
      }
    } catch (error) {
      console.error(
        "Contract details error:",
        error
      );

      setErrorMessage(
        "Something went wrong while loading this contract."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     PAGE STATE
  ======================================================= */

  const isFreelancer =
    !!contract?.freelancer_id &&
    currentUserId ===
      contract.freelancer_id;

  const isClient =
    !!contract?.client_id &&
    currentUserId ===
      contract.client_id;

  const isDirectHire =
    payout?.payment_type ===
    "direct_hire";

  const isFunded =
    project?.payment_status ===
      "paid" &&
    !!project?.paid_at;

  const isProjectActive =
    project?.status === "active";

  const isProjectCompleted =
    project?.status === "completed";

  const isContractCompleted =
    contract?.status === "completed";

  /* =======================================================
     FILE ATTACHMENT CHECK
  ======================================================= */

  const attachedFiles =
    deliveries.filter(
      (delivery) =>
        typeof delivery.file_url ===
          "string" &&
        delivery.file_url.trim().length >
          0
    );

  const hasAttachedFiles =
    attachedFiles.length > 0;

  /* =======================================================
     MARK AS COMPLETE RULE
  ======================================================= */

  const canMarkComplete =
    isFreelancer &&
    contract?.status ===
      "accepted" &&
    isFunded &&
    isProjectActive &&
    hasAttachedFiles;

  /* =======================================================
     REVIEW RULE
  ======================================================= */

  const canLeaveReview =
    isProjectCompleted ||
    isContractCompleted;

  /* =======================================================
     MARK WORK AS COMPLETE
  ======================================================= */

  const markAsComplete = async () => {
    if (!contract) {
      setCompletionMessage(
        "Contract could not be found."
      );
      return;
    }

    if (!project) {
      setCompletionMessage(
        "Project could not be found."
      );
      return;
    }

    if (
      !currentUserId ||
      currentUserId !==
        contract.freelancer_id
    ) {
      setCompletionMessage(
        "Only the assigned freelancer can mark this work as complete."
      );
      return;
    }

    if (!hasAttachedFiles) {
      setCompletionMessage(
        "Please attach at least one work file before completing the project."
      );
      return;
    }

    if (!isFunded) {
      setCompletionMessage(
        "The project cannot be completed because payment has not been confirmed."
      );
      return;
    }

    if (
      contract.status !== "accepted" ||
      project.status !== "active"
    ) {
      setCompletionMessage(
        "This contract is not currently available for completion."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Mark this work as complete? Make sure all required work files have been attached."
      );

    if (!confirmed) {
      return;
    }

    try {
      setCompleting(true);
      setCompletionMessage("");

      /* ---------------------------------------------------
         STEP 1
         PROJECT: active -> completed

         IMPORTANT:
         payment_status remains paid.
         paid_at remains unchanged.
      --------------------------------------------------- */

      const {
        data: updatedProject,
        error: projectError,
      } = await supabase
        .from("projects")
        .update({
          status: "completed",
        })
        .eq("id", project.id)
        .eq(
          "freelancer_id",
          currentUserId
        )
        .eq("status", "active")
        .select("id")
        .maybeSingle();

      if (projectError) {
        console.error(
          "Project completion error:",
          projectError
        );

        setCompletionMessage(
          `Unable to complete project: ${projectError.message}`
        );

        return;
      }

      if (!updatedProject) {
        setCompletionMessage(
          "The project was not updated. Please refresh the page and try again."
        );

        return;
      }

      /* ---------------------------------------------------
         STEP 2
         CONTRACT: accepted -> completed
      --------------------------------------------------- */

      const {
        data: updatedContract,
        error: contractError,
      } = await supabase
        .from("contracts")
        .update({
          status: "completed",
        })
        .eq("id", contract.id)
        .eq(
          "freelancer_id",
          currentUserId
        )
        .eq("status", "accepted")
        .select("id")
        .maybeSingle();

      if (
        contractError ||
        !updatedContract
      ) {
        console.error(
          "Contract completion error:",
          contractError
        );

        /*
         * Roll the project back to active
         * if the contract could not be
         * completed.
         */
        const {
          error: rollbackError,
        } = await supabase
          .from("projects")
          .update({
            status: "active",
          })
          .eq("id", project.id)
          .eq("status", "completed");

        if (rollbackError) {
          console.error(
            "Project rollback error:",
            rollbackError
          );
        }

        setCompletionMessage(
          contractError
            ? `Unable to complete contract: ${contractError.message}`
            : "The contract was not updated."
        );

        return;
      }

      /* ---------------------------------------------------
         STEP 3
         CONTRACT ACTIVITY
      --------------------------------------------------- */

      const {
        error: activityError,
      } = await supabase
        .from("contract_activity")
        .insert({
          contract_id: contract.id,
          action:
            "Freelancer marked the work as completed",
        });

      if (activityError) {
        console.error(
          "Completion activity error:",
          activityError
        );
      }

      /*
       * DO NOT CHANGE PAYOUT HERE.
       *
       * freelancer_payouts.status
       * remains "held".
       *
       * Completing the work does not mean
       * the freelancer has been paid out.
       */

      setCompletionMessage(
        "Work marked as complete successfully."
      );

      await loadContract();
    } catch (error) {
      console.error(
        "Completion error:",
        error
      );

      setCompletionMessage(
        "Something went wrong while completing the project."
      );
    } finally {
      setCompleting(false);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return <LoadingSkeleton />;
  }

  /* =======================================================
     CONTRACT NOT FOUND
  ======================================================= */

  if (!contract) {
    return (
      <main className="contract-details-page">
        <EmptyState
          emoji="📄"
          title="Contract not found"
          description={
            errorMessage ||
            "This contract could not be loaded."
          }
        />
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="contract-details-page">
      <section className="dark-card contract-details-card">

        {/* =================================================
            HEADER
        ================================================= */}

        <p className="dashboard-badge">
          Contract Details
        </p>

        <div className="contract-top">
          <h1>
            {contract.project_title ||
              "Untitled Project"}
          </h1>

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

        {/* =================================================
            CONTRACT INFORMATION
        ================================================= */}

        <div className="contract-info-grid">

          <div className="dark-card contract-info-item">
            <h3>Budget</h3>

            <p>
              ZAR{" "}
              {Number(
                contract.budget || 0
              ).toLocaleString(
                "en-ZA"
              )}
            </p>
          </div>

          <div className="dark-card contract-info-item">
            <h3>
              Contract Status
            </h3>

            <p>
              {contract.status ||
                "pending"}
            </p>
          </div>

          <div className="dark-card contract-info-item">
            <h3>
              Project Status
            </h3>

            <p>
              {project?.status ||
                "N/A"}
            </p>
          </div>

          <div className="dark-card contract-info-item">
            <h3>Payment</h3>

            <p>
              {isFunded
                ? "Funded"
                : "Not Funded"}
            </p>
          </div>

          <div className="dark-card contract-info-item">
            <h3>Created</h3>

            <p>
              {contract.created_at
                ? new Date(
                    contract.created_at
                  ).toLocaleDateString(
                    "en-ZA"
                  )
                : "N/A"}
            </p>
          </div>

        </div>

        {/* =================================================
            ACTION BUTTONS
        ================================================= */}

        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >

          {/* MILESTONES */}

          <Link
            href={`/dashboard/contracts/${contract.id}/milestones`}
            className="primary-action-link"
          >
            Open Milestones
          </Link>

          {/* ===============================================
              FREELANCER ATTACHES WORK FILES
          =============================================== */}

          {isFreelancer &&
            isDirectHire &&
            !isContractCompleted && (
              <Link
                href={`/dashboard/contracts/${contract.id}/deliveries`}
                className="primary-action-link"
              >
                Attach Work Files
              </Link>
            )}

          {/* ===============================================
              CLIENT VIEWS SUBMITTED FILES
          =============================================== */}

          {isClient &&
            hasAttachedFiles && (
              <Link
                href={`/dashboard/contracts/${contract.id}/deliveries`}
                className="primary-action-link"
              >
                View Submitted Files
              </Link>
            )}

          {/* ===============================================
              MARK AS COMPLETE
          =============================================== */}

          {canMarkComplete && (
            <button
              type="button"
              onClick={
                markAsComplete
              }
              disabled={completing}
              className="primary-action-link"
              style={{
                background:
                  "#16a34a",
                border: "none",
                cursor: completing
                  ? "not-allowed"
                  : "pointer",
                opacity: completing
                  ? 0.7
                  : 1,
              }}
            >
              {completing
                ? "Completing..."
                : "Mark as Complete"}
            </button>
          )}

          {/* ===============================================
              REVIEW
          =============================================== */}

          {canLeaveReview && (
            <Link
              href={`/dashboard/contracts/${contract.id}/review`}
              className="primary-action-link"
            >
              Leave Review
            </Link>
          )}

        </div>

        {/* =================================================
            COMPLETION MESSAGE
        ================================================= */}

        {completionMessage && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 10,
              background:
                "rgba(59, 130, 246, 0.12)",
              border:
                "1px solid rgba(59, 130, 246, 0.25)",
            }}
          >
            {completionMessage}
          </div>
        )}

        {/* =================================================
            FILE ATTACHMENT STATUS
        ================================================= */}

        {isFreelancer &&
          isDirectHire &&
          !isContractCompleted && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 12,
                background:
                  hasAttachedFiles
                    ? "rgba(34, 197, 94, 0.12)"
                    : "rgba(245, 158, 11, 0.12)",
                border:
                  hasAttachedFiles
                    ? "1px solid rgba(34, 197, 94, 0.30)"
                    : "1px solid rgba(245, 158, 11, 0.30)",
              }}
            >
              <strong>
                {hasAttachedFiles
                  ? "Work files attached"
                  : "Work file required"}
              </strong>

              <p
                style={{
                  marginTop: 6,
                  marginBottom: 0,
                }}
              >
                {hasAttachedFiles
                  ? `${attachedFiles.length} file${
                      attachedFiles.length === 1
                        ? ""
                        : "s"
                    } ${
                      attachedFiles.length === 1
                        ? "has"
                        : "have"
                    } been attached. You may now mark the work as complete.`
                  : "Attach at least one completed work file before marking this project as complete."}
              </p>
            </div>
          )}

        {/* =================================================
            COMPLETED STATUS
        ================================================= */}

        {isContractCompleted && (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 12,
              background:
                "rgba(34, 197, 94, 0.12)",
              border:
                "1px solid rgba(34, 197, 94, 0.30)",
            }}
          >
            <strong>
              Work Completed
            </strong>

            <p
              style={{
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              This contract has been
              marked as completed.
            </p>
          </div>
        )}

        {/* =================================================
            PAYOUT STATUS
        ================================================= */}

        {isFreelancer &&
          payout && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 12,
                background:
                  "rgba(59, 130, 246, 0.08)",
                border:
                  "1px solid rgba(59, 130, 246, 0.20)",
              }}
            >
              <strong>
                Payment Status
              </strong>

              <p
                style={{
                  marginTop: 6,
                  marginBottom: 0,
                }}
              >
                Freelancer payout:{" "}
                {payout.status ||
                  "held"}
              </p>
            </div>
          )}

        {/* =================================================
            PROJECT DESCRIPTION
        ================================================= */}

        <div className="contract-description-box">
          <h2>
            Project Description
          </h2>

          <p>
            {contract.project_description ||
              "No description provided."}
          </p>
        </div>

        {/* =================================================
            ACTIVITY TIMELINE
        ================================================= */}

        <div className="contract-timeline">
          <h2>
            Activity Timeline
          </h2>

          {activities.length === 0 ? (
            <p>
              No activity yet.
            </p>
          ) : (
            <div className="timeline-list">
              {activities.map(
                (activity) => (
                  <div
                    key={activity.id}
                    className="timeline-item"
                  >
                    <div className="timeline-dot" />

                    <div>
                      <strong>
                        {activity.action ||
                          "Contract activity"}
                      </strong>

                      <p>
                        {activity.created_at
                          ? new Date(
                              activity.created_at
                            ).toLocaleString(
                              "en-ZA"
                            )
                          : ""}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

      </section>
    </main>
  );
}