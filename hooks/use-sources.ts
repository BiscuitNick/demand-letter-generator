"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { toast } from "sonner";

export interface SourceDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  signedUrl: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

/**
 * Hook to manage source documents for a document
 */
export function useSources(docId: string) {
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to sources subcollection
  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    const sourcesRef = collection(db, "documents", docId, "sources");
    const q = query(sourcesRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sourceDocs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SourceDocument[];

        setSources(sourceDocs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching sources:", err);
        setError(err as Error);
        setLoading(false);
        toast.error("Failed to load source documents");
      }
    );

    return () => unsubscribe();
  }, [docId]);

  /**
   * Delete a source document
   */
  const deleteSource = async (sourceId: string) => {
    try {
      const sourceRef = doc(db, "documents", docId, "sources", sourceId);
      await deleteDoc(sourceRef);
      toast.success("Source document removed");
    } catch (err) {
      console.error("Error deleting source:", err);
      toast.error("Failed to delete source document");
      throw err;
    }
  };

  return {
    sources,
    loading,
    error,
    deleteSource,
    hasSources: sources.length > 0,
  };
}
