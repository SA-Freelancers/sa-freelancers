"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

import { usePortfolio } from "@/app/lib/hooks/usePortfolio";

import PortfolioGrid from "./components/PortfolioGrid";
import PortfolioEditor from "./components/PortfolioEditor";
import PortfolioViewer from "./components/PortfolioViewer";

type PortfolioProject = {
  id?: string;
  freelancer_id?: string;

  title?: string;
  description?: string;
  category?: string;
  client_name?: string;

  completed_at?: string;

  project_url?: string;
  video_url?: string;

  featured?: boolean;

  skills?: string[];

  images?: string[];
};

export default function PortfolioPage() {
  const [userId, setUserId] = useState("");

  const [editingProject, setEditingProject] =
    useState<PortfolioProject | null>(null);

  const [viewingProject, setViewingProject] =
    useState<PortfolioProject | null>(null);

  const [message, setMessage] = useState("");

  const {
    projects,
    loading,
    create,
    update,
    remove,
  } = usePortfolio(userId);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
      }
    }

    loadUser();
  }, []);

  async function saveProject(
    values: PortfolioProject
  ) {
    setMessage("");

    if (!userId) {
      setMessage(
        "Unable to identify your account. Please log in again."
      );
      return;
    }

    try {
      if (editingProject?.id) {
        const result = await update(
          editingProject.id,
          {
            ...values,
            freelancer_id: userId,
          }
        );

        if (result?.error) {
          setMessage(result.error.message);
          return;
        }
      } else {
        const result = await create({
          ...values,
          freelancer_id: userId,
        });

        if (result?.error) {
          setMessage(result.error.message);
          return;
        }
      }

      setEditingProject(null);

      setMessage(
        editingProject?.id
          ? "Portfolio project updated successfully."
          : "Portfolio project created successfully."
      );
    } catch (error) {
      console.error(
        "Portfolio save error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save portfolio project."
      );
    }
  }

  async function deleteProject(
    project: PortfolioProject
  ) {
    if (!project.id) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this project?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      const result = await remove(project.id);

      if (result?.error) {
        setMessage(result.error.message);
        return;
      }

      setMessage(
        "Portfolio project deleted successfully."
      );
    } catch (error) {
      console.error(
        "Portfolio delete error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete portfolio project."
      );
    }
  }

  if (!userId) {
    return (
      <main className="contracts-page">
        <section className="dark-card">
          <h2>Loading Portfolio...</h2>
          <p>
            Loading your freelancer account.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Freelancer
        </p>

        <h1>Portfolio</h1>

        <p>
          Showcase your best work to clients.
        </p>
      </section>

      {message && (
        <section
          className="dark-card"
          style={{
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <p className="upload-message">
            {message}
          </p>
        </section>
      )}

      <div
        style={{
          marginTop: 30,
          marginBottom: 30,
        }}
      >
        <button
          type="button"
          className="accept-btn"
          onClick={() => {
            setMessage("");
            setEditingProject({});
          }}
        >
          + Add Project
        </button>
      </div>

      {loading ? (
        <div className="dark-card">
          <h2>Loading Portfolio...</h2>
        </div>
      ) : projects.length === 0 ? (
        <div className="dark-card">
          <h2>No portfolio projects yet</h2>

          <p>
            Add your first project to showcase
            your work to clients.
          </p>
        </div>
      ) : (
        <PortfolioGrid
          projects={projects}
          onEdit={(project: PortfolioProject) =>
            setEditingProject(project)
          }
          onDelete={deleteProject}
          onView={(project: PortfolioProject) =>
            setViewingProject(project)
          }
        />
      )}

      {editingProject && (
        <div
          style={{
            marginTop: 40,
          }}
        >
          <PortfolioEditor
  freelancerId={userId}
  initialValues={
    editingProject.id
      ? editingProject
      : undefined
  }
  onSave={saveProject}
  onCancel={() =>
    setEditingProject(null)
  }
/>
        </div>
      )}

      <PortfolioViewer
        project={viewingProject}
        onClose={() =>
          setViewingProject(null)
        }
      />
    </main>
  );
}