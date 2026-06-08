"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Report = {
  id: string;
  reported_user_id?: string;
  reporter_user_id?: string;
  reason?: string;
  details?: string;
  status?: string;
  created_at?: string;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    setReports((data as Report[]) || []);
    setLoading(false);
  };

  const updateStatus = async (reportId: string, status: string) => {
    setMessage("");

    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", reportId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Report marked as ${status}.`);
    loadReports();
  };

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Admin</p>
          <h1>Access Restricted</h1>
          <p>Only admins can view reports.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin</p>

        <h1>User Reports</h1>

        <p>Review reported users, projects and platform issues.</p>
      </section>

      {message && <p className="upload-message">{message}</p>}

      <section className="contracts-grid">
        {reports.length === 0 ? (
          <div className="dark-card contract-card">
            <h2>No Reports</h2>
            <p>No reports have been submitted yet.</p>
          </div>
        ) : (
          reports.map((report) => (
  <div
    key={report.id}
    className="dark-card contract-card"
  >
    <h2>{report.reason || "Report"}</h2>

    <p>
      <strong>Details:</strong>{" "}
      {report.details || "No details provided."}
    </p>

    <p>
      <strong>Reported User:</strong>{" "}
      {report.reported_user_id || "N/A"}
    </p>

    <p>
      <strong>Reporter:</strong>{" "}
      {report.reporter_user_id || "N/A"}
    </p>

    <p>
      <strong>Status:</strong>{" "}
      {report.status || "pending"}
    </p>

    {report.reported_user_id && (
      <a
        href={`/freelancers/${report.reported_user_id}`}
        className="primary-action-link"
      >
        View Reported Profile
      </a>
    )}

    <div className="contract-actions">
      <button
        onClick={() =>
          updateStatus(report.id, "resolved")
        }
        className="accept-btn"
      >
        Resolve
      </button>

      <button
        onClick={() =>
          updateStatus(report.id, "dismissed")
        }
        className="reject-btn"
      >
        Dismiss
      </button>
    </div>
  </div>
))
        )}
      </section>
    </main>
  );
}