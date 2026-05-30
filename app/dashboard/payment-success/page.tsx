"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
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

      if (!error) setSuccess(true);

      setLoading(false);
    };

    updatePayment();
  }, [projectId]);

  if (loading) return <p>Processing payment...</p>;

  return (
    <div style={page}>
      <div className="dark-card" style={card}>
        {success ? (
          <>
            <div style={icon}>✅</div>

            <h1>Payment Successful</h1>

            <p>
              Your payment was completed and the project is now marked as paid.
            </p>

            <Link href="/dashboard/projects" style={button}>
              Back to Projects
            </Link>
          </>
        ) : (
          <>
            <div style={icon}>⚠️</div>

            <h1>Payment Could Not Be Verified</h1>

            <p>Please return to your projects and try again.</p>

            <Link href="/dashboard/projects" style={button}>
              Back to Projects
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<p>Loading payment...</p>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

const page = {
  minHeight: "70vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const card = {
  padding: 45,
  borderRadius: 20,
  boxShadow: "0 15px 35px rgba(15,23,42,0.08)",
  textAlign: "center" as const,
  maxWidth: 600,
};

const icon = {
  fontSize: 60,
  marginBottom: 20,
};

const button = {
  display: "inline-block",
  padding: "14px 22px",
  background: "#16a34a",
  color: "white",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: "bold",
};