"use client";

import { useUploadStore } from "@/lib/upload-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { formatFileSize } from "@/lib/upload-validation";

export function FileUploadList() {
  const files = useUploadStore((state) => state.files);
  const removeFile = useUploadStore((state) => state.removeFile);
  const retryFile = useUploadStore((state) => state.retryFile);

  if (files.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Upload Queue</span>
          <Badge variant="secondary">{files.length} files</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {files.map((uploadFile) => (
          <div
            key={uploadFile.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
          >
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadFile.file.size)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {uploadFile.status === "pending" && (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                  {uploadFile.status === "uploading" && (
                    <Badge variant="secondary">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Uploading
                    </Badge>
                  )}
                  {uploadFile.status === "success" && (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                  {uploadFile.status === "error" && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}

                  {uploadFile.status === "error" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => retryFile(uploadFile.id)}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}

                  {(uploadFile.status === "pending" ||
                    uploadFile.status === "error") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {uploadFile.status === "uploading" && (
                <Progress value={uploadFile.progress} className="h-1.5" />
              )}

              {uploadFile.error && (
                <p className="text-xs text-destructive mt-1">
                  {uploadFile.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
