"use client";

type Job = {
  id: string;

  title: string;

  budget:
    | number
    | null;

  status:
    | string
    | null;

  created_at:
    | string
    | null;

  profiles?: {
    full_name:
      | string
      | null;
  } | null;
};

type Props = {
  jobs: Job[];
};

function formatBudget(
  budget:
    number | null
) {
  if (
    budget === null ||
    budget === undefined
  ) {
    return "-";
  }

  return `R ${budget.toLocaleString()}`;
}

function formatDate(
  date:
    string | null
) {
  if (!date) {
    return "-";
  }

  return new Date(
    date
  ).toLocaleDateString();
}

function formatStatus(
  status:
    string | null
) {
  if (!status) {
    return "Closed";
  }

  return (
    status
      .charAt(0)
      .toUpperCase() +
    status.slice(1)
  );
}

export default function RecentJobs({
  jobs,
}: Props) {
  return (
    <section className="dark-card admin-recent-card">
      <h2>
        Recent Jobs
      </h2>

      {/* DESKTOP TABLE */}

      <div className="admin-desktop-table">
        <table className="admin-recent-table">
          <thead>
            <tr>
              <th>
                Job
              </th>

              <th>
                Client
              </th>

              <th>
                Budget
              </th>

              <th>
                Status
              </th>

              <th>
                Posted
              </th>
            </tr>
          </thead>

          <tbody>
            {jobs.map(
              (
                job
              ) => (
                <tr
                  key={
                    job.id
                  }
                >
                  <td>
                    {job.title}
                  </td>

                  <td>
                    {job.profiles
                      ?.full_name ??
                      "-"}
                  </td>

                  <td>
                    {formatBudget(
                      job.budget
                    )}
                  </td>

                  <td>
                    {job.status ===
                    "open" ? (
                      <span className="accept-btn">
                        Open
                      </span>
                    ) : (
                      <span className="reject-btn">
                        {formatStatus(
                          job.status
                        )}
                      </span>
                    )}
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
                  colSpan={
                    5
                  }
                  className="admin-empty-table"
                >
                  No jobs
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
          (
            job
          ) => (
            <article
              key={
                job.id
              }
              className="admin-mobile-record"
            >
              <div className="admin-mobile-record-top">
                <strong>
                  {job.title}
                </strong>

                {job.status ===
                "open" ? (
                  <span className="accept-btn">
                    Open
                  </span>
                ) : (
                  <span className="reject-btn">
                    {formatStatus(
                      job.status
                    )}
                  </span>
                )}
              </div>

              <div className="admin-mobile-record-row">
                <span>
                  Client
                </span>

                <span>
                  {job.profiles
                    ?.full_name ??
                    "-"}
                </span>
              </div>

              <div className="admin-mobile-record-row">
                <span>
                  Budget
                </span>

                <strong>
                  {formatBudget(
                    job.budget
                  )}
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
            No jobs found.
          </div>
        )}
      </div>
    </section>
  );
}