"use client";

type Props = {
  active?: boolean;
};

export default function StatusBadge({
  active,
}: Props) {
  if (active) {
    return (
      <span className="accept-btn">
        Active
      </span>
    );
  }

  return (
    <span className="reject-btn">
      Suspended
    </span>
  );
}