"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function JobDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [proposal, setProposal] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    setJob(data);
  };

  const applyForJob = async () => {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const { error } = await supabase.from("applications").insert({
      job_id: id,
      freelancer_id: user.id,
      cover_message: proposal,
      proposed_budget: Number(price),
      status: "pending",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Application submitted successfully!");
    setProposal("");
    setPrice("");
  };

  if (!job) return <p>Loading job...</p>;

  return (
    <div>
      <section style={hero}>
        <h1>{job.title}</h1>
        <p>{job.category}</p>
      </section>

      <div style={layout}>
        <section style={card}>
          <span style={badge}>{job.category || "General"}</span>

          <h2>Job Details</h2>

          <p style={{ color: "#475569", lineHeight: 1.7 }}>
            {job.description}
          </p>

          <p>
            <strong>Budget:</strong>{" "}
            <span style={{ color: "#16a34a", fontWeight: "bold" }}>
              ZAR {job.budget}
            </span>
          </p>
        </section>

        <section style={card}>
          <h2>Apply for this Job</h2>

          <textarea
            placeholder="Write your proposal..."
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            style={{ ...input, minHeight: 140 }}
          />

          <input
            type="number"
            placeholder="Your proposed price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={input}
          />

          <button onClick={applyForJob} style={button}>
            Submit Application
          </button>

          {message && <p style={messageBox}>{message}</p>}
        </section>
      </div>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  color: "white",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const layout = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 25,
};

const card = {
  background: "white",
  padding: 28,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const badge = {
  display: "inline-block",
  background: "#dbeafe",
  color: "#1d4ed8",
  padding: "6px 10px",
  borderRadius: 20,
  fontWeight: "bold",
  fontSize: 13,
  marginBottom: 15,
};

const input = {
  width: "100%",
  padding: 13,
  marginBottom: 15,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
};

const button = {
  padding: "12px 18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
};

const messageBox = {
  marginTop: 18,
  background: "#ecfdf5",
  color: "#166534",
  padding: 14,
  borderRadius: 12,
};