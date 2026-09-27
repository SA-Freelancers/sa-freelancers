"use client";

type Props = {
  search: string;
  setSearch: (value: string) => void;

  activeOnly: boolean;
  setActiveOnly: (value: boolean) => void;

  suspendedOnly: boolean;
  setSuspendedOnly: (value: boolean) => void;

  demoOnly: boolean;
  setDemoOnly: (value: boolean) => void;

  topRatedOnly: boolean;
  setTopRatedOnly: (value: boolean) => void;
};

export default function FreelancerFilters({
  search,
  setSearch,
  activeOnly,
  setActiveOnly,
  suspendedOnly,
  setSuspendedOnly,
  demoOnly,
  setDemoOnly,
  topRatedOnly,
  setTopRatedOnly,
}: Props) {
  return (
    <section
      className="dark-card"
      style={{
        padding: 20,
        marginBottom: 25,
      }}
    >
      {/* SEARCH */}

      <input
        type="text"
        placeholder="Search freelancers..."
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 20,
        }}
      />

      {/* FILTERS */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "center",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) =>
              setActiveOnly(
                event.target.checked
              )
            }
          />

          Active
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={suspendedOnly}
            onChange={(event) =>
              setSuspendedOnly(
                event.target.checked
              )
            }
          />

          Suspended
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={topRatedOnly}
            onChange={(event) =>
              setTopRatedOnly(
                event.target.checked
              )
            }
          />

          Top Rated
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={demoOnly}
            onChange={(event) =>
              setDemoOnly(
                event.target.checked
              )
            }
          />

          Demo
        </label>
      </div>
    </section>
  );
}