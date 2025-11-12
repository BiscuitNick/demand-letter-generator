"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase-client";
import { toast } from "sonner";
import type { PipelineStep } from "@/lib/ai/types";

/**
 * Hook to run AI generation pipeline
 */
export function useGenerate(docId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Run generation steps
   */
  const generate = async (steps: PipelineStep[], instructions?: string) => {
    if (!docId) {
      toast.error("No document ID provided");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get Firebase ID token
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Not authenticated");
      }

      const token = await user.getIdToken();

      // Call generate API
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          docId,
          steps,
          instructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const data = await response.json();
      toast.success(data.message || "Generation completed");

      return data;
    } catch (err) {
      console.error("Generation error:", err);
      const message = err instanceof Error ? err.message : "Generation failed";
      setError(err instanceof Error ? err : new Error(message));
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generate,
    loading,
    error,
  };
}
