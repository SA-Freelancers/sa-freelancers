"use client";

type Props = {
  title: string;
  description?: string;
};

export default function EmptyState({
  title,
  description,
}: Props) {
  return (
    <div
      className="dark-card"
      style={{
        padding: 50,
        textAlign: "center",
      }}
    >
      <h2>{title}</h2>

      {description && (
        <p>{description}</p>
      )}
    </div>
  );
}