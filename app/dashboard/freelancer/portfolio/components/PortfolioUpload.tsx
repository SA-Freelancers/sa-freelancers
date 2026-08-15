"use client";

import { useState } from "react";
import { uploadPortfolioImage } from "@/app/lib/api/portfolio";

type Props = {
  freelancerId: string;
  images: string[];
  onImagesChanged: (images: string[]) => void;
};

export default function PortfolioUpload({
  freelancerId,
  images,
  onImagesChanged,
}: Props) {
  const [uploading, setUploading] = useState(false);

  async function upload(files: FileList) {
    setUploading(true);

    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      const result = await uploadPortfolioImage(
        file,
        freelancerId
      );

      if (result.publicUrl) {
        uploaded.push(result.publicUrl);
      }
    }

    onImagesChanged([
      ...images,
      ...uploaded,
    ]);

    setUploading(false);
  }

  return (
    <div className="dark-card">

      <h2>Project Images</h2>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          if (e.target.files) {
            upload(e.target.files);
          }
        }}
      />

      {uploading && <p>Uploading...</p>}

      <div
        style={{
          display: "grid",
          gap: 15,
          marginTop: 20,
          gridTemplateColumns:
            "repeat(auto-fill,minmax(150px,1fr))",
        }}
      >
        {images.map((image) => (
          <img
            key={image}
            src={image}
            style={{
              width: "100%",
              height: 150,
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
        ))}
      </div>

    </div>
  );
}