"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = params.projectId as string;
  const milestoneId = searchParams.get("milestoneId") ?? "";

  const [project, setProject] = useState<Project | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  /*
   * --------------------------------------------------
   * LOAD PAYMENT DETAILS
   * --------------------------------------------------
   */

  useEffect(() => {
    if (projectId) {
      loadPaymentDetails();
    }
  }, [projectId, milestoneId]);

  const loadPaymentDetails = async () => {
    setLoading(true);
    setMessage("");
    setProject(null);
    setMilestone(null);

    try {
      /*
       * --------------------------------------------------
       * GET CURRENT USER
       * --------------------------------------------------
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "User loading error:",
          JSON.stringify(userError, null, 2)
        );

        setMessage("Unable to verify your login.");
        return;
      }

      if (!user) {
        setMessage("Please login first.");
        return;
      }

      /*
       * --------------------------------------------------
       * LOAD PROJECT
       * --------------------------------------------------
       */

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
          JSON.stringify(projectError, null, 2)
        );

        setMessage(
          projectError.message ||
            "Unable to load the project."
        );

        return;
      }

      if (!projectData) {
        setMessage("Project not found.");
        return;
      }

      /*
       * --------------------------------------------------
       * SECURITY CHECK
       *
       * Only the client who owns the project
       * can make the payment.
       * --------------------------------------------------
       */

      if (projectData.client_id !== user.id) {
        setMessage(
          "You are not authorised to make this payment."
        );

        return;
      }

      const loadedProject =
        projectData as Project;

      setProject(loadedProject);

      /*
       * --------------------------------------------------
       * LOAD MILESTONE
       * --------------------------------------------------
       */

      if (!milestoneId) {
        setMessage(
          "No milestone was selected for payment."
        );

        return;
      }

      /*
       * IMPORTANT:
       *
       * We first locate the milestone by ID only.
       *
       * We do NOT use .single().
       *
       * Then we manually verify that project_id
       * matches the project in the URL.
       */

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
          JSON.stringify(milestoneError, null, 2)
        );

        setMessage(
          milestoneError.message ||
            "The selected milestone could not be loaded."
        );

        return;
      }

      /*
       * No milestone returned.
       */

      if (!milestoneData) {
        console.error(
          "Milestone not found:",
          milestoneId
        );

        setMessage(
          "The selected milestone could not be found."
        );

        return;
      }

      /*
       * --------------------------------------------------
       * VERIFY PROJECT LINK
       * --------------------------------------------------
       */

      if (
        milestoneData.project_id !== projectId
      ) {
        console.error(
          "Milestone/project mismatch:",
          {
            milestoneId,
            milestoneProjectId:
              milestoneData.project_id,
            urlProjectId: projectId,
          }
        );

        setMessage(
          "This milestone is not linked to the selected project."
        );

        return;
      }

      /*
       * --------------------------------------------------
       * SAVE MILESTONE
       * --------------------------------------------------
       */

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

  /*
   * --------------------------------------------------
   * PAYMENT AMOUNT
   * --------------------------------------------------
   */

  const paymentAmount = milestone?.amount
    ? Number(milestone.amount)
    : 0;

  /*
   * --------------------------------------------------
   * PAYFAST CONFIGURATION
   * --------------------------------------------------
   */

  const merchantId =
    process.env
      .NEXT_PUBLIC_PAYFAST_MERCHANT_ID;

  const merchantKey =
    process.env
      .NEXT_PUBLIC_PAYFAST_MERCHANT_KEY;

  /*
   * SANDBOX CHECKOUT URL
   *
   * IMPORTANT:
   * This must be a normal URL string.
   */

  const payFastUrl =
    "https://sandbox.payfast.co.za/eng/process";

  /*
   * --------------------------------------------------
   * APPLICATION URL
   * --------------------------------------------------
   */

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "";

  /*
   * --------------------------------------------------
   * RETURN URL
   * --------------------------------------------------
   */

  const returnUrl =
    `${origin}/dashboard/payment-success` +
    `?projectId=${encodeURIComponent(
      projectId
    )}` +
    `&milestoneId=${encodeURIComponent(
      milestoneId || ""
    )}`;

  /*
   * --------------------------------------------------
   * CANCEL URL
   * --------------------------------------------------
   */

  const cancelUrl =
    `${origin}/dashboard/client-contracts`;

  /*
   * --------------------------------------------------
   * NOTIFY URL
   * --------------------------------------------------
   *
   * IMPORTANT:
   * localhost will not receive PayFast ITN
   * notifications from the PayFast servers.
   *
   * This becomes important after deployment.
   */

  const notifyUrl =
    `${origin}/api/payfast/notify`;

  /*
   * --------------------------------------------------
   * START PAYFAST PAYMENT
   * --------------------------------------------------
   */

  const handlePayment = async () => {
    console.log(
      "=============================="
    );

    console.log(
      "PAY NOW CLICKED"
    );

    console.log(
      "Project ID:",
      projectId
    );

    console.log(
      "Milestone ID:",
      milestoneId
    );

    console.log(
      "Milestone:",
      milestone
    );

    console.log(
      "Payment amount:",
      paymentAmount
    );

    console.log(
      "PayFast URL:",
      payFastUrl
    );

    console.log(
      "Return URL:",
      returnUrl
    );

    console.log(
      "Cancel URL:",
      cancelUrl
    );

    console.log(
      "Notify URL:",
      notifyUrl
    );

    console.log(
      "=============================="
    );

    setMessage("");

    /*
     * --------------------------------------------------
     * VALIDATION
     * --------------------------------------------------
     */

    if (!merchantId) {
      setMessage(
        "PayFast Merchant ID is missing."
      );
      return;
    }

    if (!merchantKey) {
      setMessage(
        "PayFast Merchant Key is missing."
      );
      return;
    }

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

    if (paymentAmount <= 0) {
      setMessage(
        "The milestone amount must be greater than zero."
      );
      return;
    }

    /*
     * --------------------------------------------------
     * MILESTONE MUST BE APPROVED
     * --------------------------------------------------
     */

    if (
      milestone.status?.toLowerCase() !==
      "approved"
    ) {
      setMessage(
        "Only approved milestones can be paid."
      );

      return;
    }

    /*
     * --------------------------------------------------
     * IMPORTANT:
     *
     * DO NOT use project.payment_status here.
     *
     * The project can contain:
     *
     * payment_status = paid
     *
     * because another milestone was already paid.
     *
     * Each milestone needs its own payment status.
     *
     * We therefore only block this payment when
     * THIS milestone itself has status = paid.
     * --------------------------------------------------
     */

    if (
      milestone.status?.toLowerCase() ===
      "paid"
    ) {
      setMessage(
        "This milestone has already been paid."
      );

      return;
    }

    /*
     * --------------------------------------------------
     * START PROCESSING
     * --------------------------------------------------
     */

    setProcessing(true);

    /*
     * --------------------------------------------------
     * CREATE PAYFAST FORM
     * --------------------------------------------------
     */

    try {
      /*
       * Remove any old PayFast form.
       */

      const oldForm =
        document.getElementById(
          "payfast-payment-form"
        );

      if (oldForm) {
        oldForm.remove();
      }

      /*
       * Create form.
       */

      const form =
        document.createElement("form");

      form.id =
        "payfast-payment-form";

      form.method = "POST";

      form.action =
        payFastUrl;

      form.target =
        "_self";

      form.style.display =
        "none";

      /*
       * --------------------------------------------------
       * PAYFAST FIELDS
       * --------------------------------------------------
       */

      const fields: Record<
        string,
        string
      > = {
        merchant_id:
          merchantId.trim(),

        merchant_key:
          merchantKey.trim(),

        return_url:
          returnUrl,

        cancel_url:
          cancelUrl,

        notify_url:
          notifyUrl,

        name_first:
          "Freelance Hub",

        name_last:
          "SA Client",

        email_address:
          "client@example.com",

        m_payment_id:
          milestoneId,

        amount:
          paymentAmount.toFixed(2),

        item_name:
          milestone.title ||
          "Freelance Project Milestone",

        item_description:
          milestone.description ||
          `Payment for ${
            milestone.title ||
            "project milestone"
          }`,

        custom_str1:
          projectId,

        custom_str2:
          milestoneId,

        custom_str3:
          milestone.contract_id ||
          "",

        custom_str4:
          "Freelance Hub SA",

        custom_str5:
          "Milestone Payment",
      };

      /*
       * --------------------------------------------------
       * ADD FIELDS TO FORM
       * --------------------------------------------------
       */

      Object.entries(fields).forEach(
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
            value;

          form.appendChild(
            input
          );
        }
      );

      /*
       * --------------------------------------------------
       * ADD FORM TO PAGE
       * --------------------------------------------------
       */

      document.body.appendChild(
        form
      );

      /*
       * --------------------------------------------------
       * LOG FINAL FORM
       * --------------------------------------------------
       */

      console.log(
        "Submitting PayFast form..."
      );

      console.log(
        "Form action:",
        form.action
      );

      console.log(
        "Form method:",
        form.method
      );

      /*
       * --------------------------------------------------
       * SUBMIT
       * --------------------------------------------------
       */

      form.submit();
    } catch (error) {
      console.error(
        "PayFast redirect error:",
        error
      );

      setProcessing(false);

      setMessage(
        "Unable to redirect to PayFast."
      );
    }
  };

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (loading) {
    return (
      <main>
        <section className="dark-card">
          <LoadingSkeleton />
        </section>
      </main>
    );
  }

  /*
   * --------------------------------------------------
   * ERROR
   * --------------------------------------------------
   */

  if (message && !project) {
    return (
      <main>
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
            We could not load the payment
            information.
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

  /*
   * --------------------------------------------------
   * MAIN PAGE
   * --------------------------------------------------
   */

  return (
    <main>
      <section
        className="dark-card contract-card"
        style={{
          maxWidth: 900,
          margin: "30px auto 20px",
        }}
      >
        <p className="dashboard-badge">
          Make Payment
        </p>

        <h1>
          Make Payment
        </h1>

        <p>
          Securely pay for your approved
          project milestone.
        </p>
      </section>

            {/* ERROR MESSAGE */}

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

        <div
          className="profile-divider"
        />

        <div
          style={{
            display: "grid",
            gap: 15,
          }}
        >
          {/* PROJECT ID */}

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
                {milestone.description}
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
              {project?.payment_status ||
                "unpaid"}
            </p>

            <p
              style={{
                fontSize: 13,
                opacity: 0.7,
                marginTop: 5,
              }}
            >
              This is the overall project
              payment status. Individual
              milestones are checked separately.
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

        <div
          className="profile-divider"
        />

        {/* --------------------------------------------------
            PAYFAST CONFIGURATION
            -------------------------------------------------- */}

        {!merchantId ? (
          <div>
            <p className="upload-message">
              PayFast Merchant ID is not
              configured.
            </p>

            <p
              style={{
                marginTop: 10,
                opacity: 0.8,
              }}
            >
              Add
              {" "}
              NEXT_PUBLIC_PAYFAST_MERCHANT_ID
              {" "}
              to your environment variables.
            </p>
          </div>
        ) : !merchantKey ? (
          <div>
            <p className="upload-message">
              PayFast Merchant Key is not
              configured.
            </p>

            <p
              style={{
                marginTop: 10,
                opacity: 0.8,
              }}
            >
              Add
              {" "}
              NEXT_PUBLIC_PAYFAST_MERCHANT_KEY
              {" "}
              to your environment variables.
            </p>
          </div>
                ) : !milestone ? (
          <div>
            <p className="upload-message">
              Milestone information is unavailable.
            </p>
          </div>
        ) : milestone.status?.toLowerCase() === "paid" ? (
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
              This milestone has been successfully paid.
            </p>
          </div>
        ) : milestone.status?.toLowerCase() !== "approved" ? (
          <div>
            <p>This milestone is not ready for payment.</p>

            <p
              style={{
                marginTop: 8,
                opacity: 0.8,
              }}
            >
              The freelancer must approve the milestone before payment can be
              made.
            </p>
          </div>
        ) : (
          /*
           * --------------------------------------------------
           * PAY NOW BUTTON
           * --------------------------------------------------
           */

          <div>
            <button
              type="button"
              onClick={handlePayment}
              disabled={processing}
              className="primary-action-btn"
              style={{
                width: "100%",
                marginTop: 10,
                cursor: processing
                  ? "wait"
                  : "pointer",
              }}
            >
              {processing
                ? "Redirecting to PayFast..."
                : `Pay Now — ZAR ${paymentAmount.toFixed(
                    2
                  )}`}
            </button>

            <p
              style={{
                marginTop: 15,
                textAlign: "center",
                fontSize: 14,
                opacity: 0.75,
              }}
            >
              You will be redirected to
              the PayFast sandbox checkout.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}