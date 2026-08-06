"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type JobPhotoUploadProps = {
  jobId: string;
  photoType?: "Collection" | "Loading" | "Delivery";
  caption?: string;
};

export default function JobPhotoUpload({
  jobId,
  photoType = "Loading",
  caption = "Items safely loaded",
}: JobPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadPhoto(file: File) {
    setUploading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Your login session has expired.");
      }

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath =
        `${user.id}/${jobId}/web_${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("job-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: photoRecordError } = await supabase
        .from("job_photos")
        .insert({
          job_id: jobId,
          photo_path: filePath,
          caption,
          photo_type: photoType,
        });

      if (photoRecordError) {
        await supabase.storage
          .from("job-photos")
          .remove([filePath]);

        throw photoRecordError;
      }

      const { error: jobUpdateError } = await supabase
        .from("jobs")
        .update({
          items_photo_path: filePath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (jobUpdateError) {
        throw jobUpdateError;
      }

      setMessage(
        "Photo uploaded successfully and shared with the customer ✓",
      );
    } catch (error) {
      console.error("Job photo upload failed:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "The photo could not be uploaded.",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadPhoto(file);
          }
        }}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        style={{
          width: "100%",
          background: uploading ? "#334155" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "10px",
          padding: "12px 16px",
          fontWeight: 800,
          cursor: uploading ? "wait" : "pointer",
          opacity: uploading ? 0.75 : 1,
        }}
      >
        {uploading
          ? "Uploading photo..."
          : `📷 Take ${photoType} Photo`}
      </button>

      {message && (
        <p
          style={{
            margin: "9px 0 0",
            color: message.includes("successfully")
              ? "#4ade80"
              : "#fca5a5",
            fontSize: "14px",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}