"use client";

type Job = {
  id: string;
  title: string;
  budget: number | null;
  status: string | null;
  created_at: string | null;
  profiles?: {
    full_name: string | null;
  } | null;
};

type Props = {
  jobs: Job[];
};

export default function RecentJobs({ jobs }: Props) {
  return (
    <section
      className="dark-card"
      style={{
        padding: 24,
        marginTop: 24,
      }}
    >
      <h2>Recent Jobs</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 20,
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 12 }}>Job</th>

            <th style={{ textAlign: "left", padding: 12 }}>Client</th>

            <th style={{ textAlign: "left", padding: 12 }}>Budget</th>

            <th style={{ textAlign: "left", padding: 12 }}>Status</th>

            <th style={{ textAlign: "left", padding: 12 }}>Posted</th>
          </tr>
        </thead>

        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              style={{
                borderBottom:
                  "1px solid rgba(255,255,255,.06)",
              }}
            >
              <td style={{ padding: 12 }}>{job.title}</td>

              <td style={{ padding: 12 }}>
                {job.profiles?.full_name ?? "-"}
              </td>

              <td style={{ padding: 12 }}>
                {job.budget
                  ? `R ${job.budget.toLocaleString()}`
                  : "-"}
              </td>

              <td style={{ padding: 12 }}>
                {job.status === "open" ? (
                  <span className="accept-btn">Open</span>
                ) : (
                  <span className="reject-btn">
                    {job.status ?? "Closed"}
                  </span>
                )}
              </td>

              <td style={{ padding: 12 }}>
                {job.created_at
                  ? new Date(job.created_at).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
          ))}

          {jobs.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: "center",
                  padding: 30,
                }}
              >
                No jobs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}