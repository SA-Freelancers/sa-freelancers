"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function PaymentPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    const { data } = await supabase
      .from("projects")
      .select(`
        *,
        jobs (
          title,
          budget,
          category
        )
      `)
      .eq("id", projectId)
      .single();

    setProject(data);
  };

  if (!project) {
    return <p>Loading payment...</p>;
  }

  const merchantId = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY;

  const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/payment-success?project=${projectId}`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/projects`;
  const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}`;

  return (
    <div>
      <section style={hero}>
        <h1>Secure Project Payment</h1>
        <p>Pay safely through PayFast to activate project payment tracking.</p>
      </section>

      <div style={card}>
        <span style={badge}>PayFast Checkout</span>

        <h2>{project.jobs?.title}</h2>

        <p>
          <strong>Category:</strong> {project.jobs?.category || "N/A"}
        </p>

        <p>
          <strong>Amount:</strong>{" "}
          <span style={{ fontSize: 28, fontWeight: "bold", color: "#16a34a" }}>
            ZAR {project.jobs?.budget}
          </span>
        </p>

        <p style={{ color: "#475569" }}>
          You will be redirected to PayFast sandbox to complete payment.
        </p>

        <form action="https://sandbox.payfast.co.za/eng/process" method="post">
          <input type="hidden" name="merchant_id" value={merchantId} />
          <input type="hidden" name="merchant_key" value={merchantKey} />
          <input type="hidden" name="amount" value={project.jobs?.budget} />
          <input type="hidden" name="item_name" value={project.jobs?.title} />
          <input type="hidden" name="return_url" value={returnUrl} />
          <input type="hidden" name="cancel_url" value={cancelUrl} />
          <input type="hidden" name="notify_url" value={notifyUrl} />

          <button type="submit" style={payBtn}>
            Pay with PayFast
          </button>
        </form>
      </div>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #16a34a)",
  color: "white",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const card = {
  background: "white",
  padding: 32,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
  maxWidth: 700,
};

const badge = {
  display: "inline-block",
  background: "#dcfce7",
  color: "#166534",
  padding: "6px 10px",
  borderRadius: 20,
  fontWeight: "bold",
  fontSize: 13,
};

const payBtn = {
  marginTop: 25,
  padding: "14px 22px",
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 16,
};