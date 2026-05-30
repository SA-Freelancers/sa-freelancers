"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Project = {
  id: string;
  title?: string;
  status?: string;
  budget?: number | string;
  category?: string;
  created_at?: string;
  applications?: {
    id: string;
  }[];
};
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setLoading(false);
      return;
    }

   const { data, error } = await supabase
  .from("jobs")
  .select(`
    *,
    applications (
      id
    )
  `)
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

  return (
    <main className="projects-page">
      <section className="projects-header dark-card">
        <div>
          <p className="dashboard-badge">Projects</p>

          <h1>Your Active Projects</h1>

          <p>Track progress, proposals and freelancer work.</p>
        </div>

        <Link href="/dashboard/jobs/new" className="primary-action-link">
          Post New Job
        </Link>
      </section>

      {message && <p className="search-message">{message}</p>}

      {projects.length === 0 ? (
        <EmptyState
          emoji="📁"
          title="No projects yet"
          description="Post your first job and start receiving freelancer proposals."
          buttonText="Post a Job"
          buttonLink="/dashboard/jobs/new"
        />
      ) : (
        <section className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="dark-card project-card">
              <div className="project-top">
                <div>
                  <h2>{project.title || "Untitled Project"}</h2>
                  <p>{project.category || "General"}</p>
                </div>

                <span className="project-status">
                  {project.status || "Open"}
                </span>
              </div>

              <p className="project-budget">
                ZAR {project.budget || "N/A"}
              </p>
              <p className="project-applications">
  {project.applications?.length || 0} proposal(s)
</p>

              <div className="project-progress">
                <div className="project-progress-bar" />
              </div>

              <Link
                href={`/dashboard/client/jobs/${project.id}/applications`}
                className="project-button"
              >
                View Applications
              </Link>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}