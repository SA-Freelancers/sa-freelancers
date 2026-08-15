"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Contract = {
  id: string;
  freelancer_id?: string | null;
  client_id?: string | null;
  project_title?: string | null;
  status?: string | null;
};

export default function ContractReviewPage() {
  const params = useParams();
  const router = useRouter();

  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (contractId) {
      loadReviewAccess();
    }
  }, [contractId]);

  const loadReviewAccess = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please login first.");
      setLoading(false);
      return;
    }

    /*
     * Load the contract and make sure it belongs
     * to the currently logged-in client.
     */
    const {
      data: contractData,
      error: contractError,
    } = await supabase
      .from("contracts")
      .select(
        `
        id,
        client_id,
        freelancer_id,
        project_title,
        status
      `
      )
      .eq("id", contractId)
      .eq("client_id", user.id)
      .maybeSingle();

    if (contractError) {
      console.error(
        "Contract review loading error:",
        contractError
      );

      setMessage(contractError.message);
      setLoading(false);
      return;
    }

    if (!contractData) {
      setMessage(
        "This contract could not be found or you do not have permission to review it."
      );

      setLoading(false);
      return;
    }

    const loadedContract =
      contractData as Contract;

    setContract(loadedContract);

    /*
     * Check whether this contract has already
     * received a review from this client.
     */
    const {
      data: existingReview,
      error: existingReviewError,
    } = await supabase
      .from("reviews")
      .select("id")
      .eq("contract_id", contractId)
      .eq("client_id", user.id)
      .maybeSingle();

    if (existingReviewError) {
      console.error(
        "Existing contract review error:",
        existingReviewError
      );
    }

    if (existingReview) {
      setAlreadyReviewed(true);
      setCanReview(false);
      setLoading(false);
      return;
    }

    /*
     * For this direct-hire workflow, the contract
     * should be completed before a review is allowed.
     */
    if (loadedContract.status === "completed") {
      setCanReview(true);
    } else {
      setCanReview(false);
    }

    setLoading(false);
  };

  const submitReview = async () => {
    setMessage("");

    if (!contract) {
      setMessage("Contract information is unavailable.");
      return;
    }

    if (!canReview) {
      setMessage(
        "You can only review this freelancer after the contract is completed."
      );
      return;
    }

    if (!contract.freelancer_id) {
      setMessage("Freelancer information is unavailable.");
      return;
    }

    if (!comment.trim()) {
      setMessage("Please write a review comment.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setMessage("Please select a rating from 1 to 5.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please login first.");
      return;
    }

    setSubmitting(true);

    /*
     * Final duplicate protection before insert.
     */
    const {
      data: existingReview,
      error: duplicateCheckError,
    } = await supabase
      .from("reviews")
      .select("id")
      .eq("contract_id", contractId)
      .eq("client_id", user.id)
      .maybeSingle();

    if (duplicateCheckError) {
      console.error(
        "Review duplicate check error:",
        duplicateCheckError
      );

      setMessage(duplicateCheckError.message);
      setSubmitting(false);
      return;
    }

    if (existingReview) {
      setAlreadyReviewed(true);
      setCanReview(false);
      setMessage(
        "You have already reviewed this freelancer for this contract."
      );
      setSubmitting(false);
      return;
    }

    /*
     * Direct-hire review:
     *
     * application_id stays NULL.
     * contract_id identifies the contract.
     */
    const { error: reviewError } = await supabase
      .from("reviews")
      .insert({
        contract_id: contractId,
        application_id: null,
        freelancer_id: contract.freelancer_id,
        client_id: user.id,
        rating,
        comment: comment.trim(),
      });

    if (reviewError) {
      console.error(
        "Contract review submission error:",
        reviewError
      );

      setMessage(reviewError.message);
      setSubmitting(false);
      return;
    }

    /*
     * Record activity.
     */
    await supabase
      .from("contract_activity")
      .insert({
        contract_id: contractId,
        action: `Client left a ${rating}-star review`,
      });

    /*
     * Notify the freelancer.
     */
    await supabase
      .from("notifications")
      .insert({
        user_id: contract.freelancer_id,
        title: "New Client Review",
        body: `You received a ${rating}-star review for ${
          contract.project_title || "a completed contract"
        }.`,
        link: `/freelancers/${contract.freelancer_id}`,
        is_read: false,
      });

    setMessage("Review submitted successfully!");
    setAlreadyReviewed(true);
    setCanReview(false);
    setSubmitting(false);

    setTimeout(() => {
      router.push(
        `/dashboard/contracts/${contractId}`
      );
    }, 1200);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!contract) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <h1>Contract Not Found</h1>

          <p>
            {message ||
              "This contract could not be loaded."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Review Freelancer
        </p>

        <h1>
          {contract.project_title ||
            "Project Review"}
        </h1>

        <p>
          Leave a professional rating and review
          for the freelancer after the contract
          has been completed.
        </p>
      </section>

      <section className="dark-card hire-card">

        {alreadyReviewed ? (
          <>
            <h2>Review Already Submitted</h2>

            <p>
              You have already reviewed this
              freelancer for this contract.
            </p>
          </>
        ) : !canReview ? (
          <>
            <h2>Review Not Available</h2>

            <p>
              This contract must be completed
              before you can leave a review.
            </p>
          </>
        ) : (
          <>
            <label className="form-label">
              Rating
            </label>

            <select
              value={rating}
              onChange={(e) =>
                setRating(Number(e.target.value))
              }
              className="form-input"
              disabled={submitting}
            >
              <option value={5}>
                ⭐⭐⭐⭐⭐ - Excellent
              </option>

              <option value={4}>
                ⭐⭐⭐⭐ - Very Good
              </option>

              <option value={3}>
                ⭐⭐⭐ - Good
              </option>

              <option value={2}>
                ⭐⭐ - Poor
              </option>

              <option value={1}>
                ⭐ - Very Poor
              </option>
            </select>

            <label className="form-label">
              Review Comment
            </label>

            <textarea
              placeholder="Share your experience working with this freelancer..."
              value={comment}
              onChange={(e) =>
                setComment(e.target.value)
              }
              className="form-input proposal-textarea"
              disabled={submitting}
            />

            <button
              type="button"
              onClick={submitReview}
              disabled={
                submitting ||
                !comment.trim()
              }
              className="primary-action-btn"
            >
              {submitting
                ? "Submitting..."
                : "Submit Review"}
            </button>
          </>
        )}

        {message && (
          <p
            className="upload-message"
            style={{ marginTop: 15 }}
          >
            {message}
          </p>
        )}

      </section>
    </main>
  );
}