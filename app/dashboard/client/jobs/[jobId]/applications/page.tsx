"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function ClientApplicationsPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [applications, setApplications] = useState<any[]>([]);
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

    setApplications(data || []);
    setLoading(false);
  };

  const updateStatus = async (applicationId: string, status: string) => {
    setMessage("");

    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

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
      const application = applications.find((app) => app.id === applicationId);

      if (application) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("projects").insert({
            job_id: jobId,
            application_id: application.id,
            client_id: user.id,
            freelancer_id: application.freelancer_id,
            status: "active",
            payment_status: "unpaid",
          });
        }
      }
    }

    setMessage(`Application ${status}`);
  };

  if (loading) {
    return <p style={{ padding: 20 }}>Loading applications...</p>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto" }}>
      <h1>Applications</h1>

      {message && <p>{message}</p>}

      {applications.length === 0 && <p>No applications yet.</p>}

      {applications.map((application) => (
        <div
          key={application.id}
          style={{
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <p>
            <strong>Freelancer ID:</strong> {application.freelancer_id}
          </p>

          <p>
            <strong>Proposed Budget:</strong> ZAR {application.proposed_budget}
          </p>

          <p>
            <strong>Status:</strong> {application.status}
          </p>

          <p>{application.cover_message}</p>

          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => updateStatus(application.id, "accepted")}
              style={greenButton}
            >
              Accept
            </button>

            <button
              type="button"
              onClick={() => updateStatus(application.id, "rejected")}
              style={redButton}
            >
              Reject
            </button>

            <Link href={`/dashboard/messages/${application.id}`} style={blueLink}>
              Message
            </Link>

            <Link href={`/freelancers/${application.freelancer_id}`} style={darkLink}>
              View Profile
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

const greenButton = {
  padding: "10px 14px",
  backgroundColor: "green",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const redButton = {
  padding: "10px 14px",
  backgroundColor: "red",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const blueLink = {
  padding: "10px 14px",
  backgroundColor: "#2563eb",
  color: "white",
  borderRadius: 6,
  textDecoration: "none",
};

const darkLink = {
  padding: "10px 14px",
  backgroundColor: "#111827",
  color: "white",
  borderRadius: 6,
  textDecoration: "none",
};