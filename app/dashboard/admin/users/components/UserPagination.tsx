"use client";

type Props = {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
};

export default function UserPagination({
  page,
  totalPages,
  setPage,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 12,
        marginTop: 30,
      }}
    >
      <button
        className="accept-btn"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontWeight: 600,
        }}
      >
        Page {page} of {totalPages}
      </div>

      <button
        className="accept-btn"
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}