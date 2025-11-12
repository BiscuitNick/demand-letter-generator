import { getAdminStorage } from "../firebase-admin";

/**
 * Loaded document with content
 */
export interface LoadedDocument {
  name: string;
  content: string;
  type: string;
  size: number;
}

/**
 * Parse PDF buffer to text
 * TODO: Implement proper PDF parsing with pdf-parse or similar
 */
async function parsePDF(buffer: Buffer): Promise<string> {
  // Placeholder implementation
  // In production, use a proper PDF parsing library
  console.log("PDF parsing not yet implemented. Returning placeholder text.");
  return `[PDF Document - ${buffer.length} bytes]\nPDF text extraction is not yet implemented. Please use plain text or DOCX files, or implement PDF parsing with a library like pdf-parse.`;
}

/**
 * Load and extract text from a file in Firebase Storage
 */
export async function loadDocument(storagePath: string): Promise<LoadedDocument> {
  const storage = getAdminStorage();
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  // Get file metadata
  const [metadata] = await file.getMetadata();
  const contentType = metadata.contentType || "text/plain";
  const originalName = metadata.metadata?.originalName;
  const name = typeof originalName === "string" ? originalName : file.name;

  // Download file
  const [buffer] = await file.download();

  // Extract text based on file type
  let content: string;

  if (contentType === "application/pdf") {
    // Parse PDF
    content = await parsePDF(buffer);
  } else if (
    contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    contentType === "application/msword"
  ) {
    // For DOCX/DOC, we'd need a library like mammoth
    // For now, treat as text or return a placeholder
    content = buffer.toString("utf-8");
  } else if (contentType === "text/plain") {
    // Plain text
    content = buffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported file type: ${contentType}`);
  }

  return {
    name,
    content: content.trim(),
    type: contentType,
    size: buffer.length,
  };
}

/**
 * Load multiple documents from Firebase Storage
 */
export async function loadDocuments(
  storagePaths: string[]
): Promise<LoadedDocument[]> {
  const loadPromises = storagePaths.map((path) => loadDocument(path));
  return Promise.all(loadPromises);
}

/**
 * Chunk text into smaller pieces for processing
 * Simple implementation - split on paragraphs and limit by token count
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 4000
): string[] {
  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    // Rough token estimation (1 token ≈ 4 characters)
    const estimatedTokens = (currentChunk + paragraph).length / 4;

    if (estimatedTokens > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
