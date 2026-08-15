"use client";

type Props = {
  search: string;
  setSearch: (value: string) => void;

  role: string;
  setRole: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;
};

export default function UserFilters({
  search,
  setSearch,
  role,
  setRole,
  status,
  setStatus,
}: Props) {
  return (
    <div
      className="dark-card"
      style={{
        padding: 20,
        marginTop: 20,
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns:
            "2fr 1fr 1fr",
        }}
      >
        <input
          placeholder="Search user..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
        >
          <option value="all">
            All Roles
          </option>

          <option value="freelancer">
            Freelancer
          </option>

          <option value="client">
            Client
          </option>

          <option value="admin">
            Administrator
          </option>
        </select>

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="suspended">
            Suspended
          </option>
        </select>
      </div>
    </div>
  );
}