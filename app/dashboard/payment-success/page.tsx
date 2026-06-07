"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    updatePayment();
  }, []);

  const updatePayment = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("projects")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (!error) {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="contracts-page">
      <section className="dark-card contract-card" style={{ textAlign: "center" }}>
        {success ? (
          <>
            <p className="dashboard-badge">Payment Successful</p>

            <h1>Payment Successful</h1>

            <p>
              Your payment was completed and the project is now marked as paid.
            </p>

            <div className="contract-actions" style={{ justifyContent: "center" }}>
              <Link href="/dashboard/projects" className="primary-action-link">
                Back to Projects
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="dashboard-badge">Payment Verification</p>

            <h1>Payment Could Not Be Verified</h1>

            <p>Please return to your projects and try again.</p>

            <div className="contract-actions" style={{ justifyContent: "center" }}>
              <Link href="/dashboard/projects" className="primary-action-link">
                Back to Projects
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}