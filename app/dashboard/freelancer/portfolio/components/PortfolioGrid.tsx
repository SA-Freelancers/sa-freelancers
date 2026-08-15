"use client";

import PortfolioCard from "./PortfolioCard";

type Props = {
  projects: any[];
  onView: (project: any) => void;
  onEdit: (project: any) => void;
  onDelete: (project: any) => void;
};

export default function PortfolioGrid({
  projects,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
        gridTemplateColumns:
          "repeat(auto-fill,minmax(350px,1fr))",
      }}
    >
      {projects.map((project) => (
        <PortfolioCard
          key={project.id}
          project={project}
          onView={() => onView(project)}
          onEdit={() => onEdit(project)}
          onDelete={() => onDelete(project)}
        />
      ))}
    </div>
  );
}