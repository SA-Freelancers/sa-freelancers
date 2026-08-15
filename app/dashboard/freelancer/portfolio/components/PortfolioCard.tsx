"use client";

type Props = {
  project: any;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function PortfolioCard({
  project,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="dark-card">

      {project.images?.length > 0 && (
        <img
          src={project.images[0]}
          style={{
            width: "100%",
            height: 220,
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      )}

      <h2>{project.title}</h2>

      <p>{project.description}</p>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
        }}
      >

        <button
          className="accept-btn"
          onClick={onView}
        >
          View
        </button>

        <button
          className="accept-btn"
          onClick={onEdit}
        >
          Edit
        </button>

        <button
          className="reject-btn"
          onClick={onDelete}
        >
          Delete
        </button>

      </div>

    </div>
  );
}