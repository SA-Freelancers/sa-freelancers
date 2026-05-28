"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { supabase } from "@/app/lib/supabase";

export default function PaymentPage() {
  const params = useParams();

  const projectId =
    params.projectId as string;

  const [project, setProject] =
    useState<any>(null);

  useEffect(() => {
    loadProject();
  }, []);

  const loadProject = async () => {
    const { data } =
      await supabase
        .from("projects")
        .select(`
          *,
          jobs (
            title,
            budget
          )
        `)
        .eq("id", projectId)
        .single();

    if (data) {
      setProject(data);
    }
  };

  if (!project) {
    return (
      <p style={{ padding: 20 }}>
        Loading payment...
      </p>
    );
  }

  const merchantId =
    process.env
      .NEXT_PUBLIC_PAYFAST_MERCHANT_ID;

  const merchantKey =
    process.env
      .NEXT_PUBLIC_PAYFAST_MERCHANT_KEY;

  const returnUrl =
  `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/payment-success?project=${projectId}`;

  const cancelUrl =
    `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/projects`;

  const notifyUrl =
    `${process.env.NEXT_PUBLIC_SITE_URL}`;

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 30,
          borderRadius: 10,
          border:
            "1px solid #ddd",
        }}
      >
        <h1>
          Pay for Project
        </h1>

        <h2>
          {project.jobs?.title}
        </h2>

        <p>
          <strong>
            Amount:
          </strong>{" "}
          ZAR{" "}
          {
            project.jobs?.budget
          }
        </p>

        <form
          action="https://sandbox.payfast.co.za/eng/process"
          method="post"
        >
          <input
            type="hidden"
            name="merchant_id"
            value={merchantId}
          />

          <input
            type="hidden"
            name="merchant_key"
            value={merchantKey}
          />

          <input
            type="hidden"
            name="amount"
            value={
              project.jobs?.budget
            }
          />

          <input
            type="hidden"
            name="item_name"
            value={
              project.jobs?.title
            }
          />

          <input
            type="hidden"
            name="return_url"
            value={returnUrl}
          />

          <input
            type="hidden"
            name="cancel_url"
            value={cancelUrl}
          />

          <input
            type="hidden"
            name="notify_url"
            value={notifyUrl}
          />

          <button
            type="submit"
            style={{
              marginTop: 20,
              padding:
                "14px 20px",
              backgroundColor:
                "green",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Pay with PayFast
          </button>
        </form>
      </div>
    </div>
  );
}