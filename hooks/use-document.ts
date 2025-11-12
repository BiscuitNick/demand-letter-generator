"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { documentConverter } from "@/lib/firestore-converters";
import type { Document } from "@/lib/firestore-types";
import { toast } from "sonner";

/**
 * Hook to subscribe to a document in real-time
 */
export function useDocument(docId: string) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "documents", docId).withConverter(documentConverter);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setDocument(snapshot.data());
          setError(null);
        } else {
          setDocument(null);
          setError(new Error("Document not found"));
        }
        setLoading(false);
      },
      (err) => {
        console.error("Document subscription error:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docId]);

  /**
   * Update document facts
   */
  const updateFacts = async (facts: Document["facts"]) => {
    if (!docId) return;

    try {
      const docRef = doc(db, "documents", docId);
      await updateDoc(docRef, { facts });
      toast.success("Facts updated");
    } catch (err) {
      console.error("Error updating facts:", err);
      toast.error("Failed to update facts");
      throw err;
    }
  };

  /**
   * Update document outline
   */
  const updateOutline = async (outline: Document["outline"]) => {
    if (!docId) return;

    try {
      const docRef = doc(db, "documents", docId);
      await updateDoc(docRef, { outline });
      toast.success("Outline updated");
    } catch (err) {
      console.error("Error updating outline:", err);
      toast.error("Failed to update outline");
      throw err;
    }
  };

  /**
   * Update document content
   */
  const updateContent = async (content: string) => {
    if (!docId) return;

    try {
      const docRef = doc(db, "documents", docId);
      await updateDoc(docRef, { content });
      toast.success("Content saved");
    } catch (err) {
      console.error("Error updating content:", err);
      toast.error("Failed to save content");
      throw err;
    }
  };

  return {
    document,
    loading,
    error,
    updateFacts,
    updateOutline,
    updateContent,
  };
}
