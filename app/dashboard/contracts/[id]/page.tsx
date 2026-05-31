"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Contract = {
  id: string;
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

export default function ContractDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    const { data: contractData } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    setContract((contractData as Contract) || null);

    const { data: activityData } = await supabase
      .from("contract_activity")
      .select("*")
      .eq("contract_id", id)
      .order("created_at", { ascending: false });

    setActivities((activityData as Activity[]) || []);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!contract) {
    return (
      <main className="contract-details-page">
        <EmptyState
          emoji="📄"
          title="Contract not found"
          description="This contract could not be loaded."
        />
      </main>
    );
  }

  return (
    <main className="contract-details-page">
      <section className="dark-card contract-details-card">
        <p className="dashboard-badge">Contract Details</p>

        <div className="contract-top">
          <h1>{contract.project_title || "Untitled Project"}</h1>

          <span className={`contract-status ${contract.status || "pending"}`}>
            {contract.status || "pending"}
          </span>
        </div>

        <div className="contract-info-grid">
          <div className="dark-card contract-info-item">
            <h3>Budget</h3>
            <p>ZAR {contract.budget || 0}</p>
          </div>

          <div className="dark-card contract-info-item">
            <h3>Status</h3>
            <p>{contract.status || "pending"}</p>
          </div>

          <div className="dark-card contract-info-item">
            <h3>Created</h3>
            <p>
              {contract.created_at
                ? new Date(contract.created_at).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="contract-description-box">
          <h2>Project Description</h2>

          <p>
            {contract.project_description || "No description provided."}
          </p>
        </div>

        <div className="contract-timeline">
          <h2>Activity Timeline</h2>

          {activities.length === 0 ? (
            <p>No activity yet.</p>
          ) : (
            <div className="timeline-list">
              {activities.map((activity) => (
                <div key={activity.id} className="timeline-item">
                  <div className="timeline-dot" />

                  <div>
                    <strong>{activity.action || "Contract activity"}</strong>

                    <p>
                      {activity.created_at
                        ? new Date(activity.created_at).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}