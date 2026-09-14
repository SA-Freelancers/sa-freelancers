"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Project = {
  id: string;
  client_id: string | null;
  freelancer_id: string | null;
  status: string | null;
  payment_status: string | null;
  paid_at: string | null;
};

type Milestone = {
  id: string;
  project_id: string | null;
  contract_id: string | null;
  title: string | null;
  amount: number | null;
  status: string | null;
};

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  const projectId =
    searchParams.get("projectId");

  const milestoneId =
    searchParams.get("milestoneId");

  const [loading, setLoading] =
    useState(true);

  const [success, setSuccess] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    verifyPayment();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, milestoneId]);

  // --------------------------------------------------
  // WAIT
  // --------------------------------------------------

  const wait = (
    milliseconds: number
  ) =>
    new Promise((resolve) =>
      setTimeout(
        resolve,
        milliseconds
      )
    );

  // --------------------------------------------------
  // VERIFY PAYMENT
  // --------------------------------------------------

  const verifyPayment =
    async () => {
      setLoading(true);
      setSuccess(false);
      setMessage("");

      try {
        // ----------------------------------------------
        // CHECK PARAMETERS
        // ----------------------------------------------

        if (!projectId) {
          setMessage(
            "Payment project information is missing."
          );

          setLoading(false);
          return;
        }

        // ----------------------------------------------
        // CURRENT USER
        // ----------------------------------------------

        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          setMessage(
            "Please login first."
          );

          setLoading(false);
          return;
        }

        // ----------------------------------------------
        // PAYFAST ITN MAY ARRIVE AFTER REDIRECT
        //
        // Poll briefly so the browser does not mark
        // anything as paid itself.
        // ----------------------------------------------

        const maxAttempts = 10;
        const delayMs = 1500;

        for (
          let attempt = 1;
          attempt <= maxAttempts;
          attempt++
        ) {
          // --------------------------------------------
          // LOAD PROJECT
          // --------------------------------------------

          const {
            data:
              projectData,
            error:
              projectError,
          } =
            await supabase
              .from("projects")
              .select(
                `
                id,
                client_id,
                freelancer_id,
                status,
                payment_status,
                paid_at
                `
              )
              .eq(
                "id",
                projectId
              )
              .maybeSingle();

          if (
            projectError
          ) {
            console.error(
              "Payment verification project error:",
              projectError
            );

            setMessage(
              "The project payment could not be verified."
            );

            setLoading(false);
            return;
          }

          if (
            !projectData
          ) {
            setMessage(
              "The project could not be found."
            );

            setLoading(false);
            return;
          }

          const project =
            projectData as Project;

          // --------------------------------------------
          // SECURITY
          // --------------------------------------------

          if (
            project.client_id !==
            user.id
          ) {
            setMessage(
              "You are not authorised to view this payment."
            );

            setLoading(false);
            return;
          }

          // --------------------------------------------
          // OPTIONAL MILESTONE
          // --------------------------------------------

          let milestone:
            Milestone | null =
            null;

          if (
            milestoneId
          ) {
            const {
              data:
                milestoneData,
              error:
                milestoneError,
            } =
              await supabase
                .from(
                  "milestones"
                )
                .select(
                  `
                  id,
                  project_id,
                  contract_id,
                  title,
                  amount,
                  status
                  `
                )
                .eq(
                  "id",
                  milestoneId
                )
                .eq(
                  "project_id",
                  projectId
                )
                .maybeSingle();

            if (
              milestoneError
            ) {
              console.error(
                "Payment milestone verification error:",
                milestoneError
              );

              setMessage(
                "The payment project was found, but the milestone could not be verified."
              );

              setLoading(false);
              return;
            }

            if (
              !milestoneData
            ) {
              setMessage(
                "The payment milestone could not be found."
              );

              setLoading(false);
              return;
            }

            milestone =
              milestoneData as Milestone;
          }

          // --------------------------------------------
          // VERIFY SERVER-WRITTEN PAYMENT STATE
          // --------------------------------------------

          const projectPaid =
            project.payment_status ===
            "paid";

          const milestonePaid =
            !milestoneId ||
            milestone?.status ===
              "paid" ||
            milestone?.status ===
              "submitted" ||
            milestone?.status ===
              "completed";

          if (
            projectPaid &&
            milestonePaid
          ) {
            setSuccess(true);

            setMessage(
              "Your payment has been verified successfully."
            );

            setLoading(false);
            return;
          }

          // --------------------------------------------
          // WAIT FOR PAYFAST ITN
          // --------------------------------------------

          if (
            attempt <
            maxAttempts
          ) {
            await wait(
              delayMs
            );
          }
        }

        // ----------------------------------------------
        // ITN NOT CONFIRMED YET
        // ----------------------------------------------

        setSuccess(false);

        setMessage(
          "PayFast returned you successfully, but the payment confirmation is still being processed. Please refresh this page shortly."
        );

        setLoading(false);
      } catch (
        error
      ) {
        console.error(
          "Payment verification error:",
          error
        );

        setMessage(
          "An unexpected error occurred while verifying the payment."
        );

        setLoading(false);
      }
    };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <LoadingSkeleton />
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="dashboard-main">
      <section className="dark-card contract-card">
        {success ? (
          <>
            <p className="dashboard-badge">
              Payment Completed
            </p>

            <h1>
              Payment Successful
            </h1>

            <p>
              Your payment has been
              successfully verified.
              The project payment and
              milestone status were
              confirmed by the secure
              payment process.
            </p>

            <div
              className="contract-actions"
              style={{
                justifyContent:
                  "center",
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
              Payment Confirmation Pending
            </h1>

            <p>
              {message ||
                "We could not verify the payment yet."}
            </p>

            <div
              className="contract-actions"
              style={{
                justifyContent:
                  "center",
                marginTop: 25,
              }}
            >
              <button
                type="button"
                className="primary-action-btn"
                onClick={
                  verifyPayment
                }
              >
                Check Again
              </button>

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
    <Suspense
      fallback={
        <LoadingSkeleton />
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}