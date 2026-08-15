"use client";

type Props = {
  search: string;
  setSearch: (value: string) => void;

  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;

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
  verifiedOnly,
  setVerifiedOnly,
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
      <input
        type="text"
        placeholder="Search freelancers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 20,
        }}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) =>
              setVerifiedOnly(e.target.checked)
            }
          />
          Verified
        </label>

        <label>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) =>
              setActiveOnly(e.target.checked)
            }
          />
          Active
        </label>

        <label>
          <input
            type="checkbox"
            checked={suspendedOnly}
            onChange={(e) =>
              setSuspendedOnly(e.target.checked)
            }
          />
          Suspended
        </label>

        <label>
          <input
            type="checkbox"
            checked={demoOnly}
            onChange={(e) =>
              setDemoOnly(e.target.checked)
            }
          />
          Demo
        </label>

        <label>
          <input
            type="checkbox"
            checked={topRatedOnly}
            onChange={(e) =>
              setTopRatedOnly(e.target.checked)
            }
          />
          Top Rated
        </label>
      </div>
    </section>
  );
}