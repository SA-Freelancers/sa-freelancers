"use client";

type Props = {
  page: number;

  totalPages: number;

  onPageChange: (
    page: number
  ) => void;
};

export default function AdminPagination({
  page,
  totalPages,
  onPageChange,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 15,

        marginTop: 25,
      }}
    >
      <button
        className="reject-btn"
        disabled={page === 1}
        onClick={() =>
          onPageChange(page - 1)
        }
      >
        Previous
      </button>

      <strong>
        {page} / {totalPages}
      </strong>

      <button
        className="accept-btn"
        disabled={page >= totalPages}
        onClick={() =>
          onPageChange(page + 1)
        }
      >
        Next
      </button>
    </div>
  );
}