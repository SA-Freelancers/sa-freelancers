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
  created_at?: string;
};

export default function AdminUserReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
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
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    setReports((data as Report[]) || []);
    setLoading(false);
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

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin Reports</p>

        <h1>User Reports</h1>

        <p>Review reports submitted by clients and freelancers.</p>
      </section>

      {reports.length === 0 ? (
        <EmptyState
          emoji="🚩"
          title="No user reports"
          description="Submitted user reports will appear here."
        />
      ) : (
        <section className="contracts-grid">
          {reports.map((report) => (
            <div key={report.id} className="dark-card contract-card">
              <div className="marketplace-badges">
  <span className="reject-btn">
    🚩 {report.reason || "User Report"}
  </span>
</div>

              <p>
                <strong>Reported User:</strong>{" "}
                {report.reported_user_id || "N/A"}
              </p>

              <p>
                <strong>Reporter:</strong>{" "}
                {report.reporter_user_id || "N/A"}
              </p>

              <p className="contract-description">
                {report.details || "No details provided."}
              </p>

              <small>
                {report.created_at
                  ? new Date(report.created_at).toLocaleString()
                  : ""}
              </small>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}