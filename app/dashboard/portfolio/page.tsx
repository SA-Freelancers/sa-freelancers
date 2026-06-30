"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type PortfolioProject = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  software?: string;
  image_url?: string;
  project_url?: string;
  created_at?: string;
};

export default function PortfolioPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [software, setSoftware] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("freelancer_id", user.id)
      .order("created_at", { ascending: false });

    setProjects((data as PortfolioProject[]) || []);
    setLoading(false);
  };

  const addProject = async () => {
    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter a project title.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setSaving(false);
      return;
    }

    let imageUrl = "";

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-images")
        .upload(filePath, imageFile, {
          upsert: true,
        });

      if (uploadError) {
        setMessage(uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("portfolio-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("portfolio_projects").insert({
      freelancer_id: user.id,
      title,
      description,
      category,
      software,
      image_url: imageUrl,
      project_url: projectUrl,
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Portfolio project added successfully.");
    setTitle("");
    setDescription("");
    setCategory("");
    setSoftware("");
    setProjectUrl("");
    setImageFile(null);
    setSaving(false);
    loadProjects();
  };

  const deleteProject = async (id: string) => {
    const confirmDelete = confirm("Delete this portfolio project?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("portfolio_projects")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Portfolio project deleted.");
    loadProjects();
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="dashboard-page">
      <section className="dark-card">
        <p className="dashboard-badge">Portfolio</p>
        <h1>Portfolio Manager</h1>
        <p>
          Add your best projects so clients can see your skills, software
          experience and previous work.
        </p>
      </section>

      <section className="profile-settings-layout" style={{ marginTop: 24 }}>
        <div className="dark-card profile-settings-card">
          <h2>Add Portfolio Project</h2>

          <label className="form-label">Project Title</label>
          <input
            className="form-input"
            placeholder="Example: Conveyor Frame Design"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="form-label">Description</label>
          <textarea
            className="form-input profile-textarea"
            placeholder="Describe the project, your role, and the result..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="form-label">Category</label>
          <input
            className="form-input"
            placeholder="Example: CAD Drafting"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <label className="form-label">Software Used</label>
          <input
            className="form-input"
            placeholder="Example: SolidWorks, Inventor, AutoCAD"
            value={software}
            onChange={(e) => setSoftware(e.target.value)}
          />

          <label className="form-label">Project Link Optional</label>
          <input
            className="form-input"
            placeholder="https://..."
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
          />

          <label className="form-label">Project Image</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="form-input"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          <button
            onClick={addProject}
            disabled={saving}
            className="primary-action-btn"
          >
            {saving ? "Saving..." : "Add Project"}
          </button>

          {message && <p className="upload-message">{message}</p>}
        </div>

        <div className="dark-card profile-preview-card">
          <h2>My Portfolio Projects</h2>

          {projects.length === 0 ? (
            <EmptyState
              emoji="🖼️"
              title="No portfolio projects yet"
              description="Add your best work to build trust with clients."
            />
          ) : (
            <div className="portfolio-list">
              {projects.map((project) => (
                <div key={project.id} className="portfolio-card">
                  {project.image_url && (
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="portfolio-image"
                    />
                  )}

                  <h3>{project.title}</h3>
                  <p>{project.description || "No description added."}</p>

                  <div className="marketplace-badges">
                    {project.category && (
                      <span className="marketplace-badge">
                        {project.category}
                      </span>
                    )}

                    {project.software && (
                      <span className="verified-badge">
                        {project.software}
                      </span>
                    )}
                  </div>

                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noreferrer"
                      className="primary-action-link"
                    >
                      View Project
                    </a>
                  )}

                  <button
                    onClick={() => deleteProject(project.id)}
                    className="reject-btn"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}