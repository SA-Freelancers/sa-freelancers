"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Project = {
  id: string;
  job_id?: string;
  application_id?: string;
  client_id?: string;
  freelancer_id?: string;
  status?: string;
  payment_status?: string;
  created_at?: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "client") {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setProjects((data as Project[]) || []);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Client Area</p>
          <h1>Access Restricted</h1>
          <p>Only clients can access project management.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Projects</p>

        <h1>Your Active Projects</h1>

        <p>
          Track hired freelancers, project progress and payment status from your
          client workspace.
        </p>

        <div style={{ marginTop: 20 }}>
          <Link href="/dashboard/post-job" className="primary-action-link">
            Post New Job
          </Link>
        </div>
      </section>

      {message && <p className="upload-message">{message}</p>}

      {projects.length === 0 ? (
        <EmptyState
          emoji="📁"
          title="No projects yet"
          description="Projects will appear here after you hire freelancers."
          buttonText="Post New Job"
          buttonLink="/dashboard/post-job"
        />
      ) : (
        <section className="contracts-grid">
          {projects.map((project) => (
            <div key={project.id} className="dark-card contract-card">
              <div className="contract-top">
                <h2>Project</h2>

                <span className={`contract-status ${project.status || "active"}`}>
                  {project.status || "active"}
                </span>
              </div>

              <p>
                <strong>Job ID:</strong>
                <br />
                {project.job_id || "N/A"}
              </p>

              <p>
                <strong>Freelancer ID:</strong>
                <br />
                {project.freelancer_id || "N/A"}
              </p>

              <p className="contract-budget">
                Payment Status: {project.payment_status || "unpaid"}
              </p>

              <div className="contract-actions">
                {project.job_id && (
                  <Link
                    href={`/dashboard/jobs/${project.job_id}`}
                    className="primary-action-link"
                  >
                    View Job
                  </Link>
                )}

                {project.application_id && (
                  <Link
                    href={`/dashboard/messages/${project.application_id}`}
                    className="primary-action-link"
                  >
                    Message Freelancer
                  </Link>
                )}

                {project.freelancer_id && (
                  <Link
                    href={`/freelancers/${project.freelancer_id}`}
                    className="primary-action-link"
                  >
                    View Freelancer
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}