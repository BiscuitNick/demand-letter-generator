import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth-helpers";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * POST /api/upload/metadata
 * Persist upload metadata to Firestore documents/{docId}/sources subcollection
 */
export async function POST(req: NextRequest) {
  try {
    // Require authentication (checks Authorization header)
    const user = await requireAuth(req);

    const body = await req.json();
    const { docId, files } = body;

    // Validate input
    if (!docId || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: docId and files array required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Verify user has access to this document
    const docRef = db.collection("documents").doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const docData = docSnap.data();

    // Check if user is owner or collaborator
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

    // Batch write source metadata
    const batch = db.batch();
    const sourceIds: string[] = [];

    for (const file of files) {
      if (!file.success) {
        continue; // Skip failed uploads
      }

      const sourceRef = docRef.collection("sources").doc();
      sourceIds.push(sourceRef.id);

      batch.set(sourceRef, {
        name: file.fileName,
        type: file.type,
        size: file.size,
        path: file.storagePath,
        signedUrl: file.signedUrl,
        uploadedBy: user.uid,
        uploadedAt: Timestamp.now(),
      });
    }

    // Commit batch
    await batch.commit();

    // Update document's updatedAt timestamp
    await docRef.update({
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      message: "Metadata saved successfully",
      sourceIds,
    });
  } catch (error) {
    console.error("Metadata persistence error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
