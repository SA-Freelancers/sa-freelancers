"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Report = {
  id: string;
  reported_user_id?: string;
  reporter_user_id?: string;
  reason?: string;
  details?: string;
  status?: string;
  created_at?: string;
};

export default function AdminUserReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setReports((data as Report[]) || []);
    setLoading(false);
  };

  const suspendUser = async (userId?: string) => {
    setMessage("");

    if (!userId) {
      setMessage("No reported user found.");
      return;
    }

    const confirmSuspend = confirm("Suspend this user?");
    if (!confirmSuspend) return;

    const { error } = await supabase
      .from("profiles")
      .update({ suspended: true })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("User suspended successfully.");
  };

  const markReviewed = async (reportId: string) => {
    setMessage("");

    const { error } = await supabase
      .from("reports")
      .update({ status: "reviewed" })
      .eq("id", reportId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId ? { ...report, status: "reviewed" } : report
      )
    );

    setMessage("Report marked as reviewed.");
  };

  if (loading) return <LoadingSkeleton />;

  if (!isAdmin) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Admin Reports</p>
          <h1>Access denied</h1>
          <p>You are not allowed to view user reports.</p>
        </section>
      </main>
    );
  }

  const openReports = reports.filter((report) => report.status !== "reviewed");
  const reviewedReports = reports.filter(
    (report) => report.status === "reviewed"
  );

  const renderReports = (items: Report[]) => {
    if (items.length === 0) {
      return (
        <EmptyState
          emoji="🚩"
          title="No reports here"
          description="Reports will appear here when available."
        />
      );
    }

    return (
      <section className="contracts-grid">
        {items.map((report) => (
          <div key={report.id} className="dark-card contract-card">
            <div className="marketplace-badges">
              <span className="reject-btn">
                🚩 {report.reason || "User Report"}
              </span>

              <span
                className={
                  report.status === "reviewed"
                    ? "verified-badge"
                    : "top-rated-badge"
                }
              >
                {report.status === "reviewed" ? "Reviewed" : "Open"}
              </span>
            </div>

            <p>
              <strong>Reported User:</strong>{" "}
              {report.reported_user_id || "N/A"}
            </p>

            <p>
              <strong>Reporter:</strong> {report.reporter_user_id || "N/A"}
            </p>

            <p className="contract-description">
              {report.details || "No details provided."}
            </p>

            <small>
              {report.created_at
                ? new Date(report.created_at).toLocaleString()
                : ""}
            </small>

            <div className="contract-actions">
              {report.reported_user_id && (
                <a
                  href={`/freelancers/${report.reported_user_id}`}
                  className="primary-action-link"
                >
                  View Reported Profile
                </a>
              )}

              {report.status !== "reviewed" && (
                <>
                  <button
                    onClick={() => markReviewed(report.id)}
                    className="accept-btn"
                  >
                    Mark Reviewed
                  </button>

                  <button
                    onClick={() => suspendUser(report.reported_user_id)}
                    className="reject-btn"
                  >
                    Suspend User
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    );
  };

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin Reports</p>

        <h1>User Reports</h1>

        <p>Review reports submitted by clients and freelancers.</p>
      </section>

      {message && <p className="upload-message">{message}</p>}

      <section className="dashboard-stats">
        <div className="dark-card stat-card">
          <h3>{reports.length}</h3>
          <p>Total Reports</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{openReports.length}</h3>
          <p>Open Reports</p>
        </div>

        <div className="dark-card stat-card">
          <h3>{reviewedReports.length}</h3>
          <p>Reviewed Reports</p>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: 18 }}>Open Reports</h2>
        {renderReports(openReports)}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 18 }}>Reviewed Reports</h2>
        {renderReports(reviewedReports)}
      </section>
    </main>
  );
}