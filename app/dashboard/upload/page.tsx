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
    <div className="upload-page">
      <section className="upload-hero dark-card">
        <p className="dashboard-badge">Upload Center</p>

        <h1>Build a stronger freelancer profile</h1>

        <p>
          Upload your CV, portfolio and profile picture to make your account
          look more trustworthy and professional.
        </p>
      </section>

      <section className="upload-grid">
        <div className="dark-card upload-card">
          <h2>Upload File</h2>

          <label className="form-label">File Type</label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="form-input"
          >
            <option value="cv">CV Document</option>
            <option value="portfolio">Portfolio File</option>
            <option value="avatar">Profile Picture</option>
          </select>

          <label className="form-label">Choose File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="form-input"
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="primary-action-btn"
          >
            {uploading ? "Uploading..." : "Upload File"}
          </button>

          {message && <p className="upload-message">{message}</p>}

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="upload-link"
            >
              View Uploaded File
            </a>
          )}
        </div>

        <div className="upload-tips">
          <div className="dark-card upload-tip-card">
            <h3>CV</h3>
            <p>Upload your CV so clients can understand your experience.</p>
          </div>

          <div className="dark-card upload-tip-card">
            <h3>Portfolio</h3>
            <p>Show previous work samples and proof of your skills.</p>
          </div>

          <div className="dark-card upload-tip-card">
            <h3>Profile Picture</h3>
            <p>A clear profile image helps build trust with clients.</p>
          </div>
        </div>
      </section>
    </div>
  );
}