"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Milestone = {
  id: string;
  project_id?: string | null;
  contract_id: string;
  title?: string;
  description?: string;
  amount?: number;
  status?: string;
  created_at?: string;
};

type Contract = {
  id: string;
  client_id?: string;
  freelancer_id?: string;
  status?: string;
};

type Project = {
  id: string;
  client_id?: string;
  freelancer_id?: string;
  status?: string;
  payment_status?: string;
  created_at?: string;
};

type Payout = {
  id: string;
  milestone_id: string;
  gross_amount?: number;
  platform_fee?: number;
  freelancer_amount?: number;
  platform_fee_percent?: number;
  status?: string;
  payment_received_at?: string | null;
  approved_for_payout_at?: string | null;
  paid_out_at?: string | null;
};

export default function MilestonesPage() {
  const params = useParams();
  const router = useRouter();

  const contractId =
    params.id as string;

  const [milestones, setMilestones] =
    useState<Milestone[]>([]);

  const [contract, setContract] =
    useState<Contract | null>(null);

  const [project, setProject] =
    useState<Project | null>(null);

  const [payouts, setPayouts] =
    useState<Record<string, Payout>>({});

  const [role, setRole] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    updatingMilestoneId,
    setUpdatingMilestoneId,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadMilestones();
  }, [contractId]);

  /*
   * --------------------------------------------------
   * LOAD PAGE
   * --------------------------------------------------
   */

  const loadMilestones =
    async () => {
      setLoading(true);
      setMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          setMessage(
            "Please login first."
          );

          return;
        }

        /*
         * ----------------------------------------------
         * USER ROLE
         * ----------------------------------------------
         */

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Profile loading error:",
            profileError
          );
        }

        const userRole =
          profile?.role || "";

        setRole(userRole);

        /*
         * ----------------------------------------------
         * CONTRACT
         * ----------------------------------------------
         */

        const {
          data: contractData,
          error: contractError,
        } = await supabase
          .from("contracts")
          .select(
            `
            id,
            client_id,
            freelancer_id,
            status
            `
          )
          .eq("id", contractId)
          .maybeSingle();

        if (
          contractError ||
          !contractData
        ) {
          console.error(
            "Contract loading error:",
            contractError
          );

          setMessage(
            "Unable to load this contract."
          );

          return;
        }

        const currentContract =
          contractData as Contract;

        setContract(
          currentContract
        );

        /*
         * ----------------------------------------------
         * SECURITY
         *
         * User must belong to this contract.
         * ----------------------------------------------
         */

        if (
          currentContract.client_id !==
            user.id &&
          currentContract.freelancer_id !==
            user.id
        ) {
          setMessage(
            "You are not authorised to view this contract."
          );

          return;
        }

        /*
         * ----------------------------------------------
         * FIND CONNECTED PROJECT
         * ----------------------------------------------
         */

        let connectedProject:
          Project | null = null;

        if (
          currentContract.client_id &&
          currentContract.freelancer_id
        ) {
          const {
            data: projectData,
            error: projectError,
          } = await supabase
            .from("projects")
            .select(
              `
              id,
              client_id,
              freelancer_id,
              status,
              payment_status,
              created_at
              `
            )
            .eq(
              "client_id",
              currentContract.client_id
            )
            .eq(
              "freelancer_id",
              currentContract.freelancer_id
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .limit(1)
            .maybeSingle();

          if (projectError) {
            console.error(
              "Project lookup error:",
              projectError
            );
          }

          if (projectData) {
            connectedProject =
              projectData as Project;

            setProject(
              connectedProject
            );
          } else {
            setProject(null);
          }
        }

        /*
         * ----------------------------------------------
         * LOAD MILESTONES
         * ----------------------------------------------
         */

        const {
          data: milestoneData,
          error: milestoneError,
        } = await supabase
          .from("milestones")
          .select("*")
          .eq(
            "contract_id",
            contractId
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (milestoneError) {
          console.error(
            "Milestone loading error:",
            milestoneError
          );

          setMessage(
            "Unable to load milestones."
          );

          return;
        }

        let loadedMilestones =
          (milestoneData as Milestone[]) ||
          [];

        /*
         * ----------------------------------------------
         * REPAIR OLD MILESTONES WITHOUT PROJECT ID
         * ----------------------------------------------
         */

        if (
          connectedProject &&
          loadedMilestones.length >
            0
        ) {
          const
            milestonesWithoutProject =
              loadedMilestones.filter(
                (milestone) =>
                  !milestone.project_id
              );

          if (
            milestonesWithoutProject.length >
            0
          ) {
            const milestoneIds =
              milestonesWithoutProject.map(
                (milestone) =>
                  milestone.id
              );

            const {
              error: repairError,
            } = await supabase
              .from("milestones")
              .update({
                project_id:
                  connectedProject.id,
              })
              .in(
                "id",
                milestoneIds
              );

            if (repairError) {
              console.error(
                "Milestone project linking error:",
                repairError
              );
            } else {
              loadedMilestones =
                loadedMilestones.map(
                  (milestone) => ({
                    ...milestone,

                    project_id:
                      milestone.project_id ||
                      connectedProject!.id,
                  })
                );
            }
          }
        }

        setMilestones(
          loadedMilestones
        );

        /*
         * ----------------------------------------------
         * LOAD PAYOUT RECORDS
         * ----------------------------------------------
         */

        const milestoneIds =
          loadedMilestones.map(
            (milestone) =>
              milestone.id
          );

        if (
          milestoneIds.length >
          0
        ) {
          const {
            data: payoutData,
            error: payoutError,
          } = await supabase
            .from(
              "freelancer_payouts"
            )
            .select(
              `
              id,
              milestone_id,
              gross_amount,
              platform_fee,
              freelancer_amount,
              platform_fee_percent,
              status,
              payment_received_at,
              approved_for_payout_at,
              paid_out_at
              `
            )
            .in(
              "milestone_id",
              milestoneIds
            );

          if (payoutError) {
            console.error(
              "Payout loading error:",
              payoutError
            );
          }

          const payoutMap:
            Record<
              string,
              Payout
            > = {};

          (
            (payoutData as Payout[]) ||
            []
          ).forEach(
            (payout) => {
              payoutMap[
                payout.milestone_id
              ] = payout;
            }
          );

          setPayouts(
            payoutMap
          );
        } else {
          setPayouts({});
        }
      } catch (error) {
        console.error(
          "Unexpected milestone loading error:",
          error
        );

        setMessage(
          "An unexpected error occurred while loading milestones."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * --------------------------------------------------
   * CREATE MILESTONE
   * --------------------------------------------------
   */

  const createMilestone =
    async () => {
      setMessage("");

      if (
        !title.trim() ||
        !amount
      ) {
        setMessage(
          "Please enter a milestone title and amount."
        );

        return;
      }

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {
        setMessage(
          "Please enter a valid milestone amount."
        );

        return;
      }

      if (!contract) {
        setMessage(
          "Contract information could not be loaded."
        );

        return;
      }

      if (
        role !== "client"
      ) {
        setMessage(
          "Only the client can create milestones."
        );

        return;
      }

      if (!project?.id) {
        setMessage(
          "No project is linked to this contract."
        );

        return;
      }

      /*
       * Do not add new milestones to a
       * completed contract.
       */

      if (
        contract.status ===
        "completed"
      ) {
        setMessage(
          "This contract has already been completed."
        );

        return;
      }

      setSaving(true);

      try {
        const {
          data: milestoneData,
          error,
        } = await supabase
          .from("milestones")
          .insert({
            project_id:
              project.id,

            contract_id:
              contractId,

            title:
              title.trim(),

            description:
              description.trim(),

            amount:
              numericAmount,

            status:
              "pending",
          })
          .select()
          .single();

        if (error) {
          console.error(
            "Milestone creation error:",
            error
          );

          setMessage(
            error.message
          );

          return;
        }

        /*
         * ACTIVITY
         */

        if (
          milestoneData?.id
        ) {
          const {
            error:
              activityError,
          } = await supabase
            .from(
              "contract_activity"
            )
            .insert({
              contract_id:
                contractId,

              action:
                `Milestone created: ${title.trim()}`,
            });

          if (
            activityError
          ) {
            console.error(
              "Milestone activity error:",
              activityError
            );
          }
        }

        /*
         * NOTIFY FREELANCER
         */

        if (
          contract.freelancer_id
        ) {
          const {
            error:
              notificationError,
          } = await supabase
            .from(
              "notifications"
            )
            .insert({
              user_id:
                contract.freelancer_id,

              title:
                "New Milestone Created",

              body:
                `A new milestone "${title.trim()}" was created.`,

              link:
                `/dashboard/contracts/${contractId}/milestones`,

              is_read:
                false,
            });

          if (
            notificationError
          ) {
            console.error(
              "Milestone notification error:",
              notificationError
            );
          }
        }

        setTitle("");
        setDescription("");
        setAmount("");

        setMessage(
          "Milestone created successfully."
        );

        await loadMilestones();
      } finally {
        setSaving(false);
      }
    };

  /*
   * --------------------------------------------------
   * FREELANCER APPROVES MILESTONE
   * --------------------------------------------------
   */

  const approveMilestone =
    async (
      milestone: Milestone
    ) => {
      setMessage("");

      if (
        role !==
        "freelancer"
      ) {
        setMessage(
          "Only the freelancer can approve a milestone."
        );

        return;
      }

      if (
        milestone.status !==
        "pending"
      ) {
        setMessage(
          "Only pending milestones can be approved."
        );

        return;
      }

      setUpdatingMilestoneId(
        milestone.id
      );

      try {
        const {
          error,
        } = await supabase
          .from("milestones")
          .update({
            status:
              "approved",
          })
          .eq(
            "id",
            milestone.id
          )
          .eq(
            "status",
            "pending"
          );

        if (error) {
          console.error(
            "Milestone approval error:",
            error
          );

          setMessage(
            error.message
          );

          return;
        }

        await supabase
          .from(
            "contract_activity"
          )
          .insert({
            contract_id:
              contractId,

            action:
              `Milestone "${milestone.title || "Untitled"}" marked as approved`,
          });

        if (
          contract?.client_id
        ) {
          await supabase
            .from(
              "notifications"
            )
            .insert({
              user_id:
                contract.client_id,

              title:
                "Milestone Approved",

              body:
                `Milestone "${milestone.title || "Untitled"}" was approved and is ready for payment.`,

              link:
                `/dashboard/contracts/${contractId}/milestones`,

              is_read:
                false,
            });
        }

        setMessage(
          "Milestone approved."
        );

        await loadMilestones();
      } finally {
        setUpdatingMilestoneId(
          null
        );
      }
    };

  /*
   * --------------------------------------------------
   * FREELANCER SUBMITS WORK
   *
   * paid -> submitted
   * payout remains held
   * --------------------------------------------------
   */

  const submitWork =
    async (
      milestone: Milestone
    ) => {
      setMessage("");

      if (
        role !==
        "freelancer"
      ) {
        setMessage(
          "Only the freelancer can submit completed work."
        );

        return;
      }

      if (
        milestone.status !==
        "paid"
      ) {
        setMessage(
          "The milestone must be paid before work can be submitted."
        );

        return;
      }

      const payout =
        payouts[
          milestone.id
        ];

      if (!payout) {
        setMessage(
          "The payment record for this milestone could not be found."
        );

        return;
      }

      if (
        payout.status !==
          "held" &&
        payout.status !==
          "ready_for_payout"
      ) {
        setMessage(
          "This milestone does not have a valid held payout."
        );

        return;
      }

      setUpdatingMilestoneId(
        milestone.id
      );

      try {
        const {
          error,
        } = await supabase
          .from("milestones")
          .update({
            status:
              "submitted",
          })
          .eq(
            "id",
            milestone.id
          )
          .eq(
            "status",
            "paid"
          );

        if (error) {
          console.error(
            "Work submission error:",
            error
          );

          setMessage(
            error.message
          );

          return;
        }

        /*
         * ACTIVITY
         */

        await supabase
          .from(
            "contract_activity"
          )
          .insert({
            contract_id:
              contractId,

            action:
              `Work submitted for milestone "${milestone.title || "Untitled"}"`,
          });

        /*
         * NOTIFY CLIENT
         */

        if (
          contract?.client_id
        ) {
          await supabase
            .from(
              "notifications"
            )
            .insert({
              user_id:
                contract.client_id,

              title:
                "Work Submitted",

              body:
                `The freelancer submitted work for milestone "${milestone.title || "Untitled Milestone"}". Please review and approve it.`,

              link:
                `/dashboard/contracts/${contractId}/milestones`,

              is_read:
                false,
            });
        }

        setMessage(
          "Work submitted successfully. Waiting for client approval."
        );

        await loadMilestones();
      } finally {
        setUpdatingMilestoneId(
          null
        );
      }
    };

  /*
   * --------------------------------------------------
   * CLIENT APPROVES SUBMITTED WORK
   *
   * submitted -> completed
   *
   * payout:
   * held -> ready_for_payout
   * --------------------------------------------------
   */

  const approveSubmittedWork =
    async (
      milestone: Milestone
    ) => {
      setMessage("");

      if (
        role !==
        "client"
      ) {
        setMessage(
          "Only the client can approve submitted work."
        );

        return;
      }

      if (
        milestone.status !==
        "submitted"
      ) {
        setMessage(
          "Only submitted work can be approved."
        );

        return;
      }

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        setMessage(
          "Please login again."
        );

        return;
      }

      if (
        contract?.client_id !==
        user.id
      ) {
        setMessage(
          "You are not authorised to approve this milestone."
        );

        return;
      }

      const payout =
        payouts[
          milestone.id
        ];

      if (!payout) {
        setMessage(
          "No payout record was found for this milestone."
        );

        return;
      }

      if (
        payout.status ===
        "paid_out"
      ) {
        setMessage(
          "This freelancer payout has already been completed."
        );

        return;
      }

      if (
        payout.status !==
          "held" &&
        payout.status !==
          "ready_for_payout"
      ) {
        setMessage(
          `This payout cannot be approved while its status is "${payout.status}".`
        );

        return;
      }

      setUpdatingMilestoneId(
        milestone.id
      );

      const approvedAt =
        new Date().toISOString();

      try {
        /*
         * ----------------------------------------------
         * STEP 1:
         * MARK PAYOUT READY
         * ----------------------------------------------
         */

        if (
          payout.status ===
          "held"
        ) {
          const {
            error:
              payoutError,
          } = await supabase
            .from(
              "freelancer_payouts"
            )
            .update({
              status:
                "ready_for_payout",

              approved_for_payout_at:
                approvedAt,

              updated_at:
                approvedAt,
            })
            .eq(
              "id",
              payout.id
            )
            .eq(
              "milestone_id",
              milestone.id
            )
            .eq(
              "client_id",
              user.id
            )
            .eq(
              "status",
              "held"
            );

          if (
            payoutError
          ) {
            console.error(
              "Payout approval error:",
              payoutError
            );

            setMessage(
              payoutError.message
            );

            return;
          }
        }

        /*
         * ----------------------------------------------
         * STEP 2:
         * MARK MILESTONE COMPLETED
         * ----------------------------------------------
         */

        const {
          error:
            milestoneError,
        } = await supabase
          .from("milestones")
          .update({
            status:
              "completed",
          })
          .eq(
            "id",
            milestone.id
          )
          .eq(
            "status",
            "submitted"
          );

        if (
          milestoneError
        ) {
          console.error(
            "Milestone completion error:",
            milestoneError
          );

          /*
           * Attempt to put payout
           * back on hold if milestone
           * completion failed.
           */

          if (
            payout.status ===
            "held"
          ) {
            await supabase
              .from(
                "freelancer_payouts"
              )
              .update({
                status:
                  "held",

                approved_for_payout_at:
                  null,

                updated_at:
                  new Date().toISOString(),
              })
              .eq(
                "id",
                payout.id
              )
              .eq(
                "status",
                "ready_for_payout"
              );
          }

          setMessage(
            milestoneError.message
          );

          return;
        }

        /*
         * ----------------------------------------------
         * ACTIVITY
         * ----------------------------------------------
         */

        await supabase
          .from(
            "contract_activity"
          )
          .insert({
            contract_id:
              contractId,

            action:
              `Client approved work for milestone "${milestone.title || "Untitled"}". Freelancer payout is ready.`,
          });

        /*
         * ----------------------------------------------
         * NOTIFY FREELANCER
         * ----------------------------------------------
         */

        if (
          contract?.freelancer_id
        ) {
          await supabase
            .from(
              "notifications"
            )
            .insert({
              user_id:
                contract.freelancer_id,

              title:
                "Work Approved",

              body:
                `The client approved milestone "${milestone.title || "Untitled Milestone"}". Your payment is now ready for payout.`,

              link:
                `/dashboard/contracts/${contractId}/milestones`,

              is_read:
                false,
            });
        }

        setMessage(
          "Work approved successfully. Freelancer payout is now ready."
        );

        await loadMilestones();
      } finally {
        setUpdatingMilestoneId(
          null
        );
      }
    };

  /*
   * --------------------------------------------------
   * PAY MILESTONE
   * --------------------------------------------------
   */

  const payMilestone =
    (
      milestone: Milestone
    ) => {
      setMessage("");

      if (
        !milestone.project_id
      ) {
        setMessage(
          "Payment unavailable: this milestone is not linked to a project."
        );

        return;
      }

      if (
        milestone.status !==
        "approved"
      ) {
        setMessage(
          "Only approved milestones can be paid."
        );

        return;
      }

      router.push(
        `/dashboard/payment/${milestone.project_id}?milestoneId=${milestone.id}`
      );
    };

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (loading) {
    return <LoadingSkeleton />;
  }

  /*
   * --------------------------------------------------
   * PAGE
   * --------------------------------------------------
   */

  return (
    <main className="dashboard-page">

      {/* HEADER */}

      <section className="dashboard-header">
        <h1>
          Project Milestones
        </h1>

        <p>
          Break projects into professional milestone
          payments and stages.
        </p>
      </section>

      {/* MESSAGE */}

      {message && (
        <p className="upload-message">
          {message}
        </p>
      )}

      {/* PROJECT INFORMATION */}

      {project && (
        <section
          className="dark-card"
          style={{
            marginBottom:
              30,
          }}
        >
          <h2>
            Project Payment Information
          </h2>

          <p>
            <strong>
              Project ID:
            </strong>{" "}
            {project.id}
          </p>

          <p>
            <strong>
              Project Status:
            </strong>{" "}
            {project.status ||
              "active"}
          </p>

          <p>
            <strong>
              Payment Status:
            </strong>{" "}
            {project.payment_status ||
              "unpaid"}
          </p>
        </section>
      )}

      {/* CLIENT CREATE MILESTONE */}

      {role === "client" &&
        contract?.status !==
          "completed" && (
          <section className="dark-card hire-card">
            <h2>
              Create Milestone
            </h2>

            <label className="form-label">
              Milestone Title
            </label>

            <input
              type="text"
              placeholder="Example: Initial CAD drawings"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              className="form-input"
            />

            <label className="form-label">
              Milestone Description
            </label>

            <textarea
              placeholder="Describe the milestone deliverables..."
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              className="form-input proposal-textarea"
            />

            <label className="form-label">
              Amount
            </label>

            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Example: 2500"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              className="form-input"
            />

            <button
              type="button"
              onClick={
                createMilestone
              }
              disabled={
                saving
              }
              className="primary-action-btn"
            >
              {saving
                ? "Creating..."
                : "Create Milestone"}
            </button>
          </section>
        )}

      {/* COMPLETED CONTRACT */}

      {role === "client" &&
        contract?.status ===
          "completed" && (
          <section className="dark-card">
            <p>
              This contract has
              been completed. No
              additional milestones
              can be created.
            </p>
          </section>
        )}

      {/* MILESTONES */}

      <section
        style={{
          marginTop: 30,
        }}
      >
        <h2
          style={{
            marginBottom: 18,
          }}
        >
          Milestones
        </h2>

        {milestones.length ===
        0 ? (
          <EmptyState
            emoji="📌"
            title="No milestones yet"
            description="Create milestones for this contract."
          />
        ) : (
          <div className="contracts-grid">
            {milestones.map(
              (milestone) => {
                const payout =
                  payouts[
                    milestone.id
                  ];

                const isUpdating =
                  updatingMilestoneId ===
                  milestone.id;

                return (
                  <div
                    key={
                      milestone.id
                    }
                    className="dark-card contract-card"
                  >
                    <div className="contract-top">
                      <h2>
                        {milestone.title ||
                          "Untitled Milestone"}
                      </h2>

                      <span
                        className={`contract-status ${
                          milestone.status ||
                          "pending"
                        }`}
                      >
                        {milestone.status ||
                          "pending"}
                      </span>
                    </div>

                    <p className="contract-budget">
                      Amount: ZAR{" "}
                      {Number(
                        milestone.amount ||
                          0
                      ).toFixed(
                        2
                      )}
                    </p>

                    <p className="contract-description">
                      {milestone.description ||
                        "No description provided."}
                    </p>

                    {/* PAYOUT INFORMATION */}

                    {payout && (
                      <div
                        style={{
                          marginTop:
                            15,

                          padding:
                            15,

                          borderRadius:
                            10,

                          border:
                            "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        <p>
                          <strong>
                            Freelancer
                            amount:
                          </strong>{" "}
                          ZAR{" "}
                          {Number(
                            payout.freelancer_amount ||
                              0
                          ).toFixed(
                            2
                          )}
                        </p>

                        <p>
                          <strong>
                            Platform
                            fee:
                          </strong>{" "}
                          ZAR{" "}
                          {Number(
                            payout.platform_fee ||
                              0
                          ).toFixed(
                            2
                          )}
                        </p>

                        <p>
                          <strong>
                            Payout
                            status:
                          </strong>{" "}
                          {payout.status ||
                            "held"}
                        </p>
                      </div>
                    )}

                    {/* PROJECT LINK */}

                    {!milestone.project_id && (
                      <p
                        style={{
                          marginTop:
                            10,

                          marginBottom:
                            10,
                        }}
                      >
                        <strong>
                          Payment
                          link:
                        </strong>{" "}
                        Not linked
                      </p>
                    )}

                    {/* PENDING */}

                    {milestone.status ===
                      "pending" &&
                      role ===
                        "freelancer" && (
                        <div className="contract-actions">
                          <button
                            type="button"
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              approveMilestone(
                                milestone
                              )
                            }
                            className="accept-btn"
                          >
                            {isUpdating
                              ? "Approving..."
                              : "Approve"}
                          </button>
                        </div>
                      )}

                    {milestone.status ===
                      "pending" &&
                      role ===
                        "client" && (
                        <div className="contract-actions">
                          <span className="contract-status pending">
                            Waiting for
                            Freelancer
                            Approval
                          </span>
                        </div>
                      )}

                    {/* APPROVED */}

                    {milestone.status ===
                      "approved" && (
                      <div className="contract-actions">
                        {role ===
                          "client" &&
                          milestone.project_id && (
                            <button
                              type="button"
                              onClick={() =>
                                payMilestone(
                                  milestone
                                )
                              }
                              className="primary-action-btn"
                            >
                              Pay Now
                            </button>
                          )}

                        {role ===
                          "client" &&
                          !milestone.project_id && (
                            <span className="contract-status rejected">
                              Payment
                              unavailable:
                              project not
                              linked
                            </span>
                          )}

                        {role ===
                          "freelancer" && (
                            <span className="contract-status approved">
                              Awaiting
                              Payment
                            </span>
                          )}
                      </div>
                    )}

                    {/* PAID */}

                    {milestone.status ===
                      "paid" && (
                      <div className="contract-actions">

                        {role ===
                          "freelancer" && (
                          <>
                            <span className="contract-status approved">
                              Payment
                              Secured
                            </span>

                            <button
                              type="button"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                submitWork(
                                  milestone
                                )
                              }
                              className="primary-action-btn"
                            >
                              {isUpdating
                                ? "Submitting..."
                                : "Submit Work"}
                            </button>
                          </>
                        )}

                        {role ===
                          "client" && (
                            <span className="contract-status approved">
                              Paid —
                              Freelancer
                              Working
                            </span>
                          )}
                      </div>
                    )}

                    {/* SUBMITTED */}

                    {milestone.status ===
                      "submitted" && (
                      <div className="contract-actions">

                        {role ===
                          "freelancer" && (
                            <span className="contract-status pending">
                              Awaiting
                              Client
                              Approval
                            </span>
                          )}

                        {role ===
                          "client" && (
                          <>
                            <span className="contract-status pending">
                              Work
                              Submitted
                            </span>

                            <button
                              type="button"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                approveSubmittedWork(
                                  milestone
                                )
                              }
                              className="primary-action-btn"
                            >
                              {isUpdating
                                ? "Approving Work..."
                                : "Approve Work"}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* COMPLETED */}

                    {milestone.status ===
                      "completed" && (
                      <div className="contract-actions">
                        <span className="contract-status completed">
                          Completed
                        </span>

                        {payout?.status ===
                          "ready_for_payout" && (
                          <span className="contract-status approved">
                            Ready for
                            Payout
                          </span>
                        )}

                        {payout?.status ===
                          "paid_out" && (
                          <span className="contract-status completed">
                            Freelancer
                            Paid Out
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}