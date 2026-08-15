"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  // IMPORTANT:
  // Payment page sends ?projectId=...
  const projectId = searchParams.get("projectId");

  // Payment page also sends ?milestoneId=...
  const milestoneId = searchParams.get("milestoneId");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    updatePayment();
  }, [projectId, milestoneId]);

  const updatePayment = async () => {
    setLoading(true);
    setMessage("");

    try {
      // --------------------------------------------------
      // CHECK PAYMENT PARAMETERS
      // --------------------------------------------------

      if (!projectId) {
        setMessage("Payment project information is missing.");
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // GET CURRENT USER
      // --------------------------------------------------

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please login first.");
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // LOAD PROJECT
      // --------------------------------------------------

      const {
        data: project,
        error: projectError,
      } = await supabase
        .from("projects")
        .select(
          "id, client_id, freelancer_id, status, payment_status, paid_at"
        )
        .eq("id", projectId)
        .single();

      if (projectError || !project) {
        console.error(
          "Payment success project error:",
          projectError
        );

        setMessage(
          projectError?.message ||
            "The project could not be found."
        );

        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // SECURITY
      // --------------------------------------------------

      if (project.client_id !== user.id) {
        setMessage(
          "You are not authorised to update this payment."
        );

        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // UPDATE PROJECT PAYMENT
      // --------------------------------------------------

      const {
        error: updateProjectError,
      } = await supabase
        .from("projects")
        .update({
  payment_status: "paid",
  paid_at: new Date().toISOString(),
  status: "active",
})
        .eq("id", projectId)
        .eq("client_id", user.id);

      if (updateProjectError) {
        console.error(
          "Project payment update error:",
          updateProjectError
        );

        setMessage(
          updateProjectError.message ||
            "The project payment could not be updated."
        );

        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // UPDATE MILESTONE TO PAID
      // --------------------------------------------------

      if (milestoneId) {
        const {
          data: milestone,
          error: milestoneError,
        } = await supabase
          .from("milestones")
          .select(
            "id, project_id, contract_id, title, amount, status"
          )
          .eq("id", milestoneId)
          .eq("project_id", projectId)
          .single();

        if (milestoneError || !milestone) {
          console.error(
            "Payment milestone loading error:",
            milestoneError
          );

          setMessage(
            "The payment was received, but the milestone could not be verified."
          );

          setLoading(false);
          return;
        }

        // --------------------------------------------------
        // MARK MILESTONE AS PAID
        // --------------------------------------------------

        const {
          error: milestoneUpdateError,
        } = await supabase
          .from("milestones")
          .update({
            status: "paid",
          })
          .eq("id", milestoneId)
          .eq("project_id", projectId);

        if (milestoneUpdateError) {
          console.error(
            "Milestone payment update error:",
            milestoneUpdateError
          );

          setMessage(
            "The payment was received, but the milestone status could not be updated."
          );

          setLoading(false);
          return;
        }

        // --------------------------------------------------
        // RECORD CONTRACT ACTIVITY
        // --------------------------------------------------

        if (milestone.contract_id) {
          await supabase
            .from("contract_activity")
            .insert({
              contract_id: milestone.contract_id,
              action: `Milestone "${milestone.title || "Untitled"}" payment completed`,
            });
        }

        // --------------------------------------------------
        // NOTIFY FREELANCER
        // --------------------------------------------------

        if (project.freelancer_id) {
          await supabase
            .from("notifications")
            .insert({
              user_id: project.freelancer_id,
              title: "Payment Received",
              body: `Payment received for milestone "${milestone.title || "Untitled Milestone"}".`,
              link: `/dashboard/contracts/${
                milestone.contract_id || ""
              }/milestones`,
              is_read: false,
            });
        }
      }

      // --------------------------------------------------
      // SUCCESS
      // --------------------------------------------------

      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error(
        "Payment success error:",
        error
      );

      setMessage(
        "An unexpected error occurred while confirming the payment."
      );

      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <main className="dashboard-main">
      <section className="dark-card contract-card">
        {success ? (
          <>
            <p className="dashboard-badge">
              Payment Completed
            </p>

            <h1>Payment Successful</h1>

            <p>
              Your payment was successfully recorded.
              The project payment status has been updated
              and the milestone has been marked as paid.
            </p>

            <div
              className="contract-actions"
              style={{
                justifyContent: "center",
                marginTop: 25,
              }}
            >
              <Link
                href="/dashboard/projects"
                className="primary-action-link"
              >
                Back to Projects
              </Link>

              {milestoneId && (
                <Link
                  href={`/dashboard/payment/${projectId}?milestoneId=${milestoneId}`}
                  className="primary-action-link"
                >
                  View Payment
                </Link>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="dashboard-badge">
              Payment Verification
            </p>

            <h1>
              Payment Could Not Be Verified
            </h1>

            <p>
              {message ||
                "We could not verify the payment."}
            </p>

            <div
              className="contract-actions"
              style={{
                justifyContent: "center",
                marginTop: 25,
              }}
            >
              <Link
                href="/dashboard/projects"
                className="primary-action-link"
              >
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