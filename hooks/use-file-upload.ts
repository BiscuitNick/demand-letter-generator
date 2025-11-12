"use client";

import { useCallback } from "react";
import { useUploadStore } from "@/lib/upload-store";
import { auth } from "@/lib/firebase-client";
import { toast } from "sonner";

/**
 * Hook to handle file uploads with progress tracking
 */
export function useFileUpload() {
  const files = useUploadStore((state) => state.files);
  const docId = useUploadStore((state) => state.docId);
  const updateFileStatus = useUploadStore((state) => state.updateFileStatus);
  const updateFileProgress = useUploadStore((state) => state.updateFileProgress);
  const setFileSuccess = useUploadStore((state) => state.setFileSuccess);
  const setFileError = useUploadStore((state) => state.setFileError);

  /**
   * Upload a single file
   */
  const uploadFile = useCallback(
    async (fileId: string, file: File) => {
      if (!docId) {
        setFileError(fileId, "No document ID set");
        return;
      }

      try {
        // Get Firebase ID token
        const user = auth.currentUser;
        if (!user) {
          setFileError(fileId, "Not authenticated");
          return;
        }

        const token = await user.getIdToken();

        // Update status to uploading
        updateFileStatus(fileId, "uploading", 0);

        // Create form data
        const formData = new FormData();
        formData.append("files", file);
        formData.append("docId", docId);

        // Upload with progress tracking
        const xhr = new XMLHttpRequest();

        return new Promise<void>((resolve, reject) => {
          // Track upload progress
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              updateFileProgress(fileId, progress);
            }
          });

          // Handle completion
          xhr.addEventListener("load", () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              const result = response.results?.[0];

              if (result?.success) {
                setFileSuccess(fileId, result.signedUrl, result.storagePath);
                toast.success(`Uploaded ${file.name}`);
                resolve();
              } else {
                setFileError(fileId, result?.error || "Upload failed");
                toast.error(`Failed to upload ${file.name}`);
                reject(new Error(result?.error || "Upload failed"));
              }
            } else {
              const error = `Upload failed: ${xhr.statusText}`;
              setFileError(fileId, error);
              toast.error(error);
              reject(new Error(error));
            }
          });

          // Handle errors
          xhr.addEventListener("error", () => {
            const error = "Network error during upload";
            setFileError(fileId, error);
            toast.error(error);
            reject(new Error(error));
          });

          // Handle abort
          xhr.addEventListener("abort", () => {
            const error = "Upload cancelled";
            setFileError(fileId, error);
            reject(new Error(error));
          });

          // Send request
          xhr.open("POST", "/api/upload");
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });
      } catch (error) {
        console.error("Upload error:", error);
        const message = error instanceof Error ? error.message : "Upload failed";
        setFileError(fileId, message);
        toast.error(message);
      }
    },
    [docId, updateFileStatus, updateFileProgress, setFileSuccess, setFileError]
  );

  /**
   * Upload all pending files
   */
  const uploadAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");

    if (pendingFiles.length === 0) {
      toast.info("No files to upload");
      return;
    }

    toast.info(`Uploading ${pendingFiles.length} files...`);

    // Upload files sequentially to avoid overwhelming the server
    for (const fileItem of pendingFiles) {
      await uploadFile(fileItem.id, fileItem.file);
    }

    const successCount = files.filter((f) => f.status === "success").length;
    toast.success(`Successfully uploaded ${successCount} files`);
  }, [files, uploadFile]);

  /**
   * Retry a failed upload
   */
  const retryUpload = useCallback(
    async (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) {
        return;
      }

      await uploadFile(fileId, file.file);
    },
    [files, uploadFile]
  );

  return {
    uploadFile,
    uploadAll,
    retryUpload,
    files,
    isUploading: files.some((f) => f.status === "uploading"),
    pendingCount: files.filter((f) => f.status === "pending").length,
    successCount: files.filter((f) => f.status === "success").length,
    errorCount: files.filter((f) => f.status === "error").length,
  };
}
