"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Report = {
  id: string;
  reason?: string;
  details?: string;
  status?: string;
  created_at?: string;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    setReports((data as Report[]) || []);
    setLoading(false);
  };

  const updateStatus = async (
    reportId: string,
    status: string
  ) => {
    await supabase
      .from("reports")
      .update({ status })
      .eq("id", reportId);

    loadReports();
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin</p>

        <h1>User Reports</h1>

        <p>
          Review reported users, projects and platform issues.
        </p>
      </section>

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

              <p>{report.details || "No details provided."}</p>

              <p>
                <strong>Status:</strong>{" "}
                {report.status || "pending"}
              </p>

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