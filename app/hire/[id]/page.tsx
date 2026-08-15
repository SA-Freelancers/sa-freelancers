"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Profile = {
  id: string;
  full_name?: string;
  role?: string;
  category?: string;
  verified?: boolean;
  top_rated?: boolean;
};

export default function HireFreelancerPage() {
  const params = useParams();
  const router = useRouter();

  const freelancerId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!freelancerId) {
      setLoading(false);
      return;
    }

    loadFreelancer();
  }, [freelancerId]);

  const loadFreelancer = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", freelancerId)
      .single();

    if (error) {
      console.error(
        "Freelancer profile loading error:",
        error
      );

      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile((data as Profile) || null);
    setLoading(false);
  };

  const createContract = async () => {
    setMessage("");

    /*
     * Validate form.
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

    const numericBudget = Number(budget);

    if (
      Number.isNaN(numericBudget) ||
      numericBudget <= 0
    ) {
      setMessage(
        "Please enter a valid budget."
      );
      return;
    }

    setSending(true);

    /*
     * Get logged-in client.
     */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Please login first."
      );
      setSending(false);
      return;
    }

    /*
     * Make sure the logged-in user is a client.
     */
    const { data: clientProfile, error: clientError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (clientError) {
      setMessage(
        clientError.message
      );
      setSending(false);
      return;
    }

    if (clientProfile?.role !== "client") {
      setMessage(
        "Only client accounts can hire freelancers."
      );
      setSending(false);
      return;
    }

    /*
     * Make sure the selected profile is actually
     * a freelancer.
     */
    if (profile?.role !== "freelancer") {
      setMessage(
        "This user is not available as a freelancer."
      );
      setSending(false);
      return;
    }

    /*
     * STEP 1
     * Create the contract.
     */
    const {
      data: contractData,
      error: contractError,
    } = await supabase
      .from("contracts")
      .insert({
        client_id: user.id,
        freelancer_id: freelancerId,
        project_title: title.trim(),
        project_description:
          description.trim(),
        budget: numericBudget,
        status: "pending",
      })
      .select()
      .single();

    if (contractError) {
      console.error(
        "Contract creation error:",
        contractError
      );

      setMessage(
        contractError.message
      );

      setSending(false);
      return;
    }

    /*
     * STEP 2
     * Create the corresponding project.
     *
     * Direct hiring does not come from a job
     * application, therefore:
     *
     * job_id = NULL
     * application_id = NULL
     */
    const {
      data: projectData,
      error: projectError,
    } = await supabase
      .from("projects")
      .insert({
        job_id: null,
        application_id: null,
        client_id: user.id,
        freelancer_id: freelancerId,
        status: "pending",
        payment_status: "unpaid",
        paid_at: null,
      })
      .select()
      .single();

    /*
     * If project creation fails,
     * remove the contract that was just created.
     */
    if (projectError) {
      console.error(
        "Project creation error:",
        projectError
      );

      if (contractData?.id) {
        await supabase
          .from("contracts")
          .delete()
          .eq(
            "id",
            contractData.id
          );
      }

      setMessage(
        `Hiring request could not be completed: ${projectError.message}`
      );

      setSending(false);
      return;
    }

    /*
     * Make sure the project was actually returned.
     */
    if (!projectData?.id) {
      if (contractData?.id) {
        await supabase
          .from("contracts")
          .delete()
          .eq(
            "id",
            contractData.id
          );
      }

      setMessage(
        "Project could not be created."
      );

      setSending(false);
      return;
    }

    /*
     * STEP 3
     * Record contract activity.
     */
    if (contractData?.id) {
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
    }

    /*
     * STEP 4
     * Notify freelancer.
     */
    const {
      error: notificationError,
    } = await supabase
      .from("notifications")
      .insert({
        user_id: freelancerId,
        title:
          "New Hiring Request",
        body: `You received a new hiring request for ${title.trim()}.`,
        link:
          "/dashboard/contracts",
        is_read: false,
      });

    if (notificationError) {
      console.error(
        "Notification error:",
        notificationError
      );
    }

    /*
     * STEP 5
     * Success.
     */
    setMessage(
      "Hiring request sent successfully!"
    );

    setSending(false);

    /*
     * Give the user enough time to see
     * the success message.
     */
    setTimeout(() => {
      router.push(
        "/dashboard/client-contracts"
      );
    }, 1200);
  };

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <main>
        <LoadingSkeleton />
      </main>
    );
  }

  /*
   * Freelancer not found.
   */
  if (!profile) {
    return (
      <main>
        <section className="dark-card">
          <h1>
            Freelancer not found
          </h1>

          <p>
            This freelancer profile
            could not be loaded.
          </p>
        </section>
      </main>
    );
  }

  /*
   * Main page.
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
          Create a project contract and
          send a professional hiring
          request.
        </p>

        <div className="hire-profile-summary">
          <strong>
            {profile.role ||
              "Professional Freelancer"}
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
          onChange={(e) =>
            setTitle(e.target.value)
          }
          className="form-input"
        />

        <label className="form-label">
          Project Description
        </label>

        <textarea
          placeholder="Describe the project, timeline, deliverables and expectations..."
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
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
          placeholder="Example: 2500"
          value={budget}
          onChange={(e) =>
            setBudget(e.target.value)
          }
          className="form-input"
        />

        <button
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