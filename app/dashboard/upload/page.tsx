"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("cv");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    setUploading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first.");
      setUploading(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(fileName, file);

    if (error) {
      setMessage(error.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(fileName);

    let updateData = {};

    if (fileType === "cv") updateData = { cv_url: publicUrl };
    if (fileType === "portfolio") updateData = { portfolio_url: publicUrl };
    if (fileType === "avatar") updateData = { avatar_url: publicUrl };

    const { error: profileError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (profileError) {
      setMessage(profileError.message);
      setUploading(false);
      return;
    }

    setFileUrl(publicUrl);
    setMessage("File uploaded and saved successfully!");
    setUploading(false);
  };

  return (
    <div>
      <section className="hero-section" style={hero}>
        <h1>Upload Center</h1>
        <p>Upload your CV, portfolio, and profile picture to improve trust.</p>
      </section>

      <div className="dark-card" style={card}>
        <h2>Upload File</h2>

        <label style={label}>File Type</label>

        <select
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          style={input}
        >
          <option value="cv">CV Document</option>
          <option value="portfolio">Portfolio File</option>
          <option value="avatar">Profile Picture</option>
        </select>

        <label style={label}>Choose File</label>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={input}
        />

        <button onClick={handleUpload} disabled={uploading} style={primaryBtn}>
          {uploading ? "Uploading..." : "Upload File"}
        </button>

        {message && <p style={messageBox}>{message}</p>}

        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noreferrer" style={fileLink}>
            View Uploaded File
          </a>
        )}
      </div>

      <section style={infoGrid}>
        <div className="dark-card" style={infoCard}>
          <h3>CV</h3>
          <p>Upload your CV so clients can understand your experience.</p>
        </div>

        <div className="dark-card" style={infoCard}>
          <h3>Portfolio</h3>
          <p>Show previous work samples and proof of your skills.</p>
        </div>

        <div className="dark-card" style={infoCard}>
          <h3>Profile Picture</h3>
          <p>A clear profile image helps build trust with clients.</p>
        </div>
      </section>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #2563eb)",
  padding: 35,
  borderRadius: 18,
  marginBottom: 30,
};

const card = {
  padding: 30,
  borderRadius: 18,
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
  maxWidth: 700,
};

const label = {
  display: "block",
  marginBottom: 8,
  fontWeight: "bold",
};

const input = {
  width: "100%",
  padding: 13,
  marginBottom: 16,
  borderRadius: 10,
};

const primaryBtn = {
  padding: "12px 18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold",
};

const fileLink = {
  display: "inline-block",
  marginTop: 18,
  color: "#2563eb",
  fontWeight: "bold",
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 20,
  marginTop: 30,
};

const infoCard = {
  padding: 22,
  borderRadius: 16,
};

const messageBox = {
  marginTop: 18,
  background: "#ecfdf5",
  color: "#166534",
  padding: 14,
  borderRadius: 12,
};