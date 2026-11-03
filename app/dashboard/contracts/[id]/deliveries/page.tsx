"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Delivery = {
  id: string;
  contract_id: string;
  freelancer_id?: string | null;
  file_url?: string | null;
  note?: string | null;
  created_at?: string | null;
};

type Contract = {
  id: string;
  client_id?: string | null;
  freelancer_id?: string | null;
  project_title?: string | null;
  status?: string | null;
};

export default function DeliveriesPage() {
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!contractId) return;

    loadPage();
  }, [contractId]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
      }

      setCurrentUserId(user?.id || null);

      const {
        data: contractData,
        error: contractError,
      } = await supabase
        .from("contracts")
        .select(`
          id,
          client_id,
          freelancer_id,
          project_title,
          status
        `)
        .eq("id", contractId)
        .maybeSingle();

      if (contractError) {
        console.error("Contract error:", contractError);
        setErrorMessage("Unable to load this contract.");
        return;
      }

      setContract((contractData as Contract) || null);

      await loadDeliveries();
    } catch (error) {
      console.error("Delivery page error:", error);
      setErrorMessage("Something went wrong while loading this page.");
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async () => {
    const {
      data,
      error,
    } = await supabase
      .from("contract_deliveries")
      .select(`
        id,
        contract_id,
        freelancer_id,
        file_url,
        note,
        created_at
      `)
      .eq("contract_id", contractId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Delivery loading error:", error);
      setDeliveries([]);
      return;
    }

    setDeliveries((data as Delivery[]) || []);
  };

  const uploadDelivery = async () => {
    setMessage("");

    if (!file) {
      setMessage("Please choose a file first.");
      return;
    }

    if (!currentUserId) {
      setMessage("Please log in first.");
      return;
    }

    if (
      !contract?.freelancer_id ||
      currentUserId !== contract.freelancer_id
    ) {
      setMessage(
        "Only the freelancer assigned to this contract can attach work files."
      );
      return;
    }

    try {
      setUploading(true);

      const safeFileName = file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const storagePath =
        `contract-deliveries/${contractId}/${Date.now()}-${safeFileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("uploads")
        .upload(storagePath, file, {
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        setMessage(uploadError.message);
        return;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("uploads")
        .getPublicUrl(storagePath);

      const publicUrl =
        publicUrlData.publicUrl;

      if (!publicUrl) {
        setMessage(
          "The file was uploaded but its URL could not be created."
        );
        return;
      }

      const {
        error: insertError,
      } = await supabase
        .from("contract_deliveries")
        .insert({
          contract_id: contractId,
          freelancer_id: currentUserId,
          file_url: publicUrl,
          note: note.trim() || null,
        });

      if (insertError) {
        console.error(
          "Delivery insert error:",
          insertError
        );

        setMessage(insertError.message);
        return;
      }

      const {
        error: activityError,
      } = await supabase
        .from("contract_activity")
        .insert({
          contract_id: contractId,
          action: `Work file attached: ${file.name}`,
        });

      if (activityError) {
        console.error(
          "Activity insert error:",
          activityError
        );
      }

      setFile(null);
      setNote("");

      const fileInput =
        document.getElementById(
          "delivery-file-input"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadDeliveries();

      setMessage(
        "Work file attached successfully. You can now return to the contract."
      );
    } catch (error) {
      console.error("Upload error:", error);

      setMessage(
        "Something went wrong while uploading the file."
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!contract) {
    return (
      <main className="contracts-page">
        <EmptyState
          emoji="📄"
          title="Contract not found"
          description={
            errorMessage ||
            "This contract could not be loaded."
          }
        />
      </main>
    );
  }

  const isFreelancer =
    currentUserId === contract.freelancer_id;

  const isClient =
    currentUserId === contract.client_id;

  return (
    <main className="contracts-page">

      {/* HEADER */}

      <section className="contracts-header dark-card">
        <p className="dashboard-badge">
          Work Files
        </p>

        <h1>
          Attach Work Files
        </h1>

        <p>
          {contract.project_title ||
            "Contract project"}
        </p>

        <div
          style={{
            marginTop: 20,
          }}
        >
          <Link
            href={`/dashboard/contracts/${contractId}`}
            className="primary-action-link"
          >
            ← Back to Contract
          </Link>
        </div>
      </section>

      {/* FREELANCER UPLOAD */}

      {isFreelancer && (
        <section
          className="dark-card hire-card"
          style={{
            marginTop: 24,
          }}
        >
          <h2>
            Attach Completed Work
          </h2>

          <p
            style={{
              marginBottom: 20,
              opacity: 0.8,
            }}
          >
            Attach at least one completed work file
            before marking this contract as complete.
          </p>

          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >
            <input
              id="delivery-file-input"
              type="file"
              onChange={(e) =>
                setFile(
                  e.target.files?.[0] ||
                    null
                )
              }
              className="form-input"
            />

            {file && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background:
                    "rgba(34, 197, 94, 0.10)",
                  border:
                    "1px solid rgba(34, 197, 94, 0.25)",
                }}
              >
                Selected file:{" "}
                <strong>
                  {file.name}
                </strong>
              </div>
            )}

            <textarea
              placeholder="Add a short note about the completed work..."
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              className="form-input proposal-textarea"
            />

            <button
              type="button"
              onClick={uploadDelivery}
              disabled={
                uploading || !file
              }
              className="primary-action-btn"
              style={{
                opacity:
                  uploading || !file
                    ? 0.6
                    : 1,
                cursor:
                  uploading || !file
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {uploading
                ? "Uploading..."
                : "Attach Work File"}
            </button>
          </div>

          {message && (
            <p
              style={{
                marginTop: 16,
              }}
            >
              {message}
            </p>
          )}
        </section>
      )}

      {/* CLIENT MESSAGE */}

      {isClient && (
        <section
          className="dark-card hire-card"
          style={{
            marginTop: 24,
          }}
        >
          <h2>
            Submitted Work
          </h2>

          <p>
            Files attached by the freelancer
            will appear below.
          </p>
        </section>
      )}

      {/* ATTACHED FILES */}

      <section
        style={{
          marginTop: 30,
        }}
      >
        <h2
          style={{
            marginBottom: 18,
          }}
        >
          Attached Files
        </h2>

        {deliveries.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="No work files attached"
            description="The freelancer has not attached any completed work files yet."
          />
        ) : (
          <div className="contracts-grid">
            {deliveries.map(
              (delivery, index) => (
                <div
                  key={delivery.id}
                  className="dark-card contract-card"
                >
                  <h2>
                    Work File{" "}
                    {deliveries.length -
                      index}
                  </h2>

                  <p className="contract-description">
                    {delivery.note ||
                      "No delivery note provided."}
                  </p>

                  {delivery.file_url && (
                    <a
                      href={
                        delivery.file_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="primary-action-link"
                    >
                      View File
                    </a>
                  )}

                  <small
                    style={{
                      display: "block",
                      marginTop: 16,
                      opacity: 0.7,
                    }}
                  >
                    {delivery.created_at
                      ? new Date(
                          delivery.created_at
                        ).toLocaleString(
                          "en-ZA"
                        )
                      : ""}
                  </small>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* RETURN AFTER UPLOAD */}

      {isFreelancer &&
        deliveries.length > 0 && (
          <section
            className="dark-card hire-card"
            style={{
              marginTop: 30,
            }}
          >
            <h2>
              Work Attached ✓
            </h2>

            <p>
              Your work file has been attached.
              Return to the contract to continue
              the completion process.
            </p>

            <div
              style={{
                marginTop: 18,
              }}
            >
              <Link
                href={`/dashboard/contracts/${contractId}`}
                className="primary-action-link"
              >
                Return to Contract
              </Link>
            </div>
          </section>
        )}
    </main>
  );
}