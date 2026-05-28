"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { supabase } from "@/app/lib/supabase";

export default function JobsPage() {
  const [title, setTitle] =
    useState("");

  const [description,
    setDescription] =
    useState("");

  const [budget, setBudget] =
    useState("");

  const [category,
    setCategory] =
    useState("");

  const [jobs, setJobs] =
    useState<any[]>([]);

  const [message,
    setMessage] =
    useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (data) {
      setJobs(data);
    }
  };

  const createJob = async () => {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login.");
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .insert({
        client_id: user.id,
        title,
        description,
        budget: Number(budget),
        category,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Job created!");

    setTitle("");
    setDescription("");
    setBudget("");
    setCategory("");

    loadJobs();
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
      }}
    >
      <h1>Create Job</h1>

      <input
        type="text"
        placeholder="Job title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
        style={inputStyle}
      />

      <textarea
        placeholder="Job description"
        value={description}
        onChange={(e) =>
          setDescription(e.target.value)
        }
        style={{
          ...inputStyle,
          minHeight: 120,
        }}
      />

      <input
        type="number"
        placeholder="Budget"
        value={budget}
        onChange={(e) =>
          setBudget(e.target.value)
        }
        style={inputStyle}
      />

      {/* CATEGORY */}
      <select
        value={category}
        onChange={(e) =>
          setCategory(e.target.value)
        }
        style={inputStyle}
      >
        <option value="">
          Select Category
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

        <option value="Video Editing">
          Video Editing
        </option>

        <option value="Marketing">
          Marketing
        </option>

        <option value="Engineering">
          Engineering
        </option>
      </select>

      <button
        onClick={createJob}
        style={{
          padding: "12px 18px",
          backgroundColor: "black",
          color: "white",
          border: "none",
          borderRadius: 6,
        }}
      >
        Create Job
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

      {/* JOB LIST */}
      <div
        style={{
          marginTop: 50,
        }}
      >
        <h2>Jobs</h2>

        {jobs.length === 0 && (
          <p>No jobs yet.</p>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            style={{
              border:
                "1px solid #ddd",

              padding: 16,

              borderRadius: 8,

              marginBottom: 16,
            }}
          >
            <h3>{job.title}</h3>

            <p>
              <strong>
                Category:
              </strong>{" "}
              {job.category}
            </p>

            <p>
              {job.description}
            </p>

            <p>
              <strong>
                Budget:
              </strong>{" "}
              ZAR {job.budget}
            </p>

            <Link
              href={`/dashboard/jobs/${job.id}`}
              style={{
                display:
                  "inline-block",

                marginTop: 10,

                padding:
                  "8px 12px",

                backgroundColor:
                  "#2563eb",

                color: "white",

                borderRadius: 6,

                textDecoration:
                  "none",
              }}
            >
              View Job
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 15,
  borderRadius: 8,
  border: "1px solid #ccc",
};