"use client";

import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import Link from "next/link";

import { supabase } from "@/app/lib/supabase";

export default function PaymentSuccessPage() {
  const searchParams =
    useSearchParams();

  const projectId =
    searchParams.get("project");

  const [loading, setLoading] =
    useState(true);

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    updatePayment();
  }, []);

  const updatePayment = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const { error } =
      await supabase
        .from("projects")
        .update({
          payment_status: "paid",
          paid_at:
            new Date().toISOString(),
        })
        .eq("id", projectId);

    if (!error) {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <p style={{ padding: 20 }}>
        Processing payment...
      </p>
    );
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "60px auto",
        textAlign: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 40,
          borderRadius: 12,
          border:
            "1px solid #ddd",
        }}
      >
        {success ? (
          <>
            <h1>
              Payment Successful 🎉
            </h1>

            <p>
              Your project payment
              was completed.
            </p>

            <Link
              href="/dashboard/projects"
              style={{
                display:
                  "inline-block",

                marginTop: 20,

                padding:
                  "12px 18px",

                backgroundColor:
                  "green",

                color: "white",

                borderRadius: 8,

                textDecoration:
                  "none",
              }}
            >
              Back to Projects
            </Link>
          </>
        ) : (
          <>
            <h1>
              Payment Failed
            </h1>

            <p>
              Could not verify
              payment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}