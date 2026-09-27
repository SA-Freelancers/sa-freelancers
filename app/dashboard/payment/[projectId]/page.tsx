"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type PaymentMode =
  | "milestone"
  | "direct_hire";

type Project = {
  id: string;
  client_id?: string | null;
  freelancer_id?: string | null;
  status?: string | null;
  payment_status?: string | null;
  paid_at?: string | null;
};

type Milestone = {
  id: string;
  project_id?: string | null;
  contract_id?: string | null;
  title?: string | null;
  description?: string | null;
  amount?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type DirectHireContract = {
  id: string;
  project_id?: string | null;
  client_id?: string | null;
  freelancer_id?: string | null;
  project_title?: string | null;
  project_description?: string | null;
  budget?: number | null;
  status?: string | null;
  created_at?: string | null;
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
    typeof params.projectId === "string"
      ? params.projectId
      : "";

  const milestoneId =
    searchParams.get("milestoneId") ?? "";

  /*
   * =====================================================
   * PAYMENT MODE
   * =====================================================
   *
   * milestoneId present:
   *   Existing milestone payment
   *
   * milestoneId absent:
   *   Direct-hire project funding
   * =====================================================
   */

  const paymentMode: PaymentMode =
    milestoneId
      ? "milestone"
      : "direct_hire";

  const [project, setProject] =
    useState<Project | null>(null);

  const [milestone, setMilestone] =
    useState<Milestone | null>(null);

  const [directHireContract, setDirectHireContract] =
    useState<DirectHireContract | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
   * =====================================================
   * LOAD PAYMENT INFORMATION
   * =====================================================
   */

  useEffect(() => {
    if (projectId) {
      void loadPaymentDetails();
    } else {
      setLoading(false);
      setMessage(
        "Project information is unavailable."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, milestoneId]);

  const loadPaymentDetails =
    async () => {
      setLoading(true);
      setMessage("");
      setProject(null);
      setMilestone(null);
      setDirectHireContract(null);

      try {
        /*
         * ===============================================
         * CURRENT USER
         * ===============================================
         */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Payment user loading error:",
            userError
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

        /*
         * ===============================================
         * LOAD PROJECT
         * ===============================================
         */

        const {
          data: projectData,
          error: projectError,
        } = await supabase
          .from("projects")
          .select(`
            id,
            client_id,
            freelancer_id,
            status,
            payment_status,
            paid_at
          `)
          .eq("id", projectId)
          .maybeSingle();

        if (projectError) {
          console.error(
            "Payment project loading error:",
            projectError
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

        /*
         * ===============================================
         * SECURITY
         *
         * Only the project client can reach the
         * payment flow.
         * ===============================================
         */

        if (
          projectData.client_id !==
          user.id
        ) {
          setMessage(
            "You are not authorised to make this payment."
          );

          return;
        }

        const loadedProject =
          projectData as Project;

        setProject(loadedProject);

        /*
         * ===============================================
         * MILESTONE PAYMENT
         * ===============================================
         */

        if (
          paymentMode ===
          "milestone"
        ) {
          const {
            data: milestoneData,
            error: milestoneError,
          } = await supabase
            .from("milestones")
            .select(`
              id,
              project_id,
              contract_id,
              title,
              description,
              amount,
              status,
              created_at
            `)
            .eq("id", milestoneId)
            .maybeSingle();

          if (milestoneError) {
            console.error(
              "Milestone loading error:",
              milestoneError
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

          /*
           * Milestone must belong to the project
           * from the URL.
           */

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

          return;
        }

        /*
         * ===============================================
         * DIRECT-HIRE PAYMENT
         * ===============================================
         *
         * No milestoneId means this page must find
         * the accepted contract linked directly to
         * this project.
         * ===============================================
         */

        const {
          data: contractData,
          error: contractError,
        } = await supabase
          .from("contracts")
          .select(`
            id,
            project_id,
            client_id,
            freelancer_id,
            project_title,
            project_description,
            budget,
            status,
            created_at
          `)
          .eq("project_id", projectId)
          .eq("client_id", user.id)
          .maybeSingle();

        if (contractError) {
          console.error(
            "Direct-hire contract loading error:",
            contractError
          );

          setMessage(
            contractError.message ||
              "Unable to load the direct-hire contract."
          );

          return;
        }

        if (!contractData) {
          setMessage(
            "No direct-hire contract is linked to this project."
          );

          return;
        }

        /*
         * Cross-check the freelancer relationship.
         */

        if (
          contractData.freelancer_id !==
          loadedProject.freelancer_id
        ) {
          console.error(
            "Direct-hire freelancer mismatch:",
            {
              contractFreelancerId:
                contractData.freelancer_id,
              projectFreelancerId:
                loadedProject.freelancer_id,
            }
          );

          setMessage(
            "The contract and project freelancer information do not match."
          );

          return;
        }

        setDirectHireContract(
          contractData as DirectHireContract
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
   * =====================================================
   * PAYMENT AMOUNT
   * =====================================================
   *
   * Display only.
   *
   * The server will independently load the amount
   * from Supabase before signing the PayFast request.
   * =====================================================
   */

  const paymentAmount =
    paymentMode === "milestone"
      ? Number(
          milestone?.amount ?? 0
        )
      : Number(
          directHireContract?.budget ??
            0
        );

  /*
   * =====================================================
   * DIRECT-HIRE STATE
   * =====================================================
   */

  const contractStatus =
    directHireContract?.status
      ?.toLowerCase() ?? "";

  const projectStatus =
    project?.status
      ?.toLowerCase() ?? "";

  const projectPaymentStatus =
    project?.payment_status
      ?.toLowerCase() ?? "";

  const directHireAlreadyPaid =
    paymentMode === "direct_hire" &&
    (
      projectPaymentStatus ===
        "paid" ||
      !!project?.paid_at
    );

  const directHireReady =
    paymentMode === "direct_hire" &&
    !!directHireContract &&
    contractStatus === "accepted" &&
    projectStatus === "pending" &&
    projectPaymentStatus === "unpaid" &&
    !project?.paid_at &&
    Number.isFinite(
      paymentAmount
    ) &&
    paymentAmount > 0;

  /*
   * =====================================================
   * MILESTONE STATE
   * =====================================================
   */

  const milestoneStatus =
    milestone?.status
      ?.toLowerCase() ?? "";

  const milestoneReady =
    paymentMode === "milestone" &&
    !!milestone &&
    milestoneStatus ===
      "approved" &&
    Number.isFinite(
      paymentAmount
    ) &&
    paymentAmount > 0;

  /*
   * =====================================================
   * PAYFAST
   * =====================================================
   */

  const handlePayment =
    async () => {
      setMessage("");

      if (!project) {
        setMessage(
          "Project information is unavailable."
        );

        return;
      }

      /*
       * ===============================================
       * VALIDATE MILESTONE PAYMENT
       * ===============================================
       */

      if (
        paymentMode ===
        "milestone"
      ) {
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
      }

      /*
       * ===============================================
       * VALIDATE DIRECT-HIRE PAYMENT
       * ===============================================
       */

      if (
        paymentMode ===
        "direct_hire"
      ) {
        if (!directHireContract) {
          setMessage(
            "The direct-hire contract could not be found."
          );

          return;
        }

        if (
          contractStatus !==
          "accepted"
        ) {
          setMessage(
            "The freelancer must accept the contract before payment can be made."
          );

          return;
        }

        if (
          directHireAlreadyPaid
        ) {
          setMessage(
            "This project has already been funded."
          );

          return;
        }

        if (
          projectStatus !==
          "pending"
        ) {
          setMessage(
            "This project is not awaiting payment."
          );

          return;
        }

        if (
          projectPaymentStatus !==
          "unpaid"
        ) {
          setMessage(
            "This project is not awaiting payment."
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
            "The contract budget must be greater than zero."
          );

          return;
        }
      }

      setProcessing(true);

      try {
        /*
         * ===============================================
         * CURRENT SESSION
         * ===============================================
         */

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

        /*
         * ===============================================
         * SERVER PREPARES PAYFAST PAYMENT
         * ===============================================
         *
         * IMPORTANT:
         *
         * No payment amount is sent from the browser.
         *
         * Server determines the correct amount from
         * the database.
         * ===============================================
         */

        const requestBody =
          paymentMode ===
          "milestone"
            ? {
                projectId,
                milestoneId,
                paymentType:
                  "milestone",
              }
            : {
                projectId,
                paymentType:
                  "direct_hire",
              };

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
                JSON.stringify(
                  requestBody
                ),
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

        /*
         * ===============================================
         * REMOVE OLD PAYFAST FORM
         * ===============================================
         */

        const oldForm =
          document.getElementById(
            "payfast-payment-form"
          );

        if (oldForm) {
          oldForm.remove();
        }

        /*
         * ===============================================
         * BUILD FORM FROM SERVER-SIGNED FIELDS
         * ===============================================
         */

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

        /*
         * ===============================================
         * REDIRECT TO PAYFAST
         * ===============================================
         */

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

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <main className="dashboard-page">
        <section className="dark-card">
          <LoadingSkeleton />
        </section>
      </main>
    );
  }

  /*
   * =====================================================
   * PROJECT FAILED TO LOAD
   * =====================================================
   */

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

  /*
   * =====================================================
   * DISPLAY INFORMATION
   * =====================================================
   */

  const title =
    paymentMode === "milestone"
      ? milestone?.title ||
        "Project Milestone"
      : directHireContract
          ?.project_title ||
        "Direct Hire Project";

  const description =
    paymentMode === "milestone"
      ? milestone?.description
      : directHireContract
          ?.project_description;

  /*
   * =====================================================
   * PAGE
   * =====================================================
   */

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
          {paymentMode ===
          "milestone"
            ? "Make Milestone Payment"
            : "Fund Project"}
        </h1>

        <p>
          {paymentMode ===
          "milestone"
            ? "Securely pay for your approved project milestone through PayFast."
            : "Securely fund this direct-hire project through PayFast. Work can begin after payment is confirmed."}
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
          {/* PAYMENT TYPE */}

          <div>
            <strong>
              Payment Type
            </strong>

            <p>
              {paymentMode ===
              "milestone"
                ? "Milestone Payment"
                : "Direct Hire Project Funding"}
            </p>
          </div>

          {/* TITLE */}

          <div>
            <strong>
              {paymentMode ===
              "milestone"
                ? "Milestone"
                : "Project"}
            </strong>

            <p>
              {title}
            </p>
          </div>

          {/* DESCRIPTION */}

          {description && (
            <div>
              <strong>
                Description
              </strong>

              <p>
                {description}
              </p>
            </div>
          )}

          {/* MILESTONE STATUS */}

          {paymentMode ===
            "milestone" &&
            milestone && (
              <div>
                <strong>
                  Milestone Status
                </strong>

                <p>
                  <span
                    className={`contract-status ${
                      milestone.status ||
                      "pending"
                    }`}
                  >
                    {milestone.status ||
                      "pending"}
                  </span>
                </p>
              </div>
            )}

          {/* DIRECT HIRE CONTRACT STATUS */}

          {paymentMode ===
            "direct_hire" &&
            directHireContract && (
              <div>
                <strong>
                  Contract Status
                </strong>

                <p>
                  <span
                    className={`contract-status ${
                      directHireContract.status ||
                      "pending"
                    }`}
                  >
                    {directHireContract.status ||
                      "pending"}
                  </span>
                </p>
              </div>
            )}

          {/* PROJECT STATUS */}

          <div>
            <strong>
              Project Status
            </strong>

            <p>
              {project?.status ||
                "Unknown"}
            </p>
          </div>

          {/* PAYMENT STATUS */}

          <div>
            <strong>
              Project Payment Status
            </strong>

            <p>
              {project
                ?.payment_status ||
                "unpaid"}
            </p>

            {paymentMode ===
              "milestone" && (
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
            )}
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

        {/* ==========================================
            MILESTONE ACTION
        ========================================== */}

        {paymentMode ===
          "milestone" && (
          <>
            {!milestone ? (
              <div>
                <p className="upload-message">
                  Milestone information
                  is unavailable.
                </p>
              </div>
            ) : milestoneStatus ===
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
                  This milestone has
                  already been paid.
                </p>
              </div>
            ) : milestoneStatus ===
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
                  This milestone has
                  already been
                  completed.
                </p>
              </div>
            ) : !milestoneReady ? (
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
                  The milestone must be
                  approved before
                  payment can be made.
                </p>
              </div>
            ) : (
              <PaymentButton
                processing={
                  processing
                }
                paymentAmount={
                  paymentAmount
                }
                label="Pay Now"
                onClick={
                  handlePayment
                }
              />
            )}
          </>
        )}

        {/* ==========================================
            DIRECT HIRE ACTION
        ========================================== */}

        {paymentMode ===
          "direct_hire" && (
          <>
            {!directHireContract ? (
              <div>
                <p className="upload-message">
                  Direct-hire contract
                  information is
                  unavailable.
                </p>
              </div>
            ) : directHireAlreadyPaid ? (
              <div>
                <span className="contract-status completed">
                  Project Funded
                </span>

                <p
                  style={{
                    marginTop: 12,
                    opacity: 0.8,
                  }}
                >
                  Payment has already
                  been confirmed for
                  this project.
                </p>
              </div>
            ) : contractStatus !==
              "accepted" ? (
              <div>
                <p>
                  Payment is not
                  available yet.
                </p>

                <p
                  style={{
                    marginTop: 8,
                    opacity: 0.8,
                  }}
                >
                  The freelancer must
                  accept the contract
                  before the project
                  can be funded.
                </p>
              </div>
            ) : projectStatus !==
              "pending" ? (
              <div>
                <p>
                  This project is not
                  awaiting funding.
                </p>
              </div>
            ) : !directHireReady ? (
              <div>
                <p>
                  This project cannot
                  currently be funded.
                </p>
              </div>
            ) : (
              <PaymentButton
                processing={
                  processing
                }
                paymentAmount={
                  paymentAmount
                }
                label="Fund Project"
                onClick={
                  handlePayment
                }
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

/*
 * =========================================================
 * PAYMENT BUTTON
 * =========================================================
 */

function PaymentButton({
  processing,
  paymentAmount,
  label,
  onClick,
}: {
  processing: boolean;
  paymentAmount: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={processing}
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
          : `${label} — ZAR ${paymentAmount.toFixed(
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
        PayFast to complete your
        payment securely.
      </p>
    </div>
  );
}