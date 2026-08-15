"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
};

type Profile = {
  role?: string;
};

type Project = {
  id: string;
  client_id?: string;
  freelancer_id?: string;
  status?: string;
  payment_status?: string;
  created_at?: string;
};

export default function MilestonesPage() {
  const params = useParams();
  const router = useRouter();

  const contractId = params.id as string;

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMilestones();
  }, [contractId]);

  const loadMilestones = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // --------------------------------------------------
    // LOAD USER ROLE
    // --------------------------------------------------

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile loading error:", profileError);
    }

    const userRole = profile?.role || "";
    setRole(userRole);

    // --------------------------------------------------
    // LOAD CONTRACT
    // --------------------------------------------------

    const { data: contractData, error: contractError } =
      await supabase
        .from("contracts")
        .select("id, client_id, freelancer_id")
        .eq("id", contractId)
        .single();

    if (contractError || !contractData) {
      console.error("Contract loading error:", contractError);

      setMessage("Unable to load this contract.");
      setLoading(false);
      return;
    }

    const currentContract = contractData as Contract;

    setContract(currentContract);

    // --------------------------------------------------
    // FIND PROJECT CONNECTED TO THIS CONTRACT
    // --------------------------------------------------

    let connectedProject: Project | null = null;

    if (
      currentContract.client_id &&
      currentContract.freelancer_id
    ) {
      const { data: projectData, error: projectError } =
        await supabase
          .from("projects")
          .select(
            "id, client_id, freelancer_id, status, payment_status, created_at"
          )
          .eq("client_id", currentContract.client_id)
          .eq(
            "freelancer_id",
            currentContract.freelancer_id
          )
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (projectError) {
        console.error(
          "Project lookup error:",
          projectError
        );
      }

      if (projectData) {
        connectedProject = projectData as Project;
        setProject(connectedProject);
      }
    }

    // --------------------------------------------------
    // LOAD MILESTONES
    // --------------------------------------------------

    const { data: milestoneData, error: milestoneError } =
      await supabase
        .from("milestones")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });

    if (milestoneError) {
      console.error(
        "Milestone loading error:",
        milestoneError
      );

      setMessage("Unable to load milestones.");
      setLoading(false);
      return;
    }

    let loadedMilestones =
      (milestoneData as Milestone[]) || [];

    // --------------------------------------------------
    // REPAIR OLD MILESTONES
    //
    // Older milestones may have been created before
    // project_id was added. If we found the project,
    // connect those milestones automatically.
    // --------------------------------------------------

    if (connectedProject && loadedMilestones.length > 0) {
      const milestonesWithoutProject =
        loadedMilestones.filter(
          (milestone) => !milestone.project_id
        );

      if (milestonesWithoutProject.length > 0) {
        const milestoneIds =
          milestonesWithoutProject.map(
            (milestone) => milestone.id
          );

        const { error: repairError } = await supabase
          .from("milestones")
          .update({
            project_id: connectedProject.id,
          })
          .in("id", milestoneIds);

        if (repairError) {
          console.error(
  "Milestone project linking error:",
  JSON.stringify(repairError, null, 2)
);
        } else {
          loadedMilestones =
            loadedMilestones.map((milestone) => ({
              ...milestone,
              project_id:
                connectedProject!.id,
            }));
        }
      }
    }

    setMilestones(loadedMilestones);

    setLoading(false);
  };

  // --------------------------------------------------
  // CREATE MILESTONE
  // --------------------------------------------------

  const createMilestone = async () => {
    setMessage("");

    if (!title.trim() || !amount) {
      setMessage(
        "Please enter a milestone title and amount."
      );
      return;
    }

    const numericAmount = Number(amount);

    if (numericAmount <= 0) {
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

    if (role !== "client") {
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

    setSaving(true);

    // --------------------------------------------------
    // CREATE MILESTONE WITH PROJECT ID
    // --------------------------------------------------

    const {
      data: milestoneData,
      error,
    } = await supabase
      .from("milestones")
      .insert({
        project_id: project.id,
        contract_id: contractId,
        title: title.trim(),
        description: description.trim(),
        amount: numericAmount,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Milestone creation error:",
        error
      );

      setMessage(error.message);
      setSaving(false);
      return;
    }

    // --------------------------------------------------
    // ACTIVITY
    // --------------------------------------------------

    if (milestoneData?.id) {
      await supabase
        .from("contract_activity")
        .insert({
          contract_id: contractId,
          action: `Milestone created: ${title.trim()}`,
        });
    }

    // --------------------------------------------------
    // NOTIFY FREELANCER
    // --------------------------------------------------

    if (contract.freelancer_id) {
      await supabase
        .from("notifications")
        .insert({
          user_id: contract.freelancer_id,
          title: "New Milestone Created",
          body: `A new milestone "${title.trim()}" was created.`,
          link: `/dashboard/contracts/${contractId}/milestones`,
          is_read: false,
        });
    }

    setTitle("");
    setDescription("");
    setAmount("");

    setMessage(
      "Milestone created successfully."
    );

    setSaving(false);

    await loadMilestones();
  };

  // --------------------------------------------------
  // UPDATE MILESTONE
  // --------------------------------------------------

  const updateMilestone = async (
    milestoneId: string,
    status: string
  ) => {
    setMessage("");

    const milestone = milestones.find(
      (item) => item.id === milestoneId
    );

    if (!milestone) {
      return;
    }

    // Freelancer approves pending milestone
    if (status === "approved") {
      if (role !== "freelancer") {
        setMessage(
          "Only the freelancer can approve a milestone."
        );
        return;
      }

      if (milestone.status !== "pending") {
        return;
      }
    }

    // Freelancer completes approved/paid milestone
    if (status === "completed") {
      if (role !== "freelancer") {
        setMessage(
          "Only the freelancer can complete a milestone."
        );
        return;
      }

      if (
        milestone.status !== "approved" &&
        milestone.status !== "paid"
      ) {
        setMessage(
          "The milestone must be approved or paid before completion."
        );
        return;
      }
    }

    const { error } = await supabase
      .from("milestones")
      .update({ status })
      .eq("id", milestoneId);

    if (error) {
      console.error(
        "Milestone update error:",
        error
      );

      setMessage(error.message);
      return;
    }

    await supabase
      .from("contract_activity")
      .insert({
        contract_id: contractId,
        action: `Milestone "${milestone.title || "Untitled"}" marked as ${status}`,
      });

    // Notify client
    if (contract?.client_id) {
      await supabase
        .from("notifications")
        .insert({
          user_id: contract.client_id,
          title: "Milestone Update",
          body: `Milestone "${milestone.title || "Untitled"}" was marked as ${status}.`,
          link: `/dashboard/contracts/${contractId}/milestones`,
          is_read: false,
        });
    }

    await loadMilestones();
  };

  // --------------------------------------------------
  // PAY MILESTONE
  // --------------------------------------------------

  const payMilestone = (
    milestone: Milestone
  ) => {
    setMessage("");

    if (!milestone.project_id) {
      setMessage(
        "Payment unavailable: this milestone is not linked to a project."
      );
      return;
    }

    if (milestone.status !== "approved") {
      setMessage(
        "Only approved milestones can be paid."
      );
      return;
    }

    router.push(
      `/dashboard/payment/${milestone.project_id}?milestoneId=${milestone.id}`
    );
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <h1>Project Milestones</h1>

        <p>
          Break projects into professional milestone
          payments and stages.
        </p>
      </section>

      {message && (
        <p className="upload-message">
          {message}
        </p>
      )}

      {/* PROJECT INFORMATION */}

      {project && (
        <section
          className="dark-card"
          style={{ marginBottom: 30 }}
        >
          <h2>Project Payment Information</h2>

          <p>
            <strong>Project ID:</strong>{" "}
            {project.id}
          </p>

          <p>
            <strong>Project Status:</strong>{" "}
            {project.status || "active"}
          </p>

          <p>
            <strong>Payment Status:</strong>{" "}
            {project.payment_status || "unpaid"}
          </p>
        </section>
      )}

      {/* CLIENT: CREATE MILESTONE */}

      {role === "client" && (
        <section className="dark-card hire-card">
          <h2>Create Milestone</h2>

          <label className="form-label">
            Milestone Title
          </label>

          <input
            type="text"
            placeholder="Example: Initial CAD drawings"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="form-input"
          />

          <label className="form-label">
            Milestone Description
          </label>

          <textarea
            placeholder="Describe the milestone deliverables..."
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            className="form-input proposal-textarea"
          />

          <label className="form-label">
            Amount
          </label>

          <input
            type="number"
            min="1"
            placeholder="Example: 2500"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            className="form-input"
          />

          <button
            onClick={createMilestone}
            disabled={saving}
            className="primary-action-btn"
          >
            {saving
              ? "Creating..."
              : "Create Milestone"}
          </button>
        </section>
      )}

      {/* MILESTONES */}

      <section style={{ marginTop: 30 }}>
        <h2 style={{ marginBottom: 18 }}>
          Milestones
        </h2>

        {milestones.length === 0 ? (
          <EmptyState
            emoji="📌"
            title="No milestones yet"
            description="Create milestones for this contract."
          />
        ) : (
          <div className="contracts-grid">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
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
                  {milestone.amount || 0}
                </p>

                <p className="contract-description">
                  {milestone.description ||
                    "No description provided."}
                </p>

                {/* PROJECT LINK STATUS */}

                {!milestone.project_id && (
                  <p
                    style={{
                      marginTop: 10,
                      marginBottom: 10,
                    }}
                  >
                    <strong>
                      Payment link:
                    </strong>{" "}
                    Not linked
                  </p>
                )}

                {/* PENDING */}

                {milestone.status ===
                  "pending" &&
                  role === "freelancer" && (
                    <div className="contract-actions">
                      <button
                        onClick={() =>
                          updateMilestone(
                            milestone.id,
                            "approved"
                          )
                        }
                        className="accept-btn"
                      >
                        Approve
                      </button>
                    </div>
                  )}

                {/* APPROVED */}

                {milestone.status ===
                  "approved" && (
                  <div className="contract-actions">
                    {role === "client" &&
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

                    {role === "client" &&
                      !milestone.project_id && (
                        <span className="contract-status rejected">
                          Payment unavailable:
                          project not linked
                        </span>
                      )}

                    {role === "freelancer" && (
                      <span className="contract-status approved">
                        Awaiting Payment
                      </span>
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
                  </div>
                )}

                {/* PAID */}

                {milestone.status === "paid" && role === "freelancer" && (
  <div className="contract-actions">
    <span className="contract-status approved">
      Paid
    </span>

    <button
      type="button"
      onClick={() =>
        updateMilestone(milestone.id, "completed")
      }
      className="primary-action-btn"
    >
      Complete
    </button>
  </div>
)}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}