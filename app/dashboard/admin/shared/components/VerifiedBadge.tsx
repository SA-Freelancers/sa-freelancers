"use client";

type Props = {
  verified?: boolean | null;
};

export default function VerifiedBadge({
  verified,
}: Props) {

  return verified ? (
    <span className="verified-badge">
      ✔ Verified
    </span>
  ) : (
    <span
      style={{
        opacity: .6,
      }}
    >
      Not Verified
    </span>
  );
}