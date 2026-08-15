"use client";

type Props = {
  demo?: boolean | null;
};

export default function DemoBadge({
  demo,
}: Props) {

  return demo ? (
    <span className="top-rated-badge">
      Demo
    </span>
  ) : (
    <span>
      Real
    </span>
  );
}