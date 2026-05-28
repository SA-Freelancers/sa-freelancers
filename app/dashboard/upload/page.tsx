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
      setMessage("You must be logged in.");
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
    } = supabase.storage
      .from("uploads")
      .getPublicUrl(fileName);

    setFileUrl(publicUrl);

    // SAVE URL TO PROFILE
    let updateData = {};

    if (fileType === "cv") {
      updateData = {
        cv_url: publicUrl,
      };
    }

    if (fileType === "portfolio") {
      updateData = {
        portfolio_url: publicUrl,
      };
    }

    if (fileType === "avatar") {
      updateData = {
        avatar_url: publicUrl,
      };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (profileError) {
      setMessage(profileError.message);
      setUploading(false);
      return;
    }

    setMessage("File uploaded and saved!");

    setUploading(false);
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
      }}
    >
      <h1>Upload Files</h1>

      <select
        value={fileType}
        onChange={(e) =>
          setFileType(e.target.value)
        }
        style={{
          padding: 10,
          marginBottom: 15,
          width: "100%",
        }}
      >
        <option value="cv">CV</option>

        <option value="portfolio">
          Portfolio
        </option>

        <option value="avatar">
          Profile Picture
        </option>
      </select>

      <input
        type="file"
        onChange={(e) =>
          setFile(
            e.target.files?.[0] || null
          )
        }
      />

      <br />
      <br />

      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{
          padding: "12px 18px",
          backgroundColor: "black",
          color: "white",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
        }}
      >
        {uploading
          ? "Uploading..."
          : "Upload"}
      </button>

      {message && (
        <p style={{ marginTop: 20 }}>
          {message}
        </p>
      )}

      {fileUrl && (
        <div style={{ marginTop: 20 }}>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
          >
            View Uploaded File
          </a>
        </div>
      )}
    </div>
  );
}