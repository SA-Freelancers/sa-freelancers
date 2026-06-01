"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Milestone = {
  id: string;
  title?: string;
  description?: string;
  amount?: number;
  status?: string;
};

export default function MilestonesPage() {
  const params = useParams();
  const contractId = params.id as string;

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    const { data } = await supabase
      .from("milestones")
      .select("*")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false });

    setMilestones((data as Milestone[]) || []);
    setLoading(false);
  };

  const createMilestone = async () => {
    if (!title || !amount) return;

    await supabase.from("milestones").insert({
      contract_id: contractId,
      title,
      description,
      amount: Number(amount),
      status: "pending",
    });

    setTitle("");
    setDescription("");
    setAmount("");

    loadMilestones();
  };

  const updateMilestone = async (
    milestoneId: string,
    status: string
  ) => {
    await supabase
      .from("milestones")
      .update({ status })
      .eq("id", milestoneId);

    loadMilestones();
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Milestones</p>

        <h1>Project Milestones</h1>

        <p>
          Break projects into professional milestone payments and stages.
        </p>
      </section>

      <section className="dark-card hire-card">
        <h2>Create Milestone</h2>

        <input
          type="text"
          placeholder="Milestone title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
        />

        <textarea
          placeholder="Milestone description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-input proposal-textarea"
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="form-input"
        />

        <button
          onClick={createMilestone}
          className="primary-action-btn"
        >
          Create Milestone
        </button>
      </section>

      <section style={{ marginTop: 30 }}>
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
                  <h2>{milestone.title}</h2>

                  <span
                    className={`contract-status ${milestone.status}`}
                  >
                    {milestone.status}
                  </span>
                </div>

                <p className="contract-budget">
                  ZAR {milestone.amount || 0}
                </p>

                <p className="contract-description">
                  {milestone.description || "No description"}
                </p>

                <div className="contract-actions">
                  <button
                    onClick={() =>
                      updateMilestone(milestone.id, "approved")
                    }
                    className="accept-btn"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      updateMilestone(milestone.id, "completed")
                    }
                    className="primary-action-btn"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}