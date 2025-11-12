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
   * Upload a single file and return result
   */
  const uploadFile = useCallback(
    async (fileId: string, file: File) => {
      if (!docId) {
        setFileError(fileId, "No document ID set");
        return null;
      }

      try {
        // Get Firebase ID token
        const user = auth.currentUser;
        if (!user) {
          setFileError(fileId, "Not authenticated");
          return null;
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

        return new Promise<{
          fileName: string;
          type: string;
          size: number;
          storagePath: string;
          signedUrl: string;
        } | null>((resolve, reject) => {
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
                resolve({
                  fileName: file.name,
                  type: file.type,
                  size: file.size,
                  storagePath: result.storagePath,
                  signedUrl: result.signedUrl,
                });
              } else {
                setFileError(fileId, result?.error || "Upload failed");
                toast.error(`Failed to upload ${file.name}`);
                resolve(null);
              }
            } else {
              const error = `Upload failed: ${xhr.statusText}`;
              setFileError(fileId, error);
              toast.error(error);
              resolve(null);
            }
          });

          // Handle errors
          xhr.addEventListener("error", () => {
            const error = "Network error during upload";
            setFileError(fileId, error);
            toast.error(error);
            resolve(null);
          });

          // Handle abort
          xhr.addEventListener("abort", () => {
            const error = "Upload cancelled";
            setFileError(fileId, error);
            resolve(null);
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
        return null;
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

    // Track successful uploads during the loop
    const uploadedFiles: Array<{
      fileName: string;
      type: string;
      size: number;
      storagePath: string;
      signedUrl: string;
    }> = [];

    // Upload files sequentially to avoid overwhelming the server
    for (const fileItem of pendingFiles) {
      const result = await uploadFile(fileItem.id, fileItem.file);
      if (result) {
        uploadedFiles.push(result);
      }
    }

    // Persist metadata to Firestore if any uploads succeeded
    if (uploadedFiles.length > 0) {
      try {
        const user = auth.currentUser;
        if (!user) {
          toast.error("Not authenticated");
          return;
        }

        const token = await user.getIdToken();

        const response = await fetch("/api/upload/metadata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            docId,
            files: uploadedFiles.map((f) => ({
              success: true,
              ...f,
            })),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Metadata save failed:", errorData);
          throw new Error(errorData.error || "Failed to save metadata");
        }

        toast.success(`Successfully uploaded and saved ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`);
      } catch (error) {
        console.error("Metadata save error:", error);
        toast.error("Files uploaded but failed to save references");
      }
    } else {
      toast.error("All uploads failed");
    }
  }, [files, uploadFile, docId]);

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
