export default function ProjectsPage() {
  const projects = [
    {
      title: "E-Commerce Website",
      status: "In Progress",
      budget: "R12 000",
    },
    {
      title: "Portfolio Redesign",
      status: "Completed",
      budget: "R4 500",
    },
    {
      title: "Mobile App UI",
      status: "Pending",
      budget: "R8 200",
    },
  ];

  return (
    <div className="projects-page">
      {/* Header */}
      <section className="projects-header dark-card">
        <div>
          <p className="dashboard-badge">Projects</p>

          <h1>Your Active Projects</h1>

          <p>
            Track progress, manage uploads and monitor freelancer work.
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="projects-grid">
        {projects.map((project, index) => (
          <div key={index} className="dark-card project-card">
            <div className="project-top">
              <h2>{project.title}</h2>

              <span className="project-status">
                {project.status}
              </span>
            </div>

            <p className="project-budget">{project.budget}</p>

            <div className="project-progress">
              <div className="project-progress-bar" />
            </div>

            <button className="project-button">
              View Project
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}