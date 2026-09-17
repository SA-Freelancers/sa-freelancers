"use client";

type Job = {
  id: string;

  title:
    | string
    | null;

  created_at:
    | string
    | null;
};

type Props = {
  jobs: Job[];
};

function formatDate(
  date: string | null
) {
  if (!date) {
    return "-";
  }

  return new Date(
    date
  ).toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default function RecentJobs({
  jobs,
}: Props) {
  return (
    <section className="dark-card admin-recent-card">
      <div>
        <h2>
          Recent Jobs
        </h2>

        <p
          style={{
            marginTop: 6,
            marginBottom: 18,
            opacity: 0.65,
            fontSize: 13,
          }}
        >
          Latest real jobs posted
          on Freelance Hub SA
        </p>
      </div>

      {/* DESKTOP TABLE */}

      <div className="admin-desktop-table">
        <table className="admin-recent-table">
          <thead>
            <tr>
              <th>
                Job
              </th>

              <th>
                Posted
              </th>
            </tr>
          </thead>

          <tbody>
            {jobs.map(
              (job) => (
                <tr
                  key={
                    job.id
                  }
                >
                  <td>
                    {job.title ||
                      "Untitled Job"}
                  </td>

                  <td>
                    {formatDate(
                      job.created_at
                    )}
                  </td>
                </tr>
              )
            )}

            {jobs.length ===
              0 && (
              <tr>
                <td
                  colSpan={2}
                  className="admin-empty-table"
                >
                  No recent jobs
                  found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}

      <div className="admin-mobile-list">
        {jobs.map(
          (job) => (
            <article
              key={
                job.id
              }
              className="admin-mobile-record"
            >
              <div className="admin-mobile-record-top">
                <strong>
                  {job.title ||
                    "Untitled Job"}
                </strong>
              </div>

              <div className="admin-mobile-record-row">
                <span>
                  Posted
                </span>

                <span>
                  {formatDate(
                    job.created_at
                  )}
                </span>
              </div>
            </article>
          )
        )}

        {jobs.length ===
          0 && (
          <div className="admin-empty-mobile">
            No recent jobs
            found.
          </div>
        )}
      </div>
    </section>
  );
}