"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Job = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  budget?: number | string;
  client_id?: string;
  created_at?: string;
};

type AcceptedInvitation = {
  id: string;
  job_id: string;
  client_id: string;
  freelancer_id: string;
  status: "accepted";
  created_at?: string;
  responded_at?: string | null;
  job?: {
    id: string;
    title?: string;
    budget?: number | string;
    category?: string;
  };
  freelancer?: {
    id: string;
    full_name?: string;
    headline?: string;
  };
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [acceptedInvitations, setAcceptedInvitations] = useState<
    AcceptedInvitation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Client profile loading error:", profileError);
      setAllowed(false);
      setLoading(false);
      return;
    }

    if (profile?.role !== "client") {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    const [jobsResult, invitationsResult] = await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("job_invitations")
        .select(
          "id, job_id, client_id, freelancer_id, status, created_at, responded_at"
        )
        .eq("client_id", user.id)
        .eq("status", "accepted")
        .order("responded_at", { ascending: false }),
    ]);

    if (jobsResult.error) {
      console.error("Jobs loading error:", jobsResult.error);
      setMessage(jobsResult.error.message);
      setJobs([]);
    } else {
      setJobs((jobsResult.data as Job[]) || []);
    }

    if (invitationsResult.error) {
      console.error(
        "Accepted invitations loading error:",
        invitationsResult.error
      );
      setAcceptedInvitations([]);
      setLoading(false);
      return;
    }

    const invitationRows =
      (invitationsResult.data as AcceptedInvitation[]) || [];

    if (invitationRows.length === 0) {
      setAcceptedInvitations([]);
      setLoading(false);
      return;
    }

    const jobIds = Array.from(
      new Set(invitationRows.map((item) => item.job_id).filter(Boolean))
    );

    const freelancerIds = Array.from(
      new Set(
        invitationRows.map((item) => item.freelancer_id).filter(Boolean)
      )
    );

    const [invitationJobsResult, freelancersResult] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, title, budget, category")
        .in("id", jobIds),

      supabase
        .from("profiles")
        .select("id, full_name, headline")
        .in("id", freelancerIds),
    ]);

    if (invitationJobsResult.error) {
      console.error(
        "Invitation jobs loading error:",
        invitationJobsResult.error
      );
    }

    if (freelancersResult.error) {
      console.error(
        "Invitation freelancers loading error:",
        freelancersResult.error
      );
    }

    const jobsMap = new Map(
      (
        (invitationJobsResult.data as {
          id: string;
          title?: string;
          budget?: number | string;
          category?: string;
        }[]) || []
      ).map((job) => [job.id, job])
    );

    const freelancersMap = new Map(
      (
        (freelancersResult.data as {
          id: string;
          full_name?: string;
          headline?: string;
        }[]) || []
      ).map((freelancer) => [freelancer.id, freelancer])
    );

    setAcceptedInvitations(
      invitationRows.map((invitation) => ({
        ...invitation,
        job: jobsMap.get(invitation.job_id),
        freelancer: freelancersMap.get(invitation.freelancer_id),
      }))
    );

    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Client Area</p>
          <h1>Access Restricted</h1>
          <p>Only clients can access the Jobs Dashboard.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Client Jobs</p>

        <h1>My Posted Jobs</h1>

        <p>
          Manage jobs you created, review freelancer applications and follow up
          on accepted invitations.
        </p>

        <div style={{ marginTop: 20 }}>
          <Link href="/dashboard/post-job" className="primary-action-link">
            Post New Job
          </Link>
        </div>
      </section>

      {message && <p className="upload-message">{message}</p>}

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 18 }}>Accepted Invitations</h2>

        {acceptedInvitations.length === 0 ? (
          <EmptyState
            emoji="🤝"
            title="No accepted invitations yet"
            description="When a freelancer accepts one of your direct job invitations, it will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {acceptedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="dark-card contract-card"
              >
                <div className="contract-top">
                  <h2>
                    {invitation.job?.title || "Accepted Job Invitation"}
                  </h2>

                  <span className="contract-status accepted">
                    Accepted
                  </span>
                </div>

                <p style={{ marginBottom: 8 }}>
                  <strong>Freelancer:</strong>{" "}
                  {invitation.freelancer?.full_name || "Freelancer"}
                </p>

                {invitation.freelancer?.headline && (
                  <p
                    className="contract-description"
                    style={{ marginTop: 0 }}
                  >
                    {invitation.freelancer.headline}
                  </p>
                )}

                {invitation.job?.category && (
                  <p style={{ marginBottom: 8 }}>
                    <strong>Category:</strong>{" "}
                    {invitation.job.category}
                  </p>
                )}

                <p className="contract-budget">
                  Budget: R
                  {Number(
                    invitation.job?.budget || 0
                  ).toLocaleString("en-ZA")}
                </p>

                <div className="contract-actions">
                  <Link
                    href={`/freelancers/${invitation.freelancer_id}`}
                    className="primary-action-link"
                  >
                    View Freelancer
                  </Link>

                  <Link
                    href={`/dashboard/jobs/${invitation.job_id}`}
                    className="primary-action-link"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ marginBottom: 18 }}>Posted Jobs</h2>

        {jobs.length === 0 ? (
          <EmptyState
            emoji="💼"
            title="No jobs posted yet"
            description="Create your first job to start receiving freelancer proposals."
            buttonText="Post Job"
            buttonLink="/dashboard/post-job"
          />
        ) : (
          <div className="contracts-grid">
            {jobs.map((job) => (
              <div key={job.id} className="dark-card contract-card">
                <div className="contract-top">
                  <h2>{job.title || "Untitled Job"}</h2>

                  <span className="marketplace-badge">
                    {job.category || "General"}
                  </span>
                </div>

                <p className="contract-description">
                  {job.description?.slice(0, 160) ||
                    "No description provided."}
                </p>

                <p className="contract-budget">
                  Budget: R
                  {Number(job.budget || 0).toLocaleString("en-ZA")}
                </p>

                <div className="contract-actions">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="primary-action-link"
                  >
                    View Job
                  </Link>

                  <Link
                    href={`/dashboard/client/jobs/${job.id}/applications`}
                    className="primary-action-link"
                  >
                    Applications
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
