"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useParams } from "next/navigation";

import { supabase } from "@/app/lib/supabase";

export default function ClientApplicationsPage() {
  const { id } = useParams();

  const [applications,
    setApplications] =
    useState<any[]>([]);

  const [loading,
    setLoading] =
    useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const { data, error } =
      await supabase
        .from("applications")
        .select(`
          *,
          profiles (
            full_name,
            role,
            category
          )
        `)
        .eq("job_id", id)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(error);
    }

    if (data) {
      setApplications(data);
    }

    setLoading(false);
  };

  const updateStatus = async (
    applicationId: string,
    status: string
  ) => {
    const { error } =
      await supabase
        .from("applications")
        .update({ status })
        .eq("id", applicationId);

    if (error) {
      alert(error.message);
      return;
    }

    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status,
            }
          : app
      )
    );
  };

  if (loading) {
    return (
      <p style={{ padding: 20 }}>
        Loading applications...
      </p>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "40px auto",
      }}
    >
      <h1>Applications</h1>

      {applications.length === 0 && (
        <p>No applications yet.</p>
      )}

      {applications.map(
        (application) => (
          <div
            key={application.id}
            style={{
              backgroundColor:
                "white",

              border:
                "1px solid #ddd",

              borderRadius: 10,

              padding: 20,

              marginBottom: 20,
            }}
          >
            <h2>
              {
                application.profiles
                  ?.full_name
              }
            </h2>

            <p>
              <strong>
                Role:
              </strong>{" "}
              {
                application.profiles
                  ?.role
              }
            </p>

            <p>
              <strong>
                Category:
              </strong>{" "}
              {
                application.profiles
                  ?.category
              }
            </p>

            <p>
              <strong>
                Proposed Budget:
              </strong>{" "}
              ZAR{" "}
              {
                application.proposed_budget
              }
            </p>

            <p>
              <strong>
                Status:
              </strong>{" "}
              {application.status}
            </p>

            <p>
              {
                application.cover_message
              }
            </p>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() =>
                  updateStatus(
                    application.id,
                    "accepted"
                  )
                }
                style={{
                  padding:
                    "10px 14px",

                  backgroundColor:
                    "green",

                  color: "white",

                  border: "none",

                  borderRadius: 6,
                }}
              >
                Accept
              </button>

              <button
                onClick={() =>
                  updateStatus(
                    application.id,
                    "rejected"
                  )
                }
                style={{
                  padding:
                    "10px 14px",

                  backgroundColor:
                    "red",

                  color: "white",

                  border: "none",

                  borderRadius: 6,
                }}
              >
                Reject
              </button>

              <Link
                href={`/dashboard/messages/${application.id}`}
                style={{
                  padding:
                    "10px 14px",

                  backgroundColor:
                    "#2563eb",

                  color: "white",

                  borderRadius: 6,

                  textDecoration:
                    "none",
                }}
              >
                Message
              </Link>

              <Link
                href={`/dashboard/review/${application.id}`}
                style={{
                  padding:
                    "10px 14px",

                  backgroundColor:
                    "#7c3aed",

                  color: "white",

                  borderRadius: 6,

                  textDecoration:
                    "none",
                }}
              >
                Leave Review
              </Link>

              <Link
                href={`/freelancers/${application.freelancer_id}`}
                style={{
                  padding:
                    "10px 14px",

                  backgroundColor:
                    "#111827",

                  color: "white",

                  borderRadius: 6,

                  textDecoration:
                    "none",
                }}
              >
                View Profile
              </Link>
            </div>
          </div>
        )
      )}
    </div>
  );
}