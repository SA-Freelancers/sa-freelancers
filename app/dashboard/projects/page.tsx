"use client";

import EmptyState from "@/app/components/EmptyState";
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
    } = await supabase.auth.getUser();

    if (!user) {
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

  const updateProjectStatus = async (projectId: string, status: string) => {
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
        project.id === projectId ? { ...project, status } : project
      )
    );
  };

  if (loading) return <p>Loading projects...</p>;

  return (
    <div>
      <section className="hero-section" style={hero}>
        <h1>Projects</h1>
        <p>Track active work, payments, messages, and completion status.</p>
      </section>

      {message && <p>{message}</p>}

   {projects.length === 0 && (
  <EmptyState
    emoji="📌"
    title="No projects yet"
    description="Projects appear after a client accepts a freelancer application."
    buttonText="Browse Jobs"
    buttonLink="/dashboard/jobs"
  />
)}

      <div style={grid}>
        {projects.map((project) => (
          <div key={project.id} className="dark-card" style={card}>
            <span style={statusBadge(project.status)}>
              {project.status || "active"}
            </span>

            <h2>{project.jobs?.title || "Project"}</h2>

            <p>
              <strong>Category:</strong> {project.jobs?.category || "N/A"}
            </p>

            <p>
              <strong>Budget:</strong> ZAR {project.jobs?.budget || "N/A"}
            </p>

            <p>
              <strong>Payment:</strong>{" "}
              <span style={paymentBadge(project.payment_status)}>
                {project.payment_status || "unpaid"}
              </span>
            </p>

            <div style={actions}>
              <Link
                href={`/dashboard/messages/${project.application_id}`}
                style={blueBtn}
              >
                Messages
              </Link>

              {project.payment_status !== "paid" && (
                <Link
                  href={`/dashboard/payment/${project.id}`}
                  style={greenLink}
                >
                  Pay Now
                </Link>
              )}

              <button
                onClick={() => updateProjectStatus(project.id, "completed")}
                style={greenBtn}
              >
                Complete
              </button>

              <button
                onClick={() => updateProjectStatus(project.id, "cancelled")}
                style={redBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 22,
};

const card = {
  padding: 24,
  borderRadius: 18,
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const emptyCard = {
  padding: 30,
  borderRadius: 18,
};

const actions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
  marginTop: 20,
};

const blueBtn = {
  padding: "10px 14px",
  background: "#2563eb",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
};

const greenLink = {
  padding: "10px 14px",
  background: "#16a34a",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
};

const greenBtn = {
  padding: "10px 14px",
  background: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
};

const redBtn = {
  padding: "10px 14px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
};

const statusBadge = (status: string) => ({
  display: "inline-block",
  background:
    status === "completed"
      ? "#dcfce7"
      : status === "cancelled"
      ? "#fee2e2"
      : "#dbeafe",
  color:
    status === "completed"
      ? "#166534"
      : status === "cancelled"
      ? "#991b1b"
      : "#1d4ed8",
  padding: "6px 10px",
  borderRadius: 20,
  fontWeight: "bold",
  fontSize: 13,
});

const paymentBadge = (status: string) => ({
  color: status === "paid" ? "#22c55e" : "#f87171",
  fontWeight: "bold",
});