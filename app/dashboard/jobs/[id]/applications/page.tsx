"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Application = {
  id: string;
  freelancer_id: string;
  proposed_budget: number;
  cover_message?: string;
  status?: string;
  created_at?: string;
  profiles?: {
    full_name?: string;
    role?: string;
    category?: string;
  };
};

export default function ClientApplicationsPage() {
  const params = useParams();
  const id = params.jobId as string;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        profiles (
          full_name,
          role,
          category
        )
      `)
      .eq("job_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
    }

    setApplications((data as Application[]) || []);
    setLoading(false);
  };

  const updateStatus = async (
    applicationId: string,
    status: string
  ) => {
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

    if (error) {
      alert(error.message);
      return;
    }

    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status,
            }
          : app
      )
    );
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="client-applications-page">
      <section className="client-applications-hero dark-card">
        <p className="dashboard-badge">Applications</p>

        <h1>Review freelancer proposals</h1>

        <p>
          Accept or reject proposals safely while keeping communication inside
          the platform.
        </p>
      </section>

      {applications.length === 0 ? (
        <EmptyState
          emoji="📨"
          title="No applications yet"
          description="Freelancer proposals will appear here."
          buttonText="Back to Dashboard"
          buttonLink="/dashboard"
        />
      ) : (
        <section className="applications-grid">
          {applications.map((application) => (
            <div
              key={application.id}
              className="dark-card application-review-card"
            >
              <div className="application-top">
                <div>
                  <h2>
                    {application.profiles?.full_name ||
                      "Unnamed Freelancer"}
                  </h2>

                  <p className="application-role">
                    {application.profiles?.role ||
                      "Professional Freelancer"}
                  </p>
                </div>

                <span
                  className={`application-status ${
                    application.status || "pending"
                  }`}
                >
                  {application.status || "pending"}
                </span>
              </div>

              <div className="application-meta">
                <span>
                  Category:{" "}
                  {application.profiles?.category || "General"}
                </span>

                <strong>
                  ZAR {application.proposed_budget}
                </strong>
              </div>

              <div className="application-warning">
                Contact details should remain private until hiring/payment is
                completed through the platform.
              </div>

              <div className="application-message">
                {application.cover_message ||
                  "No proposal message provided."}
              </div>

              <div className="application-actions">
                <button
                  onClick={() =>
                    updateStatus(application.id, "accepted")
                  }
                  className="accept-btn"
                >
                  Accept
                </button>

                <button
                  onClick={() =>
                    updateStatus(application.id, "rejected")
                  }
                  className="reject-btn"
                >
                  Reject
                </button>

                <Link
                  href={`/freelancers/${application.freelancer_id}`}
                  className="view-profile-btn"
                >
                  View Profile
                </Link>

                <Link
                  href={`/dashboard/review/${application.id}`}
                  className="review-btn"
                >
                  Leave Review
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}