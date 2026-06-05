"use client";

import EmptyState from "@/app/components/EmptyState";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Application = {
  id: string;
  job_id?: string;
  freelancer_id?: string;
  cover_message?: string;
  proposed_budget?: number | string;
  status?: string;
  created_at?: string;
};

export default function ClientApplicationsPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadApplications();
  }, [jobId]);

  const loadApplications = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setApplications((data as Application[]) || []);
    setLoading(false);
  };

  const updateStatus = async (
    applicationId: string,
    status: "accepted" | "rejected"
  ) => {
    setMessage("");

    const currentApplication = applications.find(
      (app) => app.id === applicationId
    );

    if (!currentApplication) {
      setMessage("Application not found.");
      return;
    }

    if (currentApplication.status !== "pending") {
      setMessage("This application decision is already final.");
      return;
    }

    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId)
      .eq("status", "pending");

    if (error) {
      setMessage(error.message);
      return;
    }

    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, status } : app
      )
    );

    if (status === "accepted") {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("projects").insert({
          job_id: jobId,
          application_id: currentApplication.id,
          client_id: user.id,
          freelancer_id: currentApplication.freelancer_id,
          status: "active",
          payment_status: "unpaid",
        });
      }
    }

    setMessage(`Application ${status}. This decision is now final.`);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Applications</p>

        <h1>Job Applications</h1>

        <p>
          Review proposals, accept freelancers, message applicants, and manage
          hiring.
        </p>
      </section>

      {message && <p className="upload-message">{message}</p>}

      {applications.length === 0 ? (
        <EmptyState
          emoji="📨"
          title="No applications yet"
          description="Freelancer proposals will appear here."
          buttonText="Back to Jobs"
          buttonLink="/dashboard/jobs"
        />
      ) : (
        <div className="contracts-grid">
          {applications.map((application) => (
            <div key={application.id} className="dark-card contract-card">
              <div className="contract-top">
                <h2>Freelancer Application</h2>

                <span className={`contract-status ${application.status || "pending"}`}>
                  {application.status || "pending"}
                </span>
              </div>

              <p>
                <strong>Freelancer ID:</strong>
                <br />
                {application.freelancer_id || "N/A"}
              </p>

              <p className="contract-budget">
                Proposed Budget: ZAR {application.proposed_budget || "N/A"}
              </p>

              <p className="contract-description">
                {application.cover_message || "No proposal message."}
              </p>

              {application.status === "pending" ? (
                <div className="contract-actions">
                  <button
                    type="button"
                    onClick={() => updateStatus(application.id, "accepted")}
                    className="accept-btn"
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(application.id, "rejected")}
                    className="reject-btn"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <p className="upload-message">
                  Final decision: {application.status}
                </p>
              )}

              <div className="contract-actions">
                <Link
                  href={`/dashboard/messages/${application.id}`}
                  className="primary-action-link"
                >
                  Message
                </Link>

                <Link
                  href={`/freelancers/${application.freelancer_id}`}
                  className="primary-action-link"
                >
                  View Profile
                </Link>

                <Link
                  href={`/dashboard/review/${application.id}`}
                  className="primary-action-link"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}