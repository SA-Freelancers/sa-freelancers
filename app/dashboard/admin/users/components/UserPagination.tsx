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
        className="accept-btn"
        disabled={page === 1}
        onClick={() =>
          setPage(page - 1)
        }
      >
        Previous
      </button>

      <span
        style={{
          paddingTop: 10,
        }}
      >
        Page {page} of {totalPages}
      </span>

      <button
        className="accept-btn"
        disabled={page === totalPages}
        onClick={() =>
          setPage(page + 1)
        }
      >
        Next
      </button>
    </div>
  );
}