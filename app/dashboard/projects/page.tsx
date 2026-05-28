"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please login first.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        jobs (
          title,
          budget,
          category
        )
      `)
      .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setProjects(data || []);
    setLoading(false);
  };

  const updateProjectStatus = async (
    projectId: string,
    status: string
  ) => {
    const { error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", projectId);

    if (error) {
      alert(error.message);
      return;
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, status }
          : project
      )
    );
  };

  if (loading) {
    return <p style={{ padding: 20 }}>Loading projects...</p>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto" }}>
      <h1>Projects</h1>

      {message && <p>{message}</p>}

      {projects.length === 0 && <p>No projects yet.</p>}

      {projects.map((project) => (
        <div
          key={project.id}
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 10,
            border: "1px solid #ddd",
            marginBottom: 20,
          }}
        >
          <h2>{project.jobs?.title || "Project"}</h2>

          <p>
            <strong>Category:</strong> {project.jobs?.category || "N/A"}
          </p>

          <p>
            <strong>Budget:</strong> ZAR {project.jobs?.budget || "N/A"}
          </p>

          <p>
            <strong>Status:</strong> {project.status}
          </p>

          <p>
            <strong>Payment:</strong>{" "}
            {project.payment_status || "unpaid"}
          </p>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() =>
                updateProjectStatus(project.id, "completed")
              }
              style={{
                padding: "10px 14px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                borderRadius: 6,
              }}
            >
              Mark Completed
            </button>

            <button
              onClick={() =>
                updateProjectStatus(project.id, "cancelled")
              }
              style={{
                padding: "10px 14px",
                backgroundColor: "red",
                color: "white",
                border: "none",
                borderRadius: 6,
              }}
            >
              Cancel Project
            </button>

            <Link
              href={`/dashboard/messages/${project.application_id}`}
              style={{
                padding: "10px 14px",
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: 6,
                textDecoration: "none",
              }}
            >
              Open Messages
            </Link>

            {project.payment_status !== "paid" && (
              <Link
                href={`/dashboard/payment/${project.id}`}
                style={{
                  padding: "10px 14px",
                  backgroundColor: "green",
                  color: "white",
                  borderRadius: 6,
                  textDecoration: "none",
                }}
              >
                Pay Now
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}