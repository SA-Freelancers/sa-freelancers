"use client";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function FreelancerPagination({
  page,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 10,
        marginTop: 30,
        flexWrap: "wrap",
      }}
    >
      <button
        className="accept-btn"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Previous
      </button>

      {Array.from(
        { length: totalPages },
        (_, index) => (
          <button
            key={index}
            className={
              page === index + 1
                ? "verified-btn"
                : "accept-btn"
            }
            onClick={() =>
              onPageChange(index + 1)
            }
          >
            {index + 1}
          </button>
        )
      )}

      <button
        className="accept-btn"
        disabled={page === totalPages}
        onClick={() =>
          onPageChange(page + 1)
        }
      >
        Next →
      </button>
    </div>
  );
}