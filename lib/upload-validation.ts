/**
 * File upload validation utilities
 * Shared between client and server for consistent validation
 */

/**
 * Allowed MIME types for uploads
 */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "text/plain",
] as const;

/**
 * Allowed file extensions
 */
export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"] as const;

/**
 * Maximum file size (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Maximum total upload size (200MB)
 */
export const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB in bytes

/**
 * Maximum number of files per upload
 */
export const MAX_FILES_PER_UPLOAD = 20;

/**
 * Validation error types
 */
export type ValidationErrorType =
  | "invalid_type"
  | "file_too_large"
  | "too_many_files"
  | "total_size_exceeded"
  | "invalid_extension";

/**
 * Validation error
 */
export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  fileName?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : "";
}

/**
 * Validate a single file
 */
export function validateFile(file: File): ValidationResult {
  const errors: ValidationError[] = [];

  // Check file extension
  const extension = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    errors.push({
      type: "invalid_extension",
      message: `File extension "${extension}" is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
      fileName: file.name,
    });
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    errors.push({
      type: "invalid_type",
      message: `File type "${file.type}" is not allowed. Please upload PDF, DOCX, or TXT files.`,
      fileName: file.name,
    });
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      type: "file_too_large",
      message: `File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`,
      fileName: file.name,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[]): ValidationResult {
  const errors: ValidationError[] = [];

  // Check file count
  if (files.length > MAX_FILES_PER_UPLOAD) {
    errors.push({
      type: "too_many_files",
      message: `Too many files. Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload.`,
    });
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    errors.push({
      type: "total_size_exceeded",
      message: `Total upload size (${formatFileSize(totalSize)}) exceeds maximum of ${formatFileSize(MAX_TOTAL_SIZE)}.`,
    });
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file);
    errors.push(...result.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Placeholder antivirus scan function
 * TODO: Integrate with actual antivirus service (e.g., ClamAV, VirusTotal)
 */
export async function scanFile(_file: File | Buffer): Promise<{
  safe: boolean;
  threat?: string;
}> {
  // Placeholder implementation - always returns safe
  // In production, integrate with antivirus API
  console.log("Scanning file for viruses (placeholder)");

  // Simulate async scan
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    safe: true,
  };
}
