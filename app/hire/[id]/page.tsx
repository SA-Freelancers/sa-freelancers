"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Profile = {
  id: string;
  full_name?: string | null;
  role?: string | null;
  category?: string | null;
  top_rated?: boolean | null;
  suspended?: boolean | null;
  is_admin?: boolean | null;
};

export default function HireFreelancerPage() {
  const params = useParams();
  const router = useRouter();

  const freelancerId = params.id as string;

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [viewerId, setViewerId] =
    useState<string | null>(null);

  const [viewerRole, setViewerRole] =
    useState<string | null>(null);

  const [viewerSuspended, setViewerSuspended] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [budget, setBudget] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [accessMessage, setAccessMessage] =
    useState("");

  /*
   * =========================================================
   * LOAD PAGE
   * =========================================================
   */

  useEffect(() => {
    if (!freelancerId) {
      setLoading(false);
      return;
    }

    async function loadPage() {
      setLoading(true);
      setAccessMessage("");

      try {
        /*
         * =====================================================
         * STEP 1
         * CHECK LOGGED-IN USER
         * =====================================================
         */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Hire page authentication error:",
            userError
          );
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        setViewerId(user.id);

        /*
         * =====================================================
         * STEP 2
         * LOAD CLIENT PROFILE
         * =====================================================
         */

        const {
          data: viewerProfile,
          error: viewerError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            role,
            suspended
          `)
          .eq("id", user.id)
          .maybeSingle();

        if (viewerError) {
          console.error(
            "Viewer profile loading error:",
            viewerError
          );

          setAccessMessage(
            "We could not verify your account."
          );

          return;
        }

        if (!viewerProfile) {
          setAccessMessage(
            "Your account profile could not be found."
          );

          return;
        }

        const role =
          viewerProfile.role || null;

        const isSuspended =
          viewerProfile.suspended === true;

        setViewerRole(role);
        setViewerSuspended(isSuspended);

        if (isSuspended) {
          setAccessMessage(
            "Your account is suspended and cannot hire freelancers."
          );

          return;
        }

        if (role !== "client") {
          setAccessMessage(
            "Only client accounts can hire freelancers."
          );

          return;
        }

        /*
         * =====================================================
         * STEP 3
         * PREVENT SELF-HIRING
         * =====================================================
         */

        if (user.id === freelancerId) {
          setAccessMessage(
            "You cannot hire your own freelancer profile."
          );

          return;
        }

        /*
         * =====================================================
         * STEP 4
         * LOAD FREELANCER
         * =====================================================
         */

        const {
          data: freelancerProfile,
          error: freelancerError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            role,
            category,
            top_rated,
            suspended
          `)
          .eq("id", freelancerId)
          .eq("role", "freelancer")
          .maybeSingle();

        if (freelancerError) {
          console.error(
            "Freelancer profile loading error:",
            freelancerError
          );

          setProfile(null);
          return;
        }

        if (!freelancerProfile) {
          setProfile(null);
          return;
        }

        if (
          freelancerProfile.suspended === true
        ) {
          setAccessMessage(
            "This freelancer is currently unavailable for hiring."
          );

          return;
        }

        setProfile(
          freelancerProfile as Profile
        );
      } catch (error) {
        console.error(
          "Hire page loading error:",
          error
        );

        setAccessMessage(
          "Something went wrong while loading this page."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPage();
  }, [freelancerId, router]);

  /*
   * =========================================================
   * CREATE HIRING REQUEST
   * =========================================================
   */

  const createContract = async () => {
    setMessage("");

    /*
     * =====================================================
     * FORM VALIDATION
     * =====================================================
     */

    if (
      !title.trim() ||
      !description.trim() ||
      !budget
    ) {
      setMessage(
        "Please fill in all fields."
      );

      return;
    }

    const numericBudget =
      Number(budget);

    if (
      Number.isNaN(numericBudget) ||
      !Number.isFinite(numericBudget) ||
      numericBudget <= 0
    ) {
      setMessage(
        "Please enter a valid budget."
      );

      return;
    }

    setSending(true);

    try {
      /*
       * =====================================================
       * SECURITY CHECK 1
       * RE-CHECK AUTHENTICATED USER
       * =====================================================
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Hiring authentication error:",
          userError
        );
      }

      if (!user) {
        setMessage(
          "Please login first."
        );

        router.push("/login");
        return;
      }

      /*
       * =====================================================
       * SECURITY CHECK 2
       * PREVENT SELF-HIRING
       * =====================================================
       */

      if (user.id === freelancerId) {
        setMessage(
          "You cannot hire your own freelancer profile."
        );

        return;
      }

      /*
       * =====================================================
       * SECURITY CHECK 3
       * VERIFY CLIENT
       * =====================================================
       */

      const {
        data: clientProfile,
        error: clientError,
      } = await supabase
        .from("profiles")
        .select(`
          role,
          suspended
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (clientError) {
        console.error(
          "Client profile check error:",
          clientError
        );

        setMessage(
          clientError.message
        );

        return;
      }

      if (!clientProfile) {
        setMessage(
          "Your account profile could not be verified."
        );

        return;
      }

      if (
        clientProfile.suspended === true
      ) {
        setMessage(
          "Your account is suspended and cannot hire freelancers."
        );

        return;
      }

      if (
        clientProfile.role !== "client"
      ) {
        setMessage(
          "Only client accounts can hire freelancers."
        );

        return;
      }

      /*
       * =====================================================
       * SECURITY CHECK 4
       * VERIFY FREELANCER
       * =====================================================
       */

      const {
        data: freelancerProfile,
        error: freelancerError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          role,
          suspended
        `)
        .eq("id", freelancerId)
        .maybeSingle();

      if (freelancerError) {
        console.error(
          "Freelancer account check error:",
          freelancerError
        );

        setMessage(
          "We could not check this freelancer account."
        );

        return;
      }

      if (!freelancerProfile) {
        setMessage(
          "This freelancer could not be found."
        );

        return;
      }

      if (
        freelancerProfile.role !==
        "freelancer"
      ) {
        setMessage(
          "This user is not available as a freelancer."
        );

        return;
      }

      if (
        freelancerProfile.suspended ===
        true
      ) {
        setMessage(
          "This freelancer is currently unavailable for hiring."
        );

        return;
      }

      /*
       * =====================================================
       * STEP 1
       * CREATE PROJECT FIRST
       *
       * This gives us the permanent project ID that will
       * be stored directly on the contract.
       * =====================================================
       */

      const {
        data: projectData,
        error: projectError,
      } = await supabase
        .from("projects")
        .insert({
          job_id: null,
          application_id: null,

          client_id:
            user.id,

          freelancer_id:
            freelancerId,

          status:
            "pending",

          payment_status:
            "unpaid",

          paid_at:
            null,
        })
        .select("id")
        .single();

      if (projectError) {
        console.error(
          "Project creation error:",
          projectError
        );

        setMessage(
          `Hiring request could not be created: ${projectError.message}`
        );

        return;
      }

      if (!projectData?.id) {
        setMessage(
          "Project could not be created."
        );

        return;
      }

      /*
       * =====================================================
       * STEP 2
       * CREATE CONTRACT
       *
       * IMPORTANT:
       * Store project_id directly.
       * =====================================================
       */

      const {
        data: contractData,
        error: contractError,
      } = await supabase
        .from("contracts")
        .insert({
          client_id:
            user.id,

          freelancer_id:
            freelancerId,

          project_id:
            projectData.id,

          project_title:
            title.trim(),

          project_description:
            description.trim(),

          budget:
            numericBudget,

          status:
            "pending",
        })
        .select()
        .single();

      /*
       * If contract creation fails, remove the
       * project that was just created.
       */

      if (contractError) {
        console.error(
          "Contract creation error:",
          contractError
        );

        const {
          error: cleanupError,
        } = await supabase
          .from("projects")
          .delete()
          .eq("id", projectData.id)
          .eq("client_id", user.id)
          .eq("status", "pending")
          .eq("payment_status", "unpaid");

        if (cleanupError) {
          console.error(
            "Project cleanup error:",
            cleanupError
          );
        }

        setMessage(
          `Hiring request could not be completed: ${contractError.message}`
        );

        return;
      }

      if (!contractData?.id) {
        /*
         * Defensive cleanup.
         */

        const {
          error: cleanupError,
        } = await supabase
          .from("projects")
          .delete()
          .eq("id", projectData.id)
          .eq("client_id", user.id)
          .eq("status", "pending")
          .eq("payment_status", "unpaid");

        if (cleanupError) {
          console.error(
            "Project cleanup error:",
            cleanupError
          );
        }

        setMessage(
          "Contract could not be created."
        );

        return;
      }

      /*
       * =====================================================
       * STEP 3
       * RECORD CONTRACT ACTIVITY
       * =====================================================
       */

      const {
        error: activityError,
      } = await supabase
        .from("contract_activity")
        .insert({
          contract_id:
            contractData.id,

          action:
            "Hiring request created",
        });

      if (activityError) {
        console.error(
          "Contract activity error:",
          activityError
        );
      }

      /*
       * =====================================================
       * STEP 4
       * NOTIFY FREELANCER
       * =====================================================
       */

      const {
        error: notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id:
            freelancerId,

          title:
            "New Hiring Request",

          body:
            `You received a new hiring request for ${title.trim()}.`,

          link:
            "/dashboard/contracts",

          is_read:
            false,
        });

      if (notificationError) {
        console.error(
          "Notification error:",
          notificationError
        );
      }

      /*
       * =====================================================
       * STEP 5
       * SUCCESS
       * =====================================================
       */

      setMessage(
        "Hiring request sent successfully!"
      );

      setTimeout(() => {
        router.push(
          "/dashboard/client-contracts"
        );
      }, 1200);
    } catch (error) {
      console.error(
        "Hiring request error:",
        error
      );

      setMessage(
        "Something went wrong while sending the hiring request."
      );
    } finally {
      setSending(false);
    }
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <main>
        <LoadingSkeleton />
      </main>
    );
  }

  /*
   * =========================================================
   * ACCESS DENIED
   * =========================================================
   */

  if (accessMessage) {
    return (
      <main>
        <section className="dark-card">
          <p className="dashboard-badge">
            Hire Freelancer
          </p>

          <h1>
            Access Restricted
          </h1>

          <p>
            {accessMessage}
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <button
              type="button"
              className="primary-action-btn"
              onClick={() =>
                router.push(
                  "/freelancers"
                )
              }
            >
              Browse Freelancers
            </button>

            <button
              type="button"
              className="secondary-action-btn"
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
            >
              Dashboard
            </button>
          </div>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * FREELANCER NOT FOUND
   * =========================================================
   */

  if (!profile) {
    return (
      <main>
        <section className="dark-card">
          <p className="dashboard-badge">
            Hire Freelancer
          </p>

          <h1>
            Freelancer not found
          </h1>

          <p>
            This freelancer profile could not
            be loaded or is no longer
            available.
          </p>

          <button
            type="button"
            className="primary-action-btn"
            onClick={() =>
              router.push(
                "/freelancers"
              )
            }
            style={{
              marginTop: 20,
            }}
          >
            Browse Freelancers
          </button>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * FINAL SAFETY CHECK
   * =========================================================
   */

  const canHire =
    !!viewerId &&
    viewerRole === "client" &&
    !viewerSuspended &&
    viewerId !== profile.id &&
    profile.role === "freelancer" &&
    profile.suspended !== true;

  if (!canHire) {
    return (
      <main>
        <section className="dark-card">
          <p className="dashboard-badge">
            Hire Freelancer
          </p>

          <h1>
            Access Restricted
          </h1>

          <p>
            You are not permitted to create
            this hiring request.
          </p>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * MAIN HIRING PAGE
   * =========================================================
   */

  return (
    <main>
      <section className="dark-card">
        <p className="dashboard-badge">
          Hire Freelancer
        </p>

        <h1>
          Hire{" "}
          {profile.full_name ||
            "Freelancer"}
        </h1>

        <p className="hire-description">
          Create a project contract and send
          a professional hiring request.
        </p>

        <div className="hire-profile-summary">
          <strong>
            {profile.full_name ||
              "Freelancer"}
          </strong>

          <span>
            {profile.category ||
              "General"}
          </span>
        </div>

        <label className="form-label">
          Project Title
        </label>

        <input
          type="text"
          placeholder="Example: Build a business website"
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
          className="form-input"
        />

        <label className="form-label">
          Project Description
        </label>

        <textarea
          placeholder="Describe the project, timeline, deliverables and expectations..."
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          className="form-input proposal-textarea"
        />

        <label className="form-label">
          Budget
        </label>

        <input
          type="number"
          min="1"
          step="0.01"
          placeholder="Example: 2500"
          value={budget}
          onChange={(event) =>
            setBudget(
              event.target.value
            )
          }
          className="form-input"
        />

        <button
          type="button"
          onClick={createContract}
          disabled={sending}
          className="primary-action-btn"
        >
          {sending
            ? "Sending..."
            : "Send Hiring Request"}
        </button>

        {message && (
          <p className="upload-message">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}