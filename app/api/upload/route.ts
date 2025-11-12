import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth-helpers";
import { getAdminStorage } from "@/lib/firebase-admin";
import {
  validateFiles,
  scanFile,
  MAX_TOTAL_SIZE,
  MAX_FILES_PER_UPLOAD,
} from "@/lib/upload-validation";

/**
 * POST /api/upload
 * Upload files to Firebase Storage with authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Require authentication (checks Authorization header)
    const user = await requireAuth(req);

    // Parse multipart form data
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const docId = formData.get("docId") as string;

    // Validate docId is provided
    if (!docId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Validate file count
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json(
        {
          error: `Too many files. Maximum ${MAX_FILES_PER_UPLOAD} files allowed.`,
        },
        { status: 400 }
      );
    }

    // Validate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: "Total upload size exceeds maximum allowed" },
        { status: 400 }
      );
    }

    // Validate files
    const validation = validateFiles(files);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "File validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Get Firebase Storage bucket
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    // Upload files and collect metadata
    const uploadResults = [];

    for (const file of files) {
      try {
        // Generate unique file ID
        const fileId = nanoid();
        const extension = file.name.substring(file.name.lastIndexOf("."));
        const storagePath = `uploads/${user.uid}/${docId}/${fileId}${extension}`;

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Placeholder antivirus scan
        const scanResult = await scanFile(buffer);
        if (!scanResult.safe) {
          uploadResults.push({
            fileName: file.name,
            success: false,
            error: `File failed security scan: ${scanResult.threat}`,
          });
          continue;
        }

        // Upload to Firebase Storage
        const fileRef = bucket.file(storagePath);
        await fileRef.save(buffer, {
          metadata: {
            contentType: file.type,
            metadata: {
              originalName: file.name,
              uploadedBy: user.uid,
              docId,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        // Generate signed URL (valid for 7 days)
        const [signedUrl] = await fileRef.getSignedUrl({
          action: "read",
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        uploadResults.push({
          fileName: file.name,
          success: true,
          fileId,
          storagePath,
          signedUrl,
          size: file.size,
          type: file.type,
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        uploadResults.push({
          fileName: file.name,
          success: false,
          error: "Upload failed",
        });
      }
    }

    // Check if any uploads succeeded
    const successCount = uploadResults.filter((r) => r.success).length;

    return NextResponse.json({
      message: `Successfully uploaded ${successCount} of ${files.length} files`,
      results: uploadResults,
      docId,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
