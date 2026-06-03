"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Log = {
  id: string;
  source?: string;
  content?: string;
  reason?: string;
  created_at?: string;
};

export default function ModerationLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const { data } = await supabase
      .from("moderation_logs")
      .select("*")
      .order("created_at", { ascending: false });

    setLogs((data as Log[]) || []);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin Moderation</p>
        <h1>Blocked Contact Attempts</h1>
        <p>Review proposals or messages blocked for unsafe contact sharing.</p>
      </section>

      {logs.length === 0 ? (
        <EmptyState
          emoji="🛡️"
          title="No moderation logs"
          description="Blocked contact attempts will appear here."
        />
      ) : (
        <section className="contracts-grid">
          {logs.map((log) => (
            <div key={log.id} className="dark-card contract-card">
              <h2>{log.reason || "Moderation Log"}</h2>
              <p><strong>Source:</strong> {log.source || "N/A"}</p>
              <p className="contract-description">{log.content || "No content."}</p>
              <small>
                {log.created_at
                  ? new Date(log.created_at).toLocaleString()
                  : ""}
              </small>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}