"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUploadStore } from "@/lib/upload-store";
import {
  validateFiles,
  ALLOWED_EXTENSIONS,
  formatFileSize,
  MAX_FILE_SIZE,
} from "@/lib/upload-validation";

export function FileDropzone() {
  const addFiles = useUploadStore((state) => state.addFiles);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate files
      const validation = validateFiles(acceptedFiles);

      if (!validation.valid) {
        // Show validation errors
        console.error("Validation errors:", validation.errors);
        // You could show these errors in a toast or alert
        return;
      }

      // Add valid files to upload queue
      addFiles(acceptedFiles);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "application/msword": [".doc"],
        "text/plain": [".txt"],
        "text/markdown": [".md"],
      },
      maxSize: MAX_FILE_SIZE,
      multiple: true,
    });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-200
              ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }
              ${isDragReject ? "border-destructive bg-destructive/5" : ""}
            `}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-4">
              {isDragActive ? (
                <>
                  <Upload className="h-12 w-12 text-primary animate-bounce" />
                  <div>
                    <p className="text-lg font-medium text-primary">
                      Drop files here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Release to upload
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      Drag & drop files here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                </>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Accepted formats: {ALLOWED_EXTENSIONS.join(", ")}</p>
                <p>Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isDragReject && (
        <Alert variant="destructive">
          <AlertDescription>
            Some files were rejected. Please only upload PDF, DOCX, TXT, or MD
            files under {formatFileSize(MAX_FILE_SIZE)}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
