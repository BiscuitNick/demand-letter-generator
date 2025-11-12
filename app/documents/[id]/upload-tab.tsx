"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/file-dropzone";
import { FileUploadList } from "@/components/file-upload-list";
import { useUploadStore } from "@/lib/upload-store";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useSources } from "@/hooks/use-sources";
import { Upload, Trash2, FileText, Loader2 } from "lucide-react";

interface UploadTabProps {
  docId: string;
}

export function UploadTab({ docId }: UploadTabProps) {
  const setDocId = useUploadStore((state) => state.setDocId);
  const clearAll = useUploadStore((state) => state.clearAll);
  const { uploadAll, isUploading, pendingCount } = useFileUpload();
  const { sources, loading: loadingSources, deleteSource, hasSources } = useSources(docId);

  // Set document ID when component mounts
  useEffect(() => {
    setDocId(docId);

    // Cleanup on unmount
    return () => {
      clearAll();
    };
  }, [docId, setDocId, clearAll]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Source Documents</CardTitle>
          <CardDescription>
            Upload PDF, DOCX, TXT, or MD files containing the information for your demand letter
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

      {/* Uploaded Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            Source documents saved for this demand letter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSources ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasSources ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No documents uploaded yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium truncate">{source.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {source.type}
                        </Badge>
                        <span>{formatFileSize(source.size)}</span>
                        <span>•</span>
                        <span>{formatDate(source.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete ${source.name}?`)) {
                        deleteSource(source.id);
                      }
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
