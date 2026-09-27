"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Contract = {
  id: string;
  client_id?: string;
  freelancer_id?: string;
  project_title?: string;
  project_description?: string;
  budget?: number;
  status?: string;
  created_at?: string;

  project_id?: string | null;
  project_status?: string | null;
  payment_status?: string | null;
  paid_at?: string | null;

  has_delivery?: boolean;
};

type ProjectRow = {
  id: string;
  client_id: string;
  freelancer_id: string;
  status?: string | null;
  payment_status?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type DeliveryRow = {
  contract_id: string;
};

type JobInvitation = {
  id: string;
  job_id: string;
  client_id: string;
  freelancer_id: string;
  status: "pending" | "accepted" | "declined";
  created_at?: string;
  responded_at?: string | null;

  job?: {
    id: string;
    title?: string;
    description?: string;
    budget?: number;
    category?: string;
  };
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invitations, setInvitations] = useState<JobInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");

  const [respondingInvitationId, setRespondingInvitationId] =
    useState<string | null>(null);

  const [updatingContractId, setUpdatingContractId] =
    useState<string | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile loading error:", profileError);

      setAllowed(false);
      setLoading(false);
      return;
    }

    if (profile?.role !== "freelancer") {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    /*
     * =====================================================
     * LOAD CONTRACTS, INVITATIONS, PROJECTS AND DELIVERIES
     * =====================================================
     */

    const [
      contractsResult,
      invitationsResult,
      projectsResult,
      deliveriesResult,
    ] = await Promise.all([
      supabase
        .from("contracts")
        .select("*")
        .eq("freelancer_id", user.id)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("job_invitations")
        .select(
          "id, job_id, client_id, freelancer_id, status, created_at, responded_at"
        )
        .eq("freelancer_id", user.id)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("projects")
        .select(
          "id, client_id, freelancer_id, status, payment_status, paid_at, created_at"
        )
        .eq("freelancer_id", user.id)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("contract_deliveries")
        .select("contract_id")
        .eq("freelancer_id", user.id),
    ]);

    /*
     * =====================================================
     * CONTRACTS + PROJECT PAYMENT + DELIVERY STATE
     * =====================================================
     */

    if (contractsResult.error) {
      console.error(
        "Contracts loading error:",
        contractsResult.error
      );

      setContracts([]);
    } else {
      const contractRows =
        (contractsResult.data as Contract[]) || [];

      const projectRows = projectsResult.error
        ? []
        : ((projectsResult.data as ProjectRow[]) || []);

      if (projectsResult.error) {
        console.error(
          "Projects loading error:",
          projectsResult.error
        );
      }

      /*
       * Build a Set containing every contract that
       * currently has at least one uploaded delivery.
       */

      let deliveryContractIds = new Set<string>();

      if (deliveriesResult.error) {
        console.error(
          "Contract deliveries loading error:",
          deliveriesResult.error
        );
      } else {
        const deliveryRows =
          (deliveriesResult.data as DeliveryRow[]) || [];

        deliveryContractIds = new Set(
          deliveryRows.map(
            (delivery) => delivery.contract_id
          )
        );
      }

      /*
       * Direct-hire contracts currently do not store
       * project_id, so match the corresponding project
       * using client_id + freelancer_id.
       *
       * Projects are ordered newest first, therefore
       * find() returns the newest matching project.
       */

      const contractsWithProjects = contractRows.map(
        (contract) => {
          const matchingProject = projectRows.find(
            (project) =>
              project.client_id === contract.client_id &&
              project.freelancer_id === contract.freelancer_id
          );

          return {
            ...contract,

            project_id:
              matchingProject?.id ?? null,

            project_status:
              matchingProject?.status ?? null,

            payment_status:
              matchingProject?.payment_status ?? null,

            paid_at:
              matchingProject?.paid_at ?? null,

            has_delivery:
              deliveryContractIds.has(contract.id),
          };
        }
      );

      setContracts(contractsWithProjects);
    }

    /*
     * =====================================================
     * JOB INVITATIONS
     * =====================================================
     */

    if (invitationsResult.error) {
      console.error(
        "Job invitations loading error:",
        invitationsResult.error
      );

      setInvitations([]);
    } else {
      const invitationRows =
        (invitationsResult.data as JobInvitation[]) || [];

      const jobIds = Array.from(
        new Set(
          invitationRows
            .map((invitation) => invitation.job_id)
            .filter(Boolean)
        )
      );

      if (jobIds.length === 0) {
        setInvitations(invitationRows);
      } else {
        const { data: jobsData, error: jobsError } =
          await supabase
            .from("jobs")
            .select(
              "id, title, description, budget, category"
            )
            .in("id", jobIds);

        if (jobsError) {
          console.error(
            "Invitation jobs loading error:",
            jobsError
          );

          setInvitations(invitationRows);
        } else {
          const jobsMap = new Map(
            (
              (jobsData as {
                id: string;
                title?: string;
                description?: string;
                budget?: number;
                category?: string;
              }[]) || []
            ).map((job) => [job.id, job])
          );

          setInvitations(
            invitationRows.map((invitation) => ({
              ...invitation,
              job: jobsMap.get(invitation.job_id),
            }))
          );
        }
      }
    }

    setLoading(false);
  };

  /*
   * =======================================================
   * RESPOND TO JOB INVITATION
   * =======================================================
   */

  const respondToInvitation = async (
    invitationId: string,
    status: "accepted" | "declined"
  ) => {
    setMessage("");

    const invitation = invitations.find(
      (item) => item.id === invitationId
    );

    if (
      !invitation ||
      invitation.status !== "pending"
    ) {
      return;
    }

    setRespondingInvitationId(invitationId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(
          "You must be logged in to respond to an invitation."
        );

        return;
      }

      const { error: invitationError } =
        await supabase
          .from("job_invitations")
          .update({
            status,
          })
          .eq("id", invitationId)
          .eq("freelancer_id", user.id)
          .eq("status", "pending");

      if (invitationError) {
        console.error(
          "Job invitation update error:",
          invitationError
        );

        setMessage(
          `Unable to update invitation: ${invitationError.message}`
        );

        return;
      }

      const jobTitle =
        invitation.job?.title || "Job invitation";

      const { error: notificationError } =
        await supabase
          .from("notifications")
          .insert({
            user_id: invitation.client_id,

            title:
              status === "accepted"
                ? "Job Invitation Accepted"
                : "Job Invitation Declined",

            body:
              status === "accepted"
                ? `${jobTitle} was accepted by the invited freelancer.`
                : `${jobTitle} was declined by the invited freelancer.`,

            link: `/dashboard/jobs/${invitation.job_id}`,
            is_read: false,
          });

      if (notificationError) {
        console.error(
          "Invitation notification error:",
          notificationError
        );
      }

      await loadContracts();

      setMessage(
        status === "accepted"
          ? "Invitation accepted. The client has been notified."
          : "Invitation declined. The client has been notified."
      );
    } finally {
      setRespondingInvitationId(null);
    }
  };

  /*
   * =======================================================
   * UPDATE DIRECT-HIRE CONTRACT
   * =======================================================
   */

  const updateContract = async (
    contractId: string,
    status: string
  ) => {
    setMessage("");

    const currentContract = contracts.find(
      (contract) => contract.id === contractId
    );

    if (!currentContract) {
      return;
    }

    if (
      status === "accepted" &&
      currentContract.status !== "pending"
    ) {
      return;
    }

    if (
      status === "rejected" &&
      currentContract.status !== "pending"
    ) {
      return;
    }

    if (
      status === "completed" &&
      currentContract.status !== "accepted"
    ) {
      return;
    }

    setUpdatingContractId(contractId);

    try {
      /*
       * =====================================================
       * COMPLETION SECURITY CHECK
       *
       * IMPORTANT:
       * Never rely only on hiding the UI button.
       *
       * Before completion we independently verify:
       *
       * 1. project exists
       * 2. payment is confirmed
       * 3. project is active
       * 4. freelancer attached at least one work file
       * =====================================================
       */

      if (status === "completed") {
        if (!currentContract.project_id) {
          setMessage(
            "This contract cannot be completed because its project could not be found."
          );

          return;
        }

        if (
          currentContract.payment_status !== "paid" ||
          currentContract.project_status !== "active"
        ) {
          setMessage(
            "This project cannot be completed until the client has paid and the project is active."
          );

          return;
        }

        /*
         * Verify the work attachment directly from
         * contract_deliveries.
         */

        const {
          data: deliveryRows,
          error: deliveryError,
        } = await supabase
          .from("contract_deliveries")
          .select("id")
          .eq("contract_id", contractId)
          .eq(
            "freelancer_id",
            currentContract.freelancer_id
          )
          .limit(1);

        if (deliveryError) {
          console.error(
            "Delivery verification error:",
            deliveryError
          );

          setMessage(
            "Unable to verify your attached work file. Please try again."
          );

          return;
        }

        if (
          !deliveryRows ||
          deliveryRows.length === 0
        ) {
          setMessage(
            "Please attach at least one work file before marking this project as complete."
          );

          return;
        }
      }

      /*
       * =====================================================
       * STEP 1
       * UPDATE CONTRACT STATUS
       * =====================================================
       */

      const { error: contractError } = await supabase
        .from("contracts")
        .update({
          status,
        })
        .eq("id", contractId);

      if (contractError) {
        console.error(
          "Contract update error:",
          contractError
        );

        setMessage(
          `Unable to update contract: ${contractError.message}`
        );

        return;
      }

      /*
       * =====================================================
       * STEP 2
       * ACCEPT CONTRACT
       *
       * Contract:
       * pending -> accepted
       *
       * Project:
       * remains pending
       *
       * Payment:
       * remains unpaid
       *
       * PayFast confirmation activates the project.
       * =====================================================
       */

      if (status === "accepted") {
        const {
          data: pendingProjects,
          error: projectError,
        } = await supabase
          .from("projects")
          .select(
            "id, status, payment_status, paid_at, created_at"
          )
          .eq(
            "client_id",
            currentContract.client_id
          )
          .eq(
            "freelancer_id",
            currentContract.freelancer_id
          )
          .eq("status", "pending")
          .order("created_at", {
            ascending: false,
          })
          .limit(1);

        if (projectError) {
          console.error(
            "Pending project lookup error:",
            projectError
          );

          await supabase
            .from("contracts")
            .update({
              status: "pending",
            })
            .eq("id", contractId);

          setMessage(
            `Contract could not be accepted because the corresponding project could not be verified: ${projectError.message}`
          );

          await loadContracts();

          return;
        }

        const pendingProject =
          pendingProjects?.[0];

        if (!pendingProject) {
          await supabase
            .from("contracts")
            .update({
              status: "pending",
            })
            .eq("id", contractId);

          setMessage(
            "Contract could not be accepted because the corresponding pending project was not found."
          );

          await loadContracts();

          return;
        }

        /*
         * IMPORTANT:
         *
         * Do NOT activate the project here.
         *
         * Expected state:
         *
         * contract.status         = accepted
         * project.status          = pending
         * project.payment_status  = unpaid
         *
         * PayFast activates the project after
         * successful payment confirmation.
         */
      }

      /*
       * =====================================================
       * STEP 3
       * REJECT CONTRACT
       * =====================================================
       */

      if (status === "rejected") {
        const { error: projectError } = await supabase
          .from("projects")
          .update({
            status: "rejected",
          })
          .eq(
            "client_id",
            currentContract.client_id
          )
          .eq(
            "freelancer_id",
            currentContract.freelancer_id
          )
          .eq("status", "pending");

        if (projectError) {
          console.error(
            "Project rejection error:",
            projectError
          );
        }
      }

      /*
       * =====================================================
       * STEP 4
       * COMPLETE CONTRACT
       *
       * Allowed ONLY when:
       *
       * payment_status = paid
       * project.status = active
       * delivery exists
       * =====================================================
       */

      if (status === "completed") {
        const {
          data: completedProjects,
          error: projectError,
        } = await supabase
          .from("projects")
          .update({
            status: "completed",
          })
          .eq(
            "id",
            currentContract.project_id!
          )
          .eq("status", "active")
          .eq("payment_status", "paid")
          .select("id");

        if (
          projectError ||
          !completedProjects ||
          completedProjects.length === 0
        ) {
          console.error(
            "Project completion error:",
            projectError
          );

          /*
           * Roll contract back because the
           * corresponding paid project was not
           * successfully completed.
           */

          await supabase
            .from("contracts")
            .update({
              status: "accepted",
            })
            .eq("id", contractId);

          setMessage(
            projectError
              ? `Contract was not completed because the project could not be updated: ${projectError.message}`
              : "Contract was not completed because the project is not active and paid."
          );

          await loadContracts();

          return;
        }
      }

      /*
       * =====================================================
       * STEP 5
       * CONTRACT ACTIVITY
       * =====================================================
       */

      const { error: activityError } = await supabase
        .from("contract_activity")
        .insert({
          contract_id: contractId,
          action: `Contract marked as ${status}`,
        });

      if (activityError) {
        console.error(
          "Contract activity error:",
          activityError
        );
      }

      /*
       * =====================================================
       * STEP 6
       * NOTIFY CLIENT
       * =====================================================
       */

      if (currentContract.client_id) {
        let notificationBody = `${
          currentContract.project_title ||
          "Your contract"
        } was marked as ${status}.`;

        if (status === "accepted") {
          notificationBody = `${
            currentContract.project_title ||
            "Your hiring request"
          } was accepted. Payment is now required before work can begin.`;
        }

        if (status === "completed") {
          notificationBody = `${
            currentContract.project_title ||
            "Your project"
          } was marked as completed by the freelancer.`;
        }

        const { error: notificationError } =
          await supabase
            .from("notifications")
            .insert({
              user_id: currentContract.client_id,
              title: "Contract Update",
              body: notificationBody,
              link: `/dashboard/contracts/${contractId}`,
              is_read: false,
            });

        if (notificationError) {
          console.error(
            "Notification error:",
            notificationError
          );
        }
      }

      /*
       * =====================================================
       * STEP 7
       * REFRESH
       * =====================================================
       */

      await loadContracts();

      if (status === "accepted") {
        setMessage(
          "Contract accepted. Waiting for the client to fund the project before work begins."
        );
      } else if (status === "completed") {
        setMessage(
          "Contract completed successfully."
        );
      } else if (status === "rejected") {
        setMessage(
          "Hiring request rejected."
        );
      }
    } finally {
      setUpdatingContractId(null);
    }
  };

  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (loading) {
    return (
      <main>
        <LoadingSkeleton />
      </main>
    );
  }

  /*
   * =======================================================
   * ACCESS CONTROL
   * =======================================================
   */

  if (!allowed) {
    return (
      <main>
        <section className="dark-card">
          <h1>Access Restricted</h1>

          <p>
            This page is only available to freelancer
            accounts.
          </p>
        </section>
      </main>
    );
  }

  /*
   * =======================================================
   * CONTRACT FILTERS
   * =======================================================
   */

  const pendingInvitations = invitations.filter(
    (invitation) =>
      invitation.status === "pending"
  );

  const pendingContracts = contracts.filter(
    (contract) =>
      contract.status === "pending"
  );

  /*
   * Accepted but not yet funded.
   */

  const awaitingPaymentContracts = contracts.filter(
    (contract) =>
      contract.status === "accepted" &&
      !(
        contract.payment_status === "paid" &&
        contract.project_status === "active"
      )
  );

  /*
   * A contract is active for the freelancer
   * ONLY when the project is paid and active.
   */

  const activeContracts = contracts.filter(
    (contract) =>
      contract.status === "accepted" &&
      contract.payment_status === "paid" &&
      contract.project_status === "active"
  );

  const completedContracts = contracts.filter(
    (contract) =>
      contract.status === "completed"
  );

  const rejectedContracts = contracts.filter(
    (contract) =>
      contract.status === "rejected"
  );

  /*
   * =======================================================
   * PAGE
   * =======================================================
   */

  return (
    <main>
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Freelancer
        </p>

        <h1>Hiring Requests</h1>

        <p>
          Accept, manage and complete professional
          project contracts.
        </p>
      </section>

      {message && (
        <div
          className="dark-card"
          style={{
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <p className="upload-message">
            {message}
          </p>
        </div>
      )}

      {/* ==========================================
          JOB INVITATIONS
      ========================================== */}

      <section>
        <h2 style={{ marginBottom: 18 }}>
          Job Invitations
        </h2>

        {pendingInvitations.length === 0 ? (
          <EmptyState
            emoji="💌"
            title="No pending invitations"
            description="Direct job invitations from clients will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {pendingInvitations.map(
              (invitation) => (
                <div
                  key={invitation.id}
                  className="dark-card contract-card"
                >
                  <div className="contract-top">
                    <h2>
                      {invitation.job?.title ||
                        "Job Invitation"}
                    </h2>

                    <span className="contract-status pending">
                      invited
                    </span>
                  </div>

                  {invitation.job?.category && (
                    <p
                      style={{
                        marginTop: 8,
                        marginBottom: 8,
                        fontWeight: 600,
                      }}
                    >
                      {invitation.job.category}
                    </p>
                  )}

                  <p className="contract-budget">
                    Budget: ZAR{" "}
                    {invitation.job?.budget ?? 0}
                  </p>

                  <p className="contract-description">
                    {invitation.job?.description ||
                      "No description provided."}
                  </p>

                  <div className="contract-actions">
                    <a
                      href={`/dashboard/jobs/${invitation.job_id}`}
                      className="primary-action-link"
                    >
                      View Job
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        respondToInvitation(
                          invitation.id,
                          "accepted"
                        )
                      }
                      className="accept-btn"
                      disabled={
                        respondingInvitationId ===
                        invitation.id
                      }
                    >
                      {respondingInvitationId ===
                      invitation.id
                        ? "Working..."
                        : "Accept Invitation"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        respondToInvitation(
                          invitation.id,
                          "declined"
                        )
                      }
                      className="reject-btn"
                      disabled={
                        respondingInvitationId ===
                        invitation.id
                      }
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* ==========================================
          PENDING CONTRACT REQUESTS
      ========================================== */}

      <section>
        <h2 style={{ marginBottom: 18 }}>
          Pending Contract Requests
        </h2>

        {pendingContracts.length === 0 ? (
          <EmptyState
            emoji="📭"
            title="No pending contract requests"
            description="New contract requests will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {pendingContracts.map(
              (contract) => (
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

                  <p className="contract-budget">
                    Budget: ZAR{" "}
                    {contract.budget || 0}
                  </p>

                  <p className="contract-description">
                    {contract.project_description ||
                      "No description provided."}
                  </p>

                  <div className="contract-actions">
                    <a
                      href={`/dashboard/contracts/${contract.id}`}
                      className="primary-action-link"
                    >
                      View Details
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        updateContract(
                          contract.id,
                          "accepted"
                        )
                      }
                      className="accept-btn"
                      disabled={
                        updatingContractId ===
                        contract.id
                      }
                    >
                      {updatingContractId ===
                      contract.id
                        ? "Working..."
                        : "Accept"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateContract(
                          contract.id,
                          "rejected"
                        )
                      }
                      className="reject-btn"
                      disabled={
                        updatingContractId ===
                        contract.id
                      }
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* ==========================================
          AWAITING CLIENT PAYMENT
      ========================================== */}

      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 18 }}>
          Awaiting Client Payment
        </h2>

        {awaitingPaymentContracts.length === 0 ? (
          <EmptyState
            emoji="💳"
            title="No contracts awaiting payment"
            description="Accepted hiring requests waiting for client funding will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {awaitingPaymentContracts.map(
              (contract) => (
                <div
                  key={contract.id}
                  className="dark-card contract-card"
                >
                  <div className="contract-top">
                    <h2>
                      {contract.project_title ||
                        "Untitled Project"}
                    </h2>

                    <span className="contract-status pending">
                      Awaiting Payment
                    </span>
                  </div>

                  <p className="contract-budget">
                    Budget: ZAR{" "}
                    {contract.budget || 0}
                  </p>

                  <p className="contract-description">
                    {contract.project_description ||
                      "No description provided."}
                  </p>

                  <div
                    style={{
                      marginTop: 14,
                      marginBottom: 14,
                      padding: 12,
                      borderRadius: 10,
                      background:
                        "rgba(245, 158, 11, 0.10)",
                    }}
                  >
                    <strong>
                      Waiting for client payment
                    </strong>

                    <p
                      style={{
                        marginTop: 5,
                        marginBottom: 0,
                        fontSize: 13,
                        opacity: 0.8,
                      }}
                    >
                      Do not begin work yet. This
                      project will become active
                      after payment is confirmed.
                    </p>
                  </div>

                  <div className="contract-actions">
                    <a
                      href={`/dashboard/contracts/${contract.id}`}
                      className="primary-action-link"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* ==========================================
          ACTIVE / PAID CONTRACTS
      ========================================== */}

      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 18 }}>
          Active Contracts
        </h2>

        {activeContracts.length === 0 ? (
          <EmptyState
            emoji="📄"
            title="No active contracts"
            description="Paid and active contracts will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {activeContracts.map(
              (contract) => (
                <div
                  key={contract.id}
                  className="dark-card contract-card"
                >
                  <div className="contract-top">
                    <h2>
                      {contract.project_title ||
                        "Untitled Project"}
                    </h2>

                    <span className="contract-status accepted">
                      Active
                    </span>
                  </div>

                  <p className="contract-budget">
                    Budget: ZAR{" "}
                    {contract.budget || 0}
                  </p>

                  <p className="contract-description">
                    {contract.project_description ||
                      "No description provided."}
                  </p>

                  <div
                    style={{
                      marginTop: 12,
                      marginBottom: 12,
                      fontSize: 13,
                    }}
                  >
                    <strong>
                      Payment confirmed
                    </strong>
                  </div>

                  {!contract.has_delivery && (
                    <div
                      style={{
                        marginTop: 12,
                        marginBottom: 12,
                        padding: 12,
                        borderRadius: 10,
                        background:
                          "rgba(245, 158, 11, 0.10)",
                      }}
                    >
                      <strong>
                        Work file required
                      </strong>

                      <p
                        style={{
                          marginTop: 5,
                          marginBottom: 0,
                          fontSize: 13,
                          opacity: 0.8,
                        }}
                      >
                        Attach at least one completed
                        work file before marking this
                        project as complete.
                      </p>
                    </div>
                  )}

                  {contract.has_delivery && (
                    <div
                      style={{
                        marginTop: 12,
                        marginBottom: 12,
                        padding: 12,
                        borderRadius: 10,
                        background:
                          "rgba(34, 197, 94, 0.10)",
                      }}
                    >
                      <strong>
                        Work file attached
                      </strong>

                      <p
                        style={{
                          marginTop: 5,
                          marginBottom: 0,
                          fontSize: 13,
                          opacity: 0.8,
                        }}
                      >
                        You can now mark this project
                        as complete.
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

                    <a
                      href={`/dashboard/contracts/${contract.id}/deliveries`}
                      className="primary-action-link"
                    >
                      Attach Work File
                    </a>

                    {contract.has_delivery && (
                      <button
                        type="button"
                        onClick={() =>
                          updateContract(
                            contract.id,
                            "completed"
                          )
                        }
                        className="accept-btn"
                        disabled={
                          updatingContractId ===
                          contract.id
                        }
                      >
                        {updatingContractId ===
                        contract.id
                          ? "Working..."
                          : "Mark as Complete"}
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* ==========================================
          COMPLETED CONTRACTS
      ========================================== */}

      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 18 }}>
          Completed Contracts
        </h2>

        {completedContracts.length === 0 ? (
          <EmptyState
            emoji="✅"
            title="No completed contracts"
            description="Completed work will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {completedContracts.map(
              (contract) => (
                <div
                  key={contract.id}
                  className="dark-card contract-card"
                >
                  <div className="contract-top">
                    <h2>
                      {contract.project_title ||
                        "Untitled Project"}
                    </h2>

                    <span className="contract-status accepted">
                      Completed
                    </span>
                  </div>

                  <p className="contract-budget">
                    Budget: ZAR{" "}
                    {contract.budget || 0}
                  </p>

                  <p className="contract-description">
                    {contract.project_description ||
                      "No description provided."}
                  </p>

                  <div className="contract-actions">
                    <a
                      href={`/dashboard/contracts/${contract.id}`}
                      className="primary-action-link"
                    >
                      View Details
                    </a>

                    <a
                      href={`/dashboard/contracts/${contract.id}/deliveries`}
                      className="primary-action-link"
                    >
                      View Work Files
                    </a>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* ==========================================
          REJECTED CONTRACTS
      ========================================== */}

      {rejectedContracts.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ marginBottom: 18 }}>
            Rejected Requests
          </h2>

          <div className="contracts-grid">
            {rejectedContracts.map(
              (contract) => (
                <div
                  key={contract.id}
                  className="dark-card contract-card"
                >
                  <div className="contract-top">
                    <h2>
                      {contract.project_title ||
                        "Untitled Project"}
                    </h2>

                    <span className="contract-status rejected">
                      Rejected
                    </span>
                  </div>

                  <p className="contract-budget">
                    Budget: ZAR{" "}
                    {contract.budget || 0}
                  </p>

                  <p className="contract-description">
                    {contract.project_description ||
                      "No description provided."}
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
              )
            )}
          </div>
        </section>
      )}
    </main>
  );
}