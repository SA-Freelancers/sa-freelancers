"use client";

import { useState } from "react";
import PortfolioUpload from "./PortfolioUpload";

type PortfolioProject = {
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

type Props = {
  freelancerId: string;
  initialValues?: PortfolioProject;
  onSave: (values: PortfolioProject) => void;
  onCancel: () => void;
};

export default function PortfolioEditor({
  freelancerId,
  initialValues,
  onSave,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [category, setCategory] = useState(
    initialValues?.category ?? ""
  );
  const [clientName, setClientName] = useState(
    initialValues?.client_name ?? ""
  );
  const [completedAt, setCompletedAt] = useState(
    initialValues?.completed_at ?? ""
  );
  const [projectUrl, setProjectUrl] = useState(
    initialValues?.project_url ?? ""
  );
  const [videoUrl, setVideoUrl] = useState(
    initialValues?.video_url ?? ""
  );
  const [featured, setFeatured] = useState(
    initialValues?.featured ?? false
  );

  const [skills, setSkills] = useState(
    initialValues?.skills?.join(", ") ?? ""
  );

  const [images, setImages] = useState<string[]>(
    initialValues?.images ?? []
  );

  function save() {
    onSave({
      title,
      description,
      category,
      client_name: clientName,
      completed_at: completedAt,
      project_url: projectUrl,
      video_url: videoUrl,
      featured,
      images,
      skills: skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="dark-card">

      <h2>Portfolio Project</h2>

      <input
        placeholder="Project Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Project Description"
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <input
        placeholder="Client Name"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
      />

      <input
        type="date"
        value={completedAt}
        onChange={(e) => setCompletedAt(e.target.value)}
      />

      <input
        placeholder="Project Website"
        value={projectUrl}
        onChange={(e) => setProjectUrl(e.target.value)}
      />

      <input
        placeholder="YouTube Video URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />

      <input
        placeholder="Skills (comma separated)"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
      />

      <PortfolioUpload
        freelancerId={freelancerId}
        images={images}
        onImagesChanged={setImages}
      />

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 20,
        }}
      >
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
        />

        Featured Project
      </label>

      <div
        style={{
          display: "flex",
          gap: 15,
          marginTop: 25,
        }}
      >
        <button
          className="accept-btn"
          onClick={save}
        >
          Save Project
        </button>

        <button
          className="reject-btn"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

    </div>
  );
}