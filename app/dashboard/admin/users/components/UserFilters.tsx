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
    <section className="dark-card" style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          gap: 15,
          flexWrap: "wrap",
        }}
      >
        <input
          className="profile-input"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="profile-input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="freelancer">Freelancers</option>
          <option value="client">Clients</option>
          <option value="admin">Administrators</option>
        </select>

        <select
          className="profile-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="demo">Demo</option>
          <option value="real">Real</option>
        </select>
      </div>
    </section>
  );
}