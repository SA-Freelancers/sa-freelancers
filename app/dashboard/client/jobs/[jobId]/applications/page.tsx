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

  if (loading) return <p>Loading applications...</p>;

  return (
    <div>
      <section style={hero}>
        <h1>Job Applications</h1>
        <p>Review proposals, accept freelancers, message applicants, and manage hiring.</p>
      </section>

      {message && <p style={messageBox}>{message}</p>}

      {applications.length === 0 && (
        <div style={emptyCard}>
          <h2>No applications yet</h2>
          <p>Freelancer proposals will appear here.</p>
        </div>
      )}

      <div style={grid}>
        {applications.map((application) => (
          <div key={application.id} style={card}>
            <span style={statusBadge(application.status)}>
              {application.status || "pending"}
            </span>

            <h3>Freelancer Application</h3>

            <p>
              <strong>Freelancer ID:</strong>
              <br />
              {application.freelancer_id}
            </p>

            <p>
              <strong>Proposed Budget:</strong> ZAR {application.proposed_budget}
            </p>

            <p style={{ color: "#475569" }}>{application.cover_message}</p>

            <div style={actions}>
              <button
                type="button"
                onClick={() => updateStatus(application.id, "accepted")}
                style={greenBtn}
              >
                Accept
              </button>

              <button
                type="button"
                onClick={() => updateStatus(application.id, "rejected")}
                style={redBtn}
              >
                Reject
              </button>

              <Link href={`/dashboard/messages/${application.id}`} style={blueBtn}>
                Message
              </Link>

              <Link href={`/freelancers/${application.freelancer_id}`} style={darkBtn}>
                View Profile
              </Link>

              <Link href={`/dashboard/review/${application.id}`} style={purpleBtn}>
                Review
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  color: "white",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 22,
};

const card = {
  background: "white",
  padding: 24,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const emptyCard = {
  background: "white",
  padding: 30,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
};

const messageBox = {
  background: "#ecfdf5",
  color: "#166534",
  padding: 14,
  borderRadius: 12,
  marginBottom: 20,
};

const actions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
  marginTop: 20,
};

const greenBtn = {
  padding: "10px 14px",
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
};

const redBtn = {
  padding: "10px 14px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
};

const blueBtn = {
  padding: "10px 14px",
  background: "#2563eb",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
};

const darkBtn = {
  padding: "10px 14px",
  background: "#111827",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
};

const purpleBtn = {
  padding: "10px 14px",
  background: "#7c3aed",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
};

const statusBadge = (status: string) => ({
  display: "inline-block",
  background:
    status === "accepted"
      ? "#dcfce7"
      : status === "rejected"
      ? "#fee2e2"
      : "#dbeafe",
  color:
    status === "accepted"
      ? "#166534"
      : status === "rejected"
      ? "#991b1b"
      : "#1d4ed8",
  padding: "6px 10px",
  borderRadius: 20,
  fontWeight: "bold",
  fontSize: 13,
});