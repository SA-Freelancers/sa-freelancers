"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import EmptyState from "@/app/components/EmptyState";

type Delivery = {
  id: string;
  file_url?: string;
  note?: string;
  created_at?: string;
};

export default function DeliveriesPage() {
  const params = useParams();
  const contractId = params.id as string;

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    const { data } = await supabase
      .from("contract_deliveries")
      .select("*")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false });

    setDeliveries((data as Delivery[]) || []);
    setLoading(false);
  };

  const uploadDelivery = async () => {
    setMessage("");

    if (!file) {
      setMessage("Please choose a file.");
      return;
    }

    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setUploading(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${contractId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, file);

    if (uploadError) {
      setMessage(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(fileName);

    const { error } = await supabase.from("contract_deliveries").insert({
      contract_id: contractId,
      freelancer_id: user.id,
      file_url: publicUrl,
      note,
    });

    if (error) {
      setMessage(error.message);
      setUploading(false);
      return;
    }

    await supabase.from("contract_activity").insert({
      contract_id: contractId,
      action: "Delivery uploaded",
    });

    setFile(null);
    setNote("");
    setMessage("Delivery uploaded successfully!");
    setUploading(false);
    loadDeliveries();
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Deliveries</p>
        <h1>Contract Deliveries</h1>
        <p>Upload completed work files for this contract.</p>
      </section>

      <section className="dark-card hire-card">
        <h2>Upload Delivery</h2>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="form-input"
        />

        <textarea
          placeholder="Add a short delivery note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="form-input proposal-textarea"
        />

        <button
          onClick={uploadDelivery}
          disabled={uploading}
          className="primary-action-btn"
        >
          {uploading ? "Uploading..." : "Upload Delivery"}
        </button>

        {message && <p className="upload-message">{message}</p>}
      </section>

      <section style={{ marginTop: 30 }}>
        {deliveries.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="No deliveries yet"
            description="Uploaded work files will appear here."
          />
        ) : (
          <div className="contracts-grid">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="dark-card contract-card">
                <h2>Delivery File</h2>

                <p className="contract-description">
                  {delivery.note || "No note provided."}
                </p>

                <a
                  href={delivery.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="primary-action-link"
                >
                  View File
                </a>

                <small>
                  {delivery.created_at
                    ? new Date(delivery.created_at).toLocaleDateString()
                    : ""}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}