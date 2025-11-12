import { create } from "zustand";
import { nanoid } from "nanoid";

/**
 * Upload status for individual files
 */
export type UploadStatus = "pending" | "uploading" | "success" | "error";

/**
 * Upload file item in the queue
 */
export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
  signedUrl?: string;
  storagePath?: string;
}

/**
 * Upload store state
 */
interface UploadStore {
  files: UploadFile[];
  docId: string | null;

  // Actions
  setDocId: (docId: string) => void;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  updateFileStatus: (
    id: string,
    status: UploadStatus,
    progress?: number,
    error?: string
  ) => void;
  updateFileProgress: (id: string, progress: number) => void;
  setFileSuccess: (id: string, signedUrl: string, storagePath: string) => void;
  setFileError: (id: string, error: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  retryFile: (id: string) => void;
}

/**
 * Upload queue store using Zustand
 */
export const useUploadStore = create<UploadStore>((set) => ({
  files: [],
  docId: null,

  setDocId: (docId) => set({ docId }),

  addFiles: (newFiles) =>
    set((state) => ({
      files: [
        ...state.files,
        ...newFiles.map((file) => ({
          id: nanoid(),
          file,
          status: "pending" as UploadStatus,
          progress: 0,
        })),
      ],
    })),

  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    })),

  updateFileStatus: (id, status, progress, error) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              status,
              ...(progress !== undefined && { progress }),
              ...(error && { error }),
            }
          : f
      ),
    })),

  updateFileProgress: (id, progress) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, progress } : f
      ),
    })),

  setFileSuccess: (id, signedUrl, storagePath) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              status: "success" as UploadStatus,
              progress: 100,
              signedUrl,
              storagePath,
            }
          : f
      ),
    })),

  setFileError: (id, error) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              status: "error" as UploadStatus,
              error,
            }
          : f
      ),
    })),

  clearCompleted: () =>
    set((state) => ({
      files: state.files.filter((f) => f.status !== "success"),
    })),

  clearAll: () => set({ files: [] }),

  retryFile: (id) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              status: "pending" as UploadStatus,
              progress: 0,
              error: undefined,
            }
          : f
      ),
    })),
}));
