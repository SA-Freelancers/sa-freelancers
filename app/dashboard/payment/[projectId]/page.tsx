"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Project = {
  id: string;
  client_id?: string;
  freelancer_id?: string;
  status?: string;
  payment_status?: string;
  paid_at?: string | null;
};

type Milestone = {
  id: string;
  project_id?: string | null;
  contract_id?: string | null;
  title?: string;
  description?: string;
  amount?: number;
  status?: string;
  created_at?: string;
};

type PayFastCreateResponse = {
  success?: boolean;
  payfastUrl?: string;
  fields?: Record<string, string>;
  error?: string;
};

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId =
    params.projectId as string;

  const milestoneId =
    searchParams.get("milestoneId") ?? "";

  const [project, setProject] =
    useState<Project | null>(null);

  const [milestone, setMilestone] =
    useState<Milestone | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (projectId) {
      loadPaymentDetails();
    }
  }, [projectId, milestoneId]);

  const loadPaymentDetails =
    async () => {
      setLoading(true);
      setMessage("");
      setProject(null);
      setMilestone(null);

      try {
        // ---------------------------------------------
        // CURRENT USER
        // ---------------------------------------------

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          console.error(
            "User loading error:",
            JSON.stringify(
              userError,
              null,
              2
            )
          );

          setMessage(
            "Unable to verify your login."
          );

          return;
        }

        if (!user) {
          setMessage(
            "Please login first."
          );

          return;
        }

        // ---------------------------------------------
        // LOAD PROJECT
        // ---------------------------------------------

        const {
          data: projectData,
          error: projectError,
        } = await supabase
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
          .eq("id", projectId)
          .maybeSingle();

        if (projectError) {
          console.error(
            "Project loading error:",
            JSON.stringify(
              projectError,
              null,
              2
            )
          );

          setMessage(
            projectError.message ||
              "Unable to load the project."
          );

          return;
        }

        if (!projectData) {
          setMessage(
            "Project not found."
          );

          return;
        }

        // ---------------------------------------------
        // SECURITY
        // ONLY PROJECT CLIENT CAN PAY
        // ---------------------------------------------

        if (
          projectData.client_id !==
          user.id
        ) {
          setMessage(
            "You are not authorised to make this payment."
          );

          return;
        }

        setProject(
          projectData as Project
        );

        // ---------------------------------------------
        // MILESTONE ID REQUIRED
        // ---------------------------------------------

        if (!milestoneId) {
          setMessage(
            "No milestone was selected for payment."
          );

          return;
        }

        // ---------------------------------------------
        // LOAD MILESTONE
        // ---------------------------------------------

        const {
          data: milestoneData,
          error: milestoneError,
        } = await supabase
          .from("milestones")
          .select(
            `
            id,
            project_id,
            contract_id,
            title,
            description,
            amount,
            status,
            created_at
            `
          )
          .eq("id", milestoneId)
          .maybeSingle();

        if (milestoneError) {
          console.error(
            "Milestone loading error:",
            JSON.stringify(
              milestoneError,
              null,
              2
            )
          );

          setMessage(
            milestoneError.message ||
              "The selected milestone could not be loaded."
          );

          return;
        }

        if (!milestoneData) {
          setMessage(
            "The selected milestone could not be found."
          );

          return;
        }

        // ---------------------------------------------
        // VERIFY MILESTONE BELONGS TO PROJECT
        // ---------------------------------------------

        if (
          milestoneData.project_id !==
          projectId
        ) {
          console.error(
            "Milestone/project mismatch:",
            {
              milestoneId,
              milestoneProjectId:
                milestoneData.project_id,
              urlProjectId:
                projectId,
            }
          );

          setMessage(
            "This milestone is not linked to the selected project."
          );

          return;
        }

        setMilestone(
          milestoneData as Milestone
        );
      } catch (error) {
        console.error(
          "Unexpected payment loading error:",
          error
        );

        setMessage(
          "An unexpected error occurred while loading the payment."
        );
      } finally {
        setLoading(false);
      }
    };

  // --------------------------------------------------
  // PAYMENT AMOUNT
  // --------------------------------------------------

  const paymentAmount =
    milestone?.amount
      ? Number(milestone.amount)
      : 0;

  // --------------------------------------------------
  // SECURE PAYFAST PAYMENT
  // --------------------------------------------------

  const handlePayment =
    async () => {
      setMessage("");

      if (!project) {
        setMessage(
          "Project information is unavailable."
        );

        return;
      }

      if (!milestone) {
        setMessage(
          "Please select a valid milestone."
        );

        return;
      }

      if (!milestoneId) {
        setMessage(
          "Milestone ID is missing."
        );

        return;
      }

      if (
        !Number.isFinite(
          paymentAmount
        ) ||
        paymentAmount <= 0
      ) {
        setMessage(
          "The milestone amount must be greater than zero."
        );

        return;
      }

      const milestoneStatus =
        milestone.status
          ?.toLowerCase() ?? "";

      if (
        milestoneStatus ===
          "paid" ||
        milestoneStatus ===
          "completed"
      ) {
        setMessage(
          "This milestone has already been paid."
        );

        return;
      }

      if (
        milestoneStatus !==
        "approved"
      ) {
        setMessage(
          "Only approved milestones can be paid."
        );

        return;
      }

      setProcessing(true);

      try {
        // ---------------------------------------------
        // GET CURRENT SESSION
        // ---------------------------------------------

        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (
          sessionError ||
          !sessionData.session
        ) {
          setMessage(
            "Your login session could not be verified. Please login again."
          );

          setProcessing(false);
          return;
        }

        // ---------------------------------------------
        // SERVER PREPARES SIGNED PAYFAST PAYMENT
        // ---------------------------------------------

        const response =
          await fetch(
            "/api/payfast/create",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${sessionData.session.access_token}`,
              },

              body:
                JSON.stringify({
                  projectId,
                  milestoneId,
                }),
            }
          );

        let result:
          PayFastCreateResponse;

        try {
          result =
            await response.json();
        } catch {
          setMessage(
            "The payment server returned an invalid response."
          );

          setProcessing(false);
          return;
        }

        if (!response.ok) {
          console.error(
            "Payment preparation error:",
            result
          );

          setMessage(
            result.error ||
              "Unable to prepare the payment."
          );

          setProcessing(false);
          return;
        }

        if (
          !result.payfastUrl ||
          !result.fields
        ) {
          console.error(
            "Invalid PayFast create response:",
            result
          );

          setMessage(
            "Invalid payment information was returned by the server."
          );

          setProcessing(false);
          return;
        }

        // ---------------------------------------------
        // REMOVE OLD FORM IF PRESENT
        // ---------------------------------------------

        const oldForm =
          document.getElementById(
            "payfast-payment-form"
          );

        if (oldForm) {
          oldForm.remove();
        }

        // ---------------------------------------------
        // BUILD FORM FROM SERVER-SIGNED FIELDS
        // ---------------------------------------------

        const form =
          document.createElement(
            "form"
          );

        form.id =
          "payfast-payment-form";

        form.method =
          "POST";

        form.action =
          result.payfastUrl;

        form.target =
          "_self";

        form.style.display =
          "none";

        Object.entries(
          result.fields
        ).forEach(
          ([name, value]) => {
            const input =
              document.createElement(
                "input"
              );

            input.type =
              "hidden";

            input.name =
              name;

            input.value =
              String(value);

            form.appendChild(
              input
            );
          }
        );

        document.body.appendChild(
          form
        );

        // ---------------------------------------------
        // SEND TO PAYFAST
        // ---------------------------------------------

        form.submit();
      } catch (error) {
        console.error(
          "PayFast payment error:",
          error
        );

        setMessage(
          "Unable to connect to the payment service. Please try again."
        );

        setProcessing(false);
      }
    };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="dashboard-page">
        <section className="dark-card">
          <LoadingSkeleton />
        </section>
      </main>
    );
  }

  // --------------------------------------------------
  // PROJECT FAILED TO LOAD
  // --------------------------------------------------

  if (
    message &&
    !project
  ) {
    return (
      <main className="dashboard-page">
        <section
          className="dark-card contract-card"
          style={{
            maxWidth: 900,
            margin: "40px auto",
          }}
        >
          <p className="dashboard-badge">
            Payment
          </p>

          <h1>
            Payment Information
          </h1>

          <p>
            We could not load the
            payment information.
          </p>
        </section>

        <section
          className="dark-card hire-card"
          style={{
            maxWidth: 900,
            margin: "20px auto",
          }}
        >
          <p className="upload-message">
            {message}
          </p>
        </section>
      </main>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="dashboard-page">

      {/* HEADER */}

      <section
        className="dark-card contract-card"
        style={{
          maxWidth: 900,
          margin: "30px auto 20px",
        }}
      >
        <p className="dashboard-badge">
          Secure Payment
        </p>

        <h1>
          Make Payment
        </h1>

        <p>
          Securely pay for your
          approved project milestone
          through PayFast.
        </p>
      </section>

      {/* MESSAGE */}

      {message && (
        <section
          className="dark-card hire-card"
          style={{
            maxWidth: 900,
            margin: "20px auto",
          }}
        >
          <p className="upload-message">
            {message}
          </p>
        </section>
      )}

      {/* PAYMENT SUMMARY */}

      <section
        className="dark-card hire-card"
        style={{
          maxWidth: 700,
          margin: "0 auto 40px",
        }}
      >
        <h2>
          Payment Summary
        </h2>

        <div className="profile-divider" />

        <div
          style={{
            display: "grid",
            gap: 15,
          }}
        >
          {/* PROJECT */}

          <div>
            <strong>
              Project ID
            </strong>

            <p>
              {project?.id}
            </p>
          </div>

          {/* MILESTONE */}

          <div>
            <strong>
              Milestone
            </strong>

            <p>
              {milestone?.title ||
                "Project Milestone"}
            </p>
          </div>

          {/* DESCRIPTION */}

          {milestone?.description && (
            <div>
              <strong>
                Description
              </strong>

              <p>
                {
                  milestone.description
                }
              </p>
            </div>
          )}

          {/* MILESTONE STATUS */}

          <div>
            <strong>
              Milestone Status
            </strong>

            <p>
              <span
                className={`contract-status ${
                  milestone?.status ||
                  "pending"
                }`}
              >
                {milestone?.status ||
                  "pending"}
              </span>
            </p>
          </div>

          {/* PROJECT PAYMENT STATUS */}

          <div>
            <strong>
              Project Payment Status
            </strong>

            <p>
              {project
                ?.payment_status ||
                "unpaid"}
            </p>

            <p
              style={{
                fontSize: 13,
                opacity: 0.7,
                marginTop: 5,
              }}
            >
              Individual milestone
              payments are tracked
              separately.
            </p>
          </div>

          {/* AMOUNT */}

          <div
            style={{
              marginTop: 10,
              padding: 20,
              borderRadius: 12,
              border:
                "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <span>
              Amount to Pay
            </span>

            <h2
              style={{
                marginTop: 8,
                fontSize: 30,
              }}
            >
              ZAR{" "}
              {paymentAmount.toFixed(
                2
              )}
            </h2>
          </div>
        </div>

        <div className="profile-divider" />

        {/* PAYMENT ACTION */}

        {!milestone ? (
          <div>
            <p className="upload-message">
              Milestone information
              is unavailable.
            </p>
          </div>
        ) : milestone.status
            ?.toLowerCase() ===
            "paid" ? (
          <div>
            <span className="contract-status completed">
              Payment Completed
            </span>

            <p
              style={{
                marginTop: 12,
                opacity: 0.8,
              }}
            >
              This milestone has been
              successfully paid.
            </p>
          </div>
        ) : milestone.status
            ?.toLowerCase() ===
            "completed" ? (
          <div>
            <span className="contract-status completed">
              Milestone Completed
            </span>

            <p
              style={{
                marginTop: 12,
                opacity: 0.8,
              }}
            >
              This milestone has already
              been completed.
            </p>
          </div>
        ) : milestone.status
            ?.toLowerCase() !==
            "approved" ? (
          <div>
            <p>
              This milestone is not
              ready for payment.
            </p>

            <p
              style={{
                marginTop: 8,
                opacity: 0.8,
              }}
            >
              The freelancer must approve
              the milestone before
              payment can be made.
            </p>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={
                handlePayment
              }
              disabled={
                processing
              }
              className="primary-action-btn"
              style={{
                width: "100%",
                marginTop: 10,
                cursor:
                  processing
                    ? "wait"
                    : "pointer",
              }}
            >
              {processing
                ? "Preparing secure payment..."
                : `Pay Now — ZAR ${paymentAmount.toFixed(
                    2
                  )}`}
            </button>

            <p
              style={{
                marginTop: 15,
                textAlign:
                  "center",
                fontSize: 14,
                opacity: 0.75,
              }}
            >
              You will be redirected
              to PayFast to complete
              your payment securely.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}