"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

export default function ModerationPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
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
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Admin</p>

          <h1>Access Restricted</h1>

          <p>Only administrators can access moderation tools.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin</p>

        <h1>Moderation Center</h1>

        <p>
          Review platform activity, investigate reports and take action on
          suspicious users or content.
        </p>
      </section>

      <section className="contracts-grid">
        <div className="dark-card contract-card">
          <h2>User Monitoring</h2>

          <p>
            Review reported users and suspend accounts when necessary.
          </p>
        </div>

        <div className="dark-card contract-card">
          <h2>Job Monitoring</h2>

          <p>
            Review suspicious jobs and projects that violate platform rules.
          </p>
        </div>

        <div className="dark-card contract-card">
          <h2>Proposal Monitoring</h2>

          <p>
            Detect contact sharing, spam and other prohibited behaviour.
          </p>
        </div>

        <div className="dark-card contract-card">
          <h2>Platform Safety</h2>

          <p>
            Maintain a safe and professional environment for clients and
            freelancers.
          </p>
        </div>
      </section>
    </main>
  );
}