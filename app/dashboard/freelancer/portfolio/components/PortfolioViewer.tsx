"use client";

import { useState } from "react";

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
  project: PortfolioProject | null;
  onClose: () => void;
};

export default function PortfolioViewer({
  project,
  onClose,
}: Props) {
  const [currentImage, setCurrentImage] = useState(0);

  if (!project) return null;

  const images = project.images ?? [];

  function previous() {
    if (!images.length) return;

    setCurrentImage((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  }

  function next() {
    if (!images.length) return;

    setCurrentImage((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  }

  return (
    <div className="dark-card">

      <button
        className="reject-btn"
        onClick={onClose}
      >
        Close
      </button>

      <h1>{project.title}</h1>

      {project.featured && (
        <span className="verified-badge">
          ⭐ Featured Project
        </span>
      )}

      {images.length > 0 && (
        <>
          <img
            src={images[currentImage]}
            alt={project.title}
            style={{
              width: "100%",
              borderRadius: 10,
              marginTop: 20,
            }}
          />

          {images.length > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 15,
              }}
            >
              <button
                className="accept-btn"
                onClick={previous}
              >
                ◀ Previous
              </button>

              <button
                className="accept-btn"
                onClick={next}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}

      <h3>Description</h3>

      <p>{project.description}</p>

      <h3>Category</h3>

      <p>{project.category}</p>

      <h3>Client</h3>

      <p>{project.client_name}</p>

      <h3>Completed</h3>

      <p>{project.completed_at}</p>

      <h3>Skills</h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {project.skills?.map((skill) => (
          <span
            key={skill}
            className="verified-badge"
          >
            {skill}
          </span>
        ))}
      </div>

      {project.project_url && (
        <>
          <h3>Website</h3>

          <a
            href={project.project_url}
            target="_blank"
            rel="noreferrer"
          >
            Visit Project
          </a>
        </>
      )}

      {project.video_url && (
        <>
          <h3>Video</h3>

          <a
            href={project.video_url}
            target="_blank"
            rel="noreferrer"
          >
            Watch Video
          </a>
        </>
      )}

    </div>
  );
}