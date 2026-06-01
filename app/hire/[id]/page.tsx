"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type Profile = {
  id: string;
  full_name?: string;
  role?: string;
  category?: string;
  verified?: boolean;
  top_rated?: boolean;
};

export default function HireFreelancerPage() {
  const params = useParams();
  const router = useRouter();

  const freelancerId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFreelancer();
  }, []);

  const loadFreelancer = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", freelancerId)
      .single();

    setProfile((data as Profile) || null);
    setLoading(false);
  };

  const createContract = async () => {
    setMessage("");

    if (!title.trim() || !description.trim() || !budget) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (Number(budget) <= 0) {
      setMessage("Please enter a valid budget.");
      return;
    }

    setSending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setSending(false);
      return;
    }

    const { data: contractData, error } = await supabase
      .from("contracts")
      .insert({
        client_id: user.id,
        freelancer_id: freelancerId,
        project_title: title,
        project_description: description,
        budget: Number(budget),
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      setSending(false);
      return;
    }

    if (contractData?.id) {
      await supabase.from("contract_activity").insert({
        contract_id: contractData.id,
        action: "Hiring request created",
      });
    }

    await supabase.from("notifications").insert({
      user_id: freelancerId,
      title: "New Hiring Request",
      body: `You received a new hiring request for ${title}.`,
      link: "/dashboard/contracts",
      is_read: false,
    });

    setMessage("Hiring request sent successfully!");
    setSending(false);

    setTimeout(() => {
      router.push("/dashboard/client-contracts");
    }, 1200);
  };

  if (loading) return <LoadingSkeleton />;

  if (!profile) {
    return (
      <main className="hire-page">
        <section className="dark-card hire-card">
          <h1>Freelancer not found</h1>
          <p>This freelancer profile could not be loaded.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="hire-page">
      <section className="dark-card hire-card">
        <p className="dashboard-badge">Hire Freelancer</p>

        <h1>Hire {profile.full_name || "Freelancer"}</h1>

        <p className="hire-description">
          Create a project contract and send a professional hiring request.
        </p>

        <div className="hire-profile-summary">
          <strong>{profile.role || "Professional Freelancer"}</strong>
          <span>{profile.category || "General"}</span>
        </div>

        <label className="form-label">Project Title</label>
        <input
          type="text"
          placeholder="Example: Build a business website"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
        />

        <label className="form-label">Project Description</label>
        <textarea
          placeholder="Describe the project, timeline, deliverables and expectations..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-input proposal-textarea"
        />

        <label className="form-label">Budget</label>
        <input
          type="number"
          placeholder="Example: 2500"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="form-input"
        />

        <button
          onClick={createContract}
          disabled={sending}
          className="primary-action-btn"
        >
          {sending ? "Sending..." : "Send Hiring Request"}
        </button>

        {message && <p className="upload-message">{message}</p>}
      </section>
    </main>
  );
}