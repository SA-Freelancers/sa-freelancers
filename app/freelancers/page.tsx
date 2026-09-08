"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Freelancer = {
  id: string;
  full_name?: string;
  headline?: string;
  category?: string;
  bio?: string;
  rating?: number;
  completed_jobs?: number;
  completed_projects?: number;
  hourly_rate?: number;
  experience_years?: number;
  verified?: boolean;
  verification_status?: string;
  top_rated?: boolean;
  avatar_url?: string;
  avatar_initials?: string;
  is_demo?: boolean;
};

type ClientJob = {
  id: string;
  title: string;
  budget?: number | null;
  category?: string | null;
  created_at?: string | null;
};

export default function FreelancersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState(
    searchParams.get("category") || ""
  );

  const [selectedFreelancer, setSelectedFreelancer] =
    useState<Freelancer | null>(null);

  const [clientJobs, setClientJobs] = useState<ClientJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");

  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationSending, setInvitationSending] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState("");

  useEffect(() => {
    void loadFreelancers();
  }, []);

  /*
   * Keep the selected category synchronized
   * with links such as:
   *
   * /freelancers?category=Engineering
   */
  useEffect(() => {
    const urlCategory = searchParams.get("category");

    setCategory(urlCategory || "");
  }, [searchParams]);

  const loadFreelancers = async () => {
    setLoading(true);

    const { data: realData, error: realError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "freelancer")
      .eq("suspended", false)
      .order("rating", { ascending: false });

    if (realError) {
      console.error("Error loading real freelancers:", realError);
    }

    const { data: demoData, error: demoError } = await supabase
      .from("demo_freelancers")
      .select("*");

    if (demoError) {
      console.error("Error loading demo freelancers:", demoError);
    }

    const realFreelancers = (realData as Freelancer[]) || [];

    const demoFreelancers = ((demoData as Freelancer[]) || []).map(
      (item) => ({
        ...item,
        is_demo: true,
      })
    );

    setFreelancers([
      ...realFreelancers,
      ...demoFreelancers,
    ]);

    setLoading(false);
  };

  const filteredFreelancers = freelancers.filter((item) => {
    const text = `
      ${item.full_name || ""}
      ${item.headline || ""}
      ${item.category || ""}
      ${item.bio || ""}
    `.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesCategory =
      !category || item.category === category;

    return matchesSearch && matchesCategory;
  });

  const clearFilters = () => {
    setSearch("");
    setCategory("");
  };

  const getInitials = (item: Freelancer) => {
    if (item.avatar_initials) {
      return item.avatar_initials;
    }

    return (item.full_name || "FH")
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const isIdentityVerified = (item: Freelancer) => {
    return (
      item.verification_status === "verified" ||
      item.verified === true
    );
  };

  const closeInvitationModal = () => {
    if (invitationSending) {
      return;
    }

    setSelectedFreelancer(null);
    setClientJobs([]);
    setSelectedJobId("");
    setInvitationMessage("");
  };

  const openInvitationModal = async (freelancer: Freelancer) => {
    setSelectedFreelancer(freelancer);
    setClientJobs([]);
    setSelectedJobId("");
    setInvitationMessage("");
    setInvitationLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Invite user loading error:", userError);
      }

      if (!user) {
        setInvitationMessage(
          "Please log in as a client to invite this freelancer."
        );
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, suspended")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Invite profile loading error:", profileError);
        setInvitationMessage(
          "We could not verify your account. Please try again."
        );
        return;
      }

      if (profile?.suspended) {
        setInvitationMessage(
          "Your account is suspended and cannot send job invitations."
        );
        return;
      }

      if (profile?.role !== "client") {
        setInvitationMessage(
          "Only client accounts can invite freelancers to jobs."
        );
        return;
      }

      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, budget, category, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) {
        console.error("Client jobs loading error:", jobsError);
        setInvitationMessage(
          "We could not load your jobs. Please try again."
        );
        return;
      }

      const availableJobs = (jobs as ClientJob[]) || [];

      setClientJobs(availableJobs);

      if (availableJobs.length === 1) {
        setSelectedJobId(availableJobs[0].id);
      }
    } catch (error) {
      console.error("Open invitation modal error:", error);

      setInvitationMessage(
        "Something went wrong while preparing the invitation."
      );
    } finally {
      setInvitationLoading(false);
    }
  };

  const sendJobInvitation = async () => {
    if (!selectedFreelancer || !selectedJobId) {
      setInvitationMessage("Please select a job first.");
      return;
    }

    setInvitationSending(true);
    setInvitationMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Invite sender loading error:", userError);
      }

      if (!user) {
        setInvitationMessage(
          "Please log in as a client to send this invitation."
        );
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, suspended")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Invite sender profile error:", profileError);
        setInvitationMessage(
          "We could not verify your account. Please try again."
        );
        return;
      }

      if (profile?.suspended) {
        setInvitationMessage(
          "Your account is suspended and cannot send job invitations."
        );
        return;
      }

      if (profile?.role !== "client") {
        setInvitationMessage(
          "Only client accounts can send job invitations."
        );
        return;
      }

      const { error } = await supabase
        .from("job_invitations")
        .insert({
          job_id: selectedJobId,
          client_id: user.id,
          freelancer_id: selectedFreelancer.id,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") {
          setInvitationMessage(
            "You have already invited this freelancer to the selected job."
          );
          return;
        }

        console.error("Job invitation insert error:", error);
        setInvitationMessage(
          error.message || "Could not send the invitation."
        );
        return;
      }

      setInvitationMessage("Invitation sent successfully.");

      setTimeout(() => {
        closeInvitationModal();
      }, 1200);
    } catch (error) {
      console.error("Send job invitation error:", error);

      setInvitationMessage(
        "Something went wrong while sending the invitation."
      );
    } finally {
      setInvitationSending(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <main className="search-page">

      {/* HERO */}

      <section className="search-hero dark-card">
        <p className="dashboard-badge">
          Browse Talent
        </p>

        <h1>
          Find skilled South African freelancers
        </h1>

        <p>
          Explore freelancers, compare experience,
          rates and skills, then hire safely through
          Freelance Hub SA.
        </p>
      </section>

      {/* FILTERS */}

      <section className="dark-card search-filter-card">
        <div className="search-filters-grid">

          <input
            type="text"
            placeholder="🔍 Search freelancers, skills, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-input"
          >
            <option value="">
              All Categories
            </option>

            <option value="Engineering">
              Engineering
            </option>

            <option value="CAD Drafting">
              CAD Drafting
            </option>

            <option value="Web Development">
              Web Development
            </option>

            <option value="Graphic Design">
              Graphic Design
            </option>

            <option value="Writing">
              Writing
            </option>

            <option value="Marketing">
              Marketing
            </option>

            <option value="Video Editing">
              Video Editing
            </option>

            <option value="Virtual Assistant">
              Virtual Assistant
            </option>
          </select>

        </div>

        {(search || category) && (
          <div
            className="search-buttons"
            style={{
              marginTop: 14,
            }}
          >
            <button
              type="button"
              onClick={clearFilters}
              className="secondary-action-btn"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {/* FREELANCERS */}

      <section className="search-section">

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <h2>
            {category
              ? `${category} Freelancers`
              : "Available Freelancers"}
          </h2>

          <p>
            <strong>
              {filteredFreelancers.length}
            </strong>{" "}
            Freelancer
            {filteredFreelancers.length === 1 ? "" : "s"} Found
          </p>
        </div>

        {filteredFreelancers.length === 0 ? (
          <EmptyState
            emoji="👥"
            title="No freelancers found"
            description="Try another search keyword or category."
          />
        ) : (
          <div className="marketplace-grid">

            {filteredFreelancers.map((item) => (
              <div
                key={`${item.is_demo ? "demo" : "real"}-${item.id}`}
                className="dark-card marketplace-card"
              >

                {/* PROFILE HEADER */}

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.full_name || "Freelancer"}
                      className="profile-avatar"
                      style={{
                        width: 58,
                        height: 58,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      {getInitials(item)}
                    </div>
                  )}

                  <div>
                    <h3
                      style={{
                        margin: 0,
                        minHeight: "auto",
                      }}
                    >
                      {item.full_name || "Freelancer"}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                      }}
                    >
                      {item.headline ||
                        item.category ||
                        "Professional Freelancer"}
                    </p>
                  </div>
                </div>

                {/* BADGES */}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 12,
                    marginBottom: 12,
                  }}
                >
                  {isIdentityVerified(item) && (
                    <span className="verified-badge">
                      ✔ Identity Verified
                    </span>
                  )}

                  {item.top_rated && (
                    <span className="top-rated-badge">
                      ⭐ Top Rated
                    </span>
                  )}

                  <span className="marketplace-badge">
                    {item.category || "Professional"}
                  </span>

                  {item.is_demo && (
                    <span className="marketplace-badge">
                      Demo Profile
                    </span>
                  )}
                </div>

                {/* PROFILE INFORMATION */}

                <div className="job-meta">

                  <p className="job-meta-item">
                    <span>
                      ⭐ Rating
                    </span>

                    <span>
                      {item.rating != null
                        ? Number(item.rating).toFixed(1)
                        : "Not rated"}
                    </span>
                  </p>

                  <p className="job-meta-item">
                    <span>
                      💼 Projects
                    </span>

                    <span>
                      {item.completed_jobs ??
                        item.completed_projects ??
                        0}
                    </span>
                  </p>

                  <p className="job-meta-item">
                    <span>
                      💰 Rate
                    </span>

                    <span>
                      {item.hourly_rate != null
                        ? `R${Number(
                            item.hourly_rate
                          ).toLocaleString("en-ZA")}/hr`
                        : "Not set"}
                    </span>
                  </p>

                </div>

                <p
                  style={{
                    color: "#64748b",
                    fontSize: ".9rem",
                    marginTop: 10,
                    marginBottom: 16,
                  }}
                >
                  {item.experience_years != null
                    ? `${item.experience_years} year${
                        item.experience_years === 1 ? "" : "s"
                      } experience`
                    : "Experience not specified"}
                </p>

                {/* ACTIONS */}

                <div className="marketplace-actions">

                  {item.is_demo ? (
                    <button
                      type="button"
                      className="secondary-action-btn"
                      disabled
                      title="Demo profiles are for marketplace preview only."
                    >
                      Demo Profile
                    </button>
                  ) : (
                    <>
                      <Link
                        href={`/freelancers/${item.id}`}
                        className="primary-action-link"
                      >
                        View Profile
                      </Link>

                      <button
                        type="button"
                        className="secondary-action-btn"
                        onClick={() => void openInvitationModal(item)}
                      >
                        Invite to Job
                      </button>
                    </>
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

    </main>
  );
}