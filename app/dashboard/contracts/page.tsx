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

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError) {
      console.error(
        "Profile loading error:",
        profileError
      );

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

    const [
      contractsResult,
      invitationsResult,
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
    ]);

    if (contractsResult.error) {
      console.error(
        "Contracts loading error:",
        contractsResult.error
      );

      setContracts([]);
    } else {
      setContracts(
        (contractsResult.data as Contract[]) || []
      );
    }

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
        const {
          data: jobsData,
          error: jobsError,
        } = await supabase
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
            ).map((job) => [
              job.id,
              job,
            ])
          );

          setInvitations(
            invitationRows.map(
              (invitation) => ({
                ...invitation,
                job: jobsMap.get(
                  invitation.job_id
                ),
              })
            )
          );
        }
      }
    }

    setLoading(false);
  };

  const respondToInvitation = async (
    invitationId: string,
    status: "accepted" | "declined"
  ) => {
    setMessage("");

    const invitation =
      invitations.find(
        (item) =>
          item.id === invitationId
      );

    if (
      !invitation ||
      invitation.status !== "pending"
    ) {
      return;
    }

    setRespondingInvitationId(
      invitationId
    );

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setMessage(
          "You must be logged in to respond to an invitation."
        );
        return;
      }

      const {
        error: invitationError,
      } = await supabase
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
        invitation.job?.title ||
        "Job invitation";

      const {
        error: notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id:
            invitation.client_id,
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
      setRespondingInvitationId(
        null
      );
    }
  };

  const updateContract = async (
    contractId: string,
    status: string
  ) => {
    setMessage("");

    const currentContract =
      contracts.find(
        (contract) =>
          contract.id === contractId
      );

    if (!currentContract) {
      return;
    }

    /*
     * =====================================================
     * VALIDATE THE REQUEST
     * =====================================================
     */

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

    /*
     * =====================================================
     * STEP 1
     * UPDATE CONTRACT STATUS
     * =====================================================
     */

    const {
      error: contractError,
    } = await supabase
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
     * pending → accepted
     *
     * Corresponding project:
     * pending → active
     *
     * Payment remains:
     * unpaid
     * =====================================================
     */

    if (status === "accepted") {
      const {
        error: projectError,
      } = await supabase
        .from("projects")
        .update({
          status: "active",
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
          "Project activation error:",
          projectError
        );

        /*
         * Roll contract back if the
         * corresponding project could
         * not be activated.
         */
        await supabase
          .from("contracts")
          .update({
            status: "pending",
          })
          .eq("id", contractId);

        setMessage(
          `Contract accepted, but project could not be activated: ${projectError.message}`
        );

        await loadContracts();

        return;
      }
    }

    /*
     * =====================================================
     * STEP 3
     * REJECT CONTRACT
     *
     * No project activation is required.
     * =====================================================
     */

    if (status === "rejected") {
      /*
       * If a pending direct-hire project exists,
       * mark it as rejected.
       *
       * Payment remains unpaid.
       */
      const {
        error: projectError,
      } = await supabase
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
     * accepted → completed
     *
     * Corresponding project:
     * active → completed
     *
     * IMPORTANT:
     *
     * payment_status stays "unpaid"
     * paid_at stays NULL
     *
     * Completing work does NOT mean
     * the client has paid.
     * =====================================================
     */

    if (status === "completed") {
      const {
        error: projectError,
      } = await supabase
        .from("projects")
        .update({
          status: "completed",
        })
        .eq(
          "client_id",
          currentContract.client_id
        )
        .eq(
          "freelancer_id",
          currentContract.freelancer_id
        )
        .eq("status", "active");

      if (projectError) {
        console.error(
          "Project completion error:",
          projectError
        );

        /*
         * Roll the contract back to accepted
         * if the project could not be completed.
         */
        await supabase
          .from("contracts")
          .update({
            status: "accepted",
          })
          .eq("id", contractId);

        setMessage(
          `Contract was not completed because the project could not be updated: ${projectError.message}`
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

    const {
      error: activityError,
    } = await supabase
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
      const {
        error: notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id:
            currentContract.client_id,
          title: "Contract Update",
          body: `${
            currentContract.project_title ||
            "Your contract"
          } was marked as ${status}.`,
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
     * REFRESH CONTRACTS
     * =====================================================
     */

    await loadContracts();

    /*
     * Success message
     */
    if (status === "accepted") {
      setMessage(
        "Contract accepted and project activated."
      );
    } else if (
      status === "completed"
    ) {
      setMessage(
        "Contract completed and project marked as completed. Payment remains unpaid."
      );
    } else if (
      status === "rejected"
    ) {
      setMessage(
        "Hiring request rejected."
      );
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
          <h1>
            Access Restricted
          </h1>

          <p>
            This page is only available
            to freelancer accounts.
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

  const pendingInvitations =
    invitations.filter(
      (invitation) =>
        invitation.status === "pending"
    );

  const pendingContracts =
    contracts.filter(
      (contract) =>
        contract.status === "pending"
    );

  const activeContracts =
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

        <h1>
          Hiring Requests
        </h1>

        <p>
          Accept, manage and complete
          professional project contracts.
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

      {/* ===================================================
          JOB INVITATIONS
          =================================================== */}

      <section>
        <h2
          style={{
            marginBottom: 18,
          }}
        >
          Job Invitations
        </h2>

        {pendingInvitations.length ===
        0 ? (
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
                    {invitation.job?.budget ??
                      0}
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

      {/* ===================================================
          PENDING CONTRACT REQUESTS
          =================================================== */}


      <section>
        <h2
          style={{
            marginBottom: 18,
          }}
        >
          Pending Contract Requests
        </h2>

        {pendingContracts.length ===
        0 ? (
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
                      className={`contract-status ${contract.status}`}
                    >
                      {contract.status ||
                        "pending"}
                    </span>
                  </div>

                  <p className="contract-budget">
                    Budget: ZAR{" "}
                    {contract.budget ||
                      0}
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
                      onClick={() =>
                        updateContract(
                          contract.id,
                          "accepted"
                        )
                      }
                      className="accept-btn"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() =>
                        updateContract(
                          contract.id,
                          "rejected"
                        )
                      }
                      className="reject-btn"
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

      {/* ===================================================
          ACTIVE CONTRACTS
          =================================================== */}

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
          Active Contracts
        </h2>

        {activeContracts.length ===
        0 ? (
          <EmptyState
            emoji="📄"
            title="No active contracts"
            description="Accepted contracts will appear here."
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
                    {contract.budget ||
                      0}
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
                      onClick={() =>
                        updateContract(
                          contract.id,
                          "completed"
                        )
                      }
                      className="accept-btn"
                    >
                      Mark Completed
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* ===================================================
          COMPLETED CONTRACTS
          =================================================== */}

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

        {completedContracts.length ===
        0 ? (
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
                    {contract.budget ||
                      0}
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
        )}
      </section>

      {/* ===================================================
          REJECTED CONTRACTS
          =================================================== */}

      {rejectedContracts.length >
        0 && (
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
                    {contract.budget ||
                      0}
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