"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Application = {
  id: string;
  freelancer_id?: string;
  job_id?: string;
  status?: string;
};

type Project = {
  id: string;
  status?: string;
  payment_status?: string;
  client_id?: string;
};

export default function ReviewPage() {
  const params = useParams();
  const applicationId = params.applicationId as string;

  const [application, setApplication] =
    useState<Application | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    if (applicationId) {
      loadReviewAccess();
    }
  }, [applicationId]);

  const loadReviewAccess = async () => {
    setLoading(true);
    setMessage("");

    try {
      // --------------------------------------------------
      // GET CURRENT USER
      // --------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("Please login first.");
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // LOAD APPLICATION
      // --------------------------------------------------

      const {
        data: appData,
        error: applicationError,
      } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (applicationError || !appData) {
        console.error(
          "Application loading error:",
          applicationError
        );

        setMessage("Application not found.");
        setLoading(false);
        return;
      }

      setApplication(appData as Application);

      // --------------------------------------------------
      // MAKE SURE FREELANCER EXISTS
      // --------------------------------------------------

      if (!appData.freelancer_id) {
        setMessage("Freelancer not found.");
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
          "id, status, payment_status, client_id"
        )
        .eq("application_id", applicationId)
        .eq("client_id", user.id)
        .maybeSingle();

      if (projectError) {
        console.error(
          "Review project loading error:",
          projectError
        );
      }

      // --------------------------------------------------
      // CHECK REVIEW ACCESS
      // --------------------------------------------------

      if (
        project &&
        (
          project.status === "completed" ||
          project.payment_status === "paid"
        )
      ) {
        setCanReview(true);
      } else {
        setCanReview(false);
      }
    } catch (error) {
      console.error(
        "Review access error:",
        error
      );

      setMessage(
        "Unable to check review access."
      );
    }

    setLoading(false);
  };

  // --------------------------------------------------
  // SUBMIT REVIEW
  // --------------------------------------------------

  const submitReview = async () => {
    setMessage("");

    if (!canReview) {
      setMessage(
        "You can only review after the project is completed or paid."
      );
      return;
    }

    if (!application) {
      setMessage(
        "Application information is unavailable."
      );
      return;
    }

    if (!application.freelancer_id) {
      setMessage("Freelancer not found.");
      return;
    }

    if (!comment.trim()) {
      setMessage(
        "Please write a short review comment."
      );
      return;
    }

    // --------------------------------------------------
    // GET CURRENT USER
    // --------------------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please login first.");
      return;
    }

    // --------------------------------------------------
    // CHECK FOR EXISTING REVIEW
    // --------------------------------------------------

    const {
      data: existingReview,
      error: existingReviewError,
    } = await supabase
      .from("reviews")
      .select("id")
      .eq("application_id", applicationId)
      .eq("client_id", user.id)
      .maybeSingle();

    if (existingReviewError) {
      console.error(
        "Existing review check error:",
        existingReviewError
      );

      setMessage(
        existingReviewError.message ||
          "Unable to check existing reviews."
      );

      return;
    }

    if (existingReview) {
      setMessage(
        "You have already reviewed this freelancer."
      );
      return;
    }

    // --------------------------------------------------
    // SUBMIT REVIEW
    // --------------------------------------------------

    setSubmitting(true);

    const {
      error: reviewError,
    } = await supabase
      .from("reviews")
      .insert({
        application_id: applicationId,

        // Current logged-in client
        client_id: user.id,

        // Freelancer from the application
        freelancer_id:
          application.freelancer_id,

        rating,
        comment: comment.trim(),
      });

    if (reviewError) {
      console.error(
        "Review submission error:",
        reviewError
      );

      setMessage(
        reviewError.message ||
          "Unable to submit review."
      );

      setSubmitting(false);
      return;
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    setMessage(
      "Review submitted successfully!"
    );

    setComment("");
    setRating(5);
    setSubmitting(false);
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return <LoadingSkeleton />;
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="contracts-page">

      <section className="contracts-header dark-card">

        <p className="dashboard-badge">
          Review
        </p>

        <h1>
          Leave a Review
        </h1>

        <p>
          Rate the freelancer after the
          project is completed or payment
          has been made.
        </p>

      </section>

      <section className="dark-card contract-card">

        {!canReview && (
          <p className="upload-message">
            Reviews are only available after
            a project is completed or paid.
          </p>
        )}

        {canReview && (
          <>
            <label className="form-label">
              Rating
            </label>

            <select
              value={rating}
              onChange={(e) =>
                setRating(
                  Number(e.target.value)
                )
              }
              className="form-input"
              disabled={submitting}
            >
              <option value={5}>
                ⭐⭐⭐⭐⭐ 5 Stars
              </option>

              <option value={4}>
                ⭐⭐⭐⭐ 4 Stars
              </option>

              <option value={3}>
                ⭐⭐⭐ 3 Stars
              </option>

              <option value={2}>
                ⭐⭐ 2 Stars
              </option>

              <option value={1}>
                ⭐ 1 Star
              </option>
            </select>

            <label className="form-label">
              Review Comment
            </label>

            <textarea
              placeholder="Write your review..."
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
                ? "Submitting Review..."
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