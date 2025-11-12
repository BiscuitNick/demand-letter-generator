import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getAdminDb } from "@/lib/firebase-admin";
import { loadDocuments } from "@/lib/ai/document-loader";
import { extractFacts, generateOutline, composeLetter } from "@/lib/ai/pipeline";
import type { PipelineStep } from "@/lib/ai/types";
import { Timestamp } from "firebase-admin/firestore";

/**
 * POST /api/generate
 * Run AI pipeline steps (extract, outline, compose) for a document
 */
export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    const body = await req.json();
    const { docId, steps, instructions } = body as {
      docId: string;
      steps: PipelineStep[];
      instructions?: string;
    };

    // Validate input
    if (!docId || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: "docId and steps array required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docRef = db.collection("documents").doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const docData = docSnap.data();

    // Check permissions
    const isOwner = docData?.ownerId === user.uid;
    const isCollaborator = docData?.collaborators?.some(
      (c: { uid: string }) => c.uid === user.uid
    );

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { error: "Forbidden: No access to this document" },
        { status: 403 }
      );
    }

    // Process each step
    for (const step of steps) {
      await docRef.update({
        status: getStatusForStep(step),
        updatedAt: Timestamp.now(),
      });

      switch (step) {
        case "extract": {
          // Load source documents
          const sourcesSnap = await docRef.collection("sources").get();
          const storagePaths = sourcesSnap.docs
            .map((doc) => doc.data().path)
            .filter(Boolean);

          if (storagePaths.length === 0) {
            throw new Error("No source documents found");
          }

          const documents = await loadDocuments(storagePaths);

          // Extract facts
          const extractorResult = await extractFacts({
            documents: documents.map((doc) => ({
              name: doc.name,
              content: doc.content,
              type: doc.type,
            })),
            instructions,
          });

          // Store facts in Firestore
          await docRef.update({
            facts: extractorResult.facts.map((fact) => ({
              id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: fact.text,
              sourceFile: fact.sourceFile,
              verified: false,
              marked: true,
              createdAt: Timestamp.now(),
            })),
            updatedAt: Timestamp.now(),
          });

          break;
        }

        case "outline": {
          // Get facts from Firestore
          const currentData = (await docRef.get()).data();
          const facts = currentData?.facts || [];

          if (facts.length === 0) {
            throw new Error("No facts available. Run extract step first.");
          }

          // Generate outline
          const outlinerResult = await generateOutline({
            facts: facts.map((f: { text: string; sourceFile?: string }) => ({
              text: f.text,
              sourceFile: f.sourceFile,
              confidence: 0.8,
            })),
            instructions,
          });

          // Store outline in Firestore
          await docRef.update({
            outline: outlinerResult.sections.map((section, idx) => ({
              id: section.id || `section-${idx + 1}`,
              title: section.title,
              order: section.order || idx + 1,
              notes: section.description,
            })),
            updatedAt: Timestamp.now(),
          });

          break;
        }

        case "compose": {
          // Get outline and facts from Firestore
          const currentData = (await docRef.get()).data();
          const outline = currentData?.outline || [];
          const facts = currentData?.facts || [];

          if (outline.length === 0) {
            throw new Error("No outline available. Run outline step first.");
          }

          // Compose letter
          const composerResult = await composeLetter({
            outline: outline.map((s: { id: string; title: string; order: number; notes?: string }) => ({
              id: s.id,
              title: s.title,
              order: s.order,
              description: s.notes,
            })),
            facts: facts.map((f: { text: string; sourceFile?: string }) => ({
              text: f.text,
              sourceFile: f.sourceFile,
              confidence: 0.8,
            })),
            tone: "professional",
            instructions,
          });

          // Store composed content in Firestore
          await docRef.update({
            content: composerResult.content,
            updatedAt: Timestamp.now(),
          });

          break;
        }

        default:
          throw new Error(`Unknown step: ${step}`);
      }
    }

    // Update final status
    await docRef.update({
      status: "complete",
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      message: "Pipeline completed successfully",
      docId,
      stepsCompleted: steps,
    });
  } catch (error) {
    console.error("Generate error:", error);

    const message = error instanceof Error ? error.message : "Pipeline failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Helper to get document status for a given step
 */
function getStatusForStep(step: PipelineStep): string {
  switch (step) {
    case "extract":
      return "extracting";
    case "outline":
      return "outlining";
    case "compose":
      return "composing";
    default:
      return "draft";
  }
}
