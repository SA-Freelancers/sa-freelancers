"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { supabase } from "@/app/lib/supabase";

export default function JobDetailsPage() {
  const { id } = useParams();

  const [job, setJob] =
    useState<any>(null);

  const [proposal,
    setProposal] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [message,
    setMessage] =
    useState("");

  useEffect(() => {
    loadJob();
  }, []);

  const loadJob = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setJob(data);
    }
  };

  const applyForJob = async () => {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login.");
      return;
    }

    const { error } = await supabase
      .from("applications")
      .insert({
        job_id: id,
        freelancer_id: user.id,
        cover_message: proposal,
        proposed_budget:
          Number(price),
        status: "pending",
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Application submitted!"
    );

    setProposal("");
    setPrice("");
  };

  if (!job) {
    return (
      <p style={{ padding: 20 }}>
        Loading job...
      </p>
    );
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "40px auto",
      }}
    >
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 20,
          backgroundColor: "white",
        }}
      >
        <h1>{job.title}</h1>

        <p>
          <strong>
            Category:
          </strong>{" "}
          {job.category}
        </p>

        <p>
          <strong>
            Budget:
          </strong>{" "}
          ZAR {job.budget}
        </p>

        <p>
          {job.description}
        </p>
      </div>

      {/* APPLY */}
      <div
        style={{
          marginTop: 40,
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 20,
          backgroundColor: "white",
        }}
      >
        <h2>Apply for this Job</h2>

        <textarea
          placeholder="Write your proposal..."
          value={proposal}
          onChange={(e) =>
            setProposal(
              e.target.value
            )
          }
          style={{
            width: "100%",
            minHeight: 140,
            padding: 12,
            borderRadius: 8,
            border:
              "1px solid #ccc",
            marginBottom: 15,
          }}
        />

        <input
          type="number"
          placeholder="Your proposed price"
          value={price}
          onChange={(e) =>
            setPrice(e.target.value)
          }
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border:
              "1px solid #ccc",
            marginBottom: 15,
          }}
        />

        <button
          onClick={applyForJob}
          style={{
            padding: "12px 18px",
            backgroundColor:
              "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
          }}
        >
          Submit Application
        </button>

        {message && (
          <p
            style={{
              marginTop: 15,
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}