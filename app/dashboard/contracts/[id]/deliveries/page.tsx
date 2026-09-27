"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Contract = {
  id: string;
  client_id?: string | null;
  freelancer_id?: string | null;
  project_title?: string;
  project_description?: string;
  budget?: number;
  status?: string;
  created_at?: string;
};

type Activity = {
  id: string;
  action?: string;
  created_at?: string;
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

export default function ContractDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [payout, setPayout] = useState<Payout | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      /*
       * ==========================================
       * CURRENT USER
       * ==========================================
       */

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

      const userId = authData.user?.id || null;

      setCurrentUserId(userId);

      /*
       * ==========================================
       * CONTRACT
       * ==========================================
       */

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

      const loadedContract = contractData as Contract;

      setContract(loadedContract);

      /*
       * ==========================================
       * PROJECT
       * ==========================================
       */

      let loadedProject: Project | null = null;

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
        } else {
          loadedProject =
            (projectData as Project) || null;

          setProject(loadedProject);
        }
      }

      /*
       * ==========================================
       * PAYOUT
       * ==========================================
       */

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
        } else {
          setPayout(
            (payoutData as Payout) || null
          );
        }
      }

      /*
       * ==========================================
       * ATTACHED WORK FILES
       *
       * IMPORTANT:
       * The real table used by the delivery
       * page is contract_deliveries.
       * ==========================================
       */

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
          "Contract delivery loading error:",
          deliveryError
        );

        setDeliveries([]);
      } else {
        setDeliveries(
          (deliveryData as Delivery[]) || []
        );
      }

      /*
       * ==========================================
       * ACTIVITY
       * ==========================================
       */

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
          (activityData as Activity[]) || []
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

  /*
   * ==========================================
   * USER ROLE
   * ==========================================
   */

  const isFreelancer =
    !!contract?.freelancer_id &&
    currentUserId === contract.freelancer_id;

  const isClient =
    !!contract?.client_id &&
    currentUserId === contract.client_id;

  /*
   * ==========================================
   * DIRECT HIRE
   * ==========================================
   */

  const isDirectHire =
    payout?.payment_type === "direct_hire";

  /*
   * ==========================================
   * PAYMENT
   * ==========================================
   */

  const isFunded =
    project?.payment_status === "paid" &&
    !!project?.paid_at;

  /*
   * ==========================================
   * PROJECT STATUS
   * ==========================================
   */

  const isProjectActive =
    project?.status === "active";

  const isProjectCompleted =
    project?.status === "completed";

  const isContractCompleted =
    contract?.status === "completed";

  /*
   * ==========================================
   * FILE ATTACHMENT CHECK
   *
   * At least one REAL file URL must exist.
   * ==========================================
   */

  const attachedFiles =
    deliveries.filter(
      (delivery) =>
        typeof delivery.file_url === "string" &&
        delivery.file_url.trim().length > 0
    );

  const hasAttachedFiles =
    attachedFiles.length > 0;

  /*
   * ==========================================
   * MARK AS COMPLETE RULE
   *
   * The freelancer cannot complete the work
   * until a file has actually been attached.
   * ==========================================
   */

  const canMarkComplete =
    isFreelancer &&
    contract?.status === "accepted" &&
    isFunded &&
    isProjectActive &&
    hasAttachedFiles;

  /*
   * Reviews should only appear after the
   * work/project has been completed.
   * ==========================================
   */

  const canLeaveReview =
    isProjectCompleted ||
    isContractCompleted;

  if (loading) {
    return <LoadingSkeleton />;
  }

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

  return (
    <main className="contract-details-page">
      <section className="dark-card contract-details-card">

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
              contract.status || "pending"
            }`}
          >
            {contract.status || "pending"}
          </span>
        </div>

        {/* =====================================
            CONTRACT INFORMATION
        ====================================== */}

        <div className="contract-info-grid">

          <div className="dark-card contract-info-item">
            <h3>Budget</h3>

            <p>
              ZAR{" "}
              {Number(
                contract.budget || 0
              ).toLocaleString("en-ZA")}
            </p>
          </div>

          <div className="dark-card contract-info-item">
            <h3>
              Contract Status
            </h3>

            <p>
              {contract.status || "pending"}
            </p>
          </div>

          <div className="dark-card contract-info-item">
            <h3>
              Project Status
            </h3>

            <p>
              {project?.status || "pending"}
            </p>
          </div>

          <div className="dark-card contract-info-item">
            <h3>Payment</h3>

            <p>
              {isFunded
                ? "Funded"
                : "Not funded"}
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

        {/* =====================================
            FUNDED MESSAGE
        ====================================== */}

        {isDirectHire && isFunded && (
          <div
            style={{
              marginTop: 22,
              padding: 18,
              borderRadius: 14,
              background:
                "rgba(34, 197, 94, 0.10)",
              border:
                "1px solid rgba(34, 197, 94, 0.25)",
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: 6,
              }}
            >
              Payment confirmed
            </strong>

            <span
              style={{
                opacity: 0.75,
                fontSize: 14,
              }}
            >
              The client has funded this
              project. You may now complete
              the agreed work.
            </span>
          </div>
        )}

        {/* =====================================
            ACTION BUTTONS
        ====================================== */}

        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >

          {/*
           * STANDARD / MILESTONE CONTRACT
           */}

          {!isDirectHire && (
            <a
              href={`/dashboard/contracts/${contract.id}/milestones`}
              className="primary-action-link"
            >
              Open Milestones
            </a>
          )}

          {/*
           * FREELANCER WORK ATTACHMENTS
           */}

          {isFreelancer &&
            isFunded &&
            !isProjectCompleted && (
              <a
                href={`/dashboard/contracts/${contract.id}/deliveries`}
                className="primary-action-link"
              >
                Attach Work Files
              </a>
            )}

          {/*
           * CLIENT VIEWS THE FREELANCER'S
           * SUBMITTED FILES.
           */}

          {isClient &&
            hasAttachedFiles && (
              <a
                href={`/dashboard/contracts/${contract.id}/deliveries`}
                className="primary-action-link"
              >
                View Submitted Files
              </a>
            )}

          {/*
           * MARK AS COMPLETE
           *
           * IMPORTANT:
           * This button does NOT appear until
           * a real work file has been attached.
           */}

          {canMarkComplete && (
            <a
              href="/dashboard/contracts"
              className="primary-action-link"
              style={{
                background: "#16a34a",
              }}
            >
              Mark as Complete
            </a>
          )}

          {canLeaveReview && (
            <a
              href={`/dashboard/contracts/${contract.id}/review`}
              className="primary-action-link"
            >
              Leave Review
            </a>
          )}

        </div>

        {/* =====================================
            FILE ATTACHMENT STATUS
        ====================================== */}

        {isFreelancer &&
          isDirectHire &&
          isFunded &&
          isProjectActive &&
          !hasAttachedFiles && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 12,
                background:
                  "rgba(245, 158, 11, 0.10)",
                border:
                  "1px solid rgba(245, 158, 11, 0.25)",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: 5,
                }}
              >
                Attach work before completion
              </strong>

              <span
                style={{
                  opacity: 0.75,
                  fontSize: 14,
                }}
              >
                Attach at least one completed
                work file before you can mark
                this project as complete.
              </span>
            </div>
          )}

        {isFreelancer &&
          hasAttachedFiles &&
          isProjectActive && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 12,
                background:
                  "rgba(34, 197, 94, 0.10)",
                border:
                  "1px solid rgba(34, 197, 94, 0.25)",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: 5,
                }}
              >
                Work files attached
              </strong>

              <span
                style={{
                  opacity: 0.75,
                  fontSize: 14,
                }}
              >
                {attachedFiles.length}{" "}
                {attachedFiles.length === 1
                  ? "file has"
                  : "files have"}{" "}
                been attached. You may now
                mark the work as complete.
              </span>
            </div>
          )}

        {/* =====================================
            PROJECT DESCRIPTION
        ====================================== */}

        <div className="contract-description-box">
          <h2>
            Project Description
          </h2>

          <p>
            {contract.project_description ||
              "No description provided."}
          </p>
        </div>

        {/* =====================================
            ACTIVITY TIMELINE
        ====================================== */}

        <div className="contract-timeline">
          <h2>
            Activity Timeline
          </h2>

          {activities.length === 0 ? (
            <p>No activity yet.</p>
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