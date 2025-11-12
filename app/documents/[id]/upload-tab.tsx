"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/file-dropzone";
import { FileUploadList } from "@/components/file-upload-list";
import { useUploadStore } from "@/lib/upload-store";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Upload } from "lucide-react";

interface UploadTabProps {
  docId: string;
}

export function UploadTab({ docId }: UploadTabProps) {
  const setDocId = useUploadStore((state) => state.setDocId);
  const clearAll = useUploadStore((state) => state.clearAll);
  const { uploadAll, isUploading, pendingCount } = useFileUpload();

  // Set document ID when component mounts
  useEffect(() => {
    setDocId(docId);

    // Cleanup on unmount
    return () => {
      clearAll();
    };
  }, [docId, setDocId, clearAll]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Source Documents</CardTitle>
          <CardDescription>
            Upload PDF, DOCX, or TXT files containing the information for your demand letter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileDropzone />
        </CardContent>
      </Card>

      <FileUploadList />

      {pendingCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to upload</p>
                <p className="text-sm text-muted-foreground">
                  {pendingCount} file{pendingCount !== 1 ? "s" : ""} pending
                </p>
              </div>
              <Button
                onClick={uploadAll}
                disabled={isUploading}
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload All Files"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
