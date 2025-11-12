"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/file-dropzone";
import { FileUploadList } from "@/components/file-upload-list";
import { useUploadStore } from "@/lib/upload-store";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useSources } from "@/hooks/use-sources";
import { Upload, Trash2, FileText, Loader2, Save } from "lucide-react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { toast } from "sonner";

interface UploadTabProps {
  docId: string;
}

export function UploadTab({ docId }: UploadTabProps) {
  const setDocId = useUploadStore((state) => state.setDocId);
  const clearAll = useUploadStore((state) => state.clearAll);
  const { uploadAll, isUploading, pendingCount } = useFileUpload();
  const { sources, loading: loadingSources, deleteSource, hasSources } = useSources(docId);

  // Manual text entry state
  const [manualText, setManualText] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [isSavingText, setIsSavingText] = useState(false);

  // Set document ID when component mounts
  useEffect(() => {
    setDocId(docId);

    // Cleanup on unmount
    return () => {
      clearAll();
    };
  }, [docId, setDocId, clearAll]);

  const handleSaveManualText = async () => {
    if (!manualText.trim()) {
      toast.error("Please enter some text");
      return;
    }

    // Use a simpler default title without timestamp to avoid date confusion
    const entryNumber = sources.filter((s: any) => s.isManualEntry).length + 1;
    const title = textTitle.trim() || `Manual Text Entry ${entryNumber}`;

    setIsSavingText(true);
    try {
      // Create a new source document
      const sourceId = `text-${Date.now()}`;
      const sourceRef = doc(db, "documents", docId, "sources", sourceId);

      await setDoc(sourceRef, {
        name: title,
        type: "text/plain",
        size: new Blob([manualText]).size,
        path: `manual/${sourceId}`, // Virtual path for manual entries
        content: manualText, // Store the actual text content
        uploadedAt: serverTimestamp(),
        uploadedBy: "user", // You can replace with actual user ID from auth
        isManualEntry: true, // Flag to identify manual entries
      });

      toast.success("Text saved successfully");
      setManualText("");
      setTextTitle("");
    } catch (error) {
      console.error("Error saving manual text:", error);
      toast.error("Failed to save text");
    } finally {
      setIsSavingText(false);
    }
  };

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

      {/* Manual Text Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Add Text Manually</CardTitle>
          <CardDescription>
            Paste or type text directly instead of uploading a file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-title">Title (optional)</Label>
            <Input
              id="text-title"
              placeholder="e.g., Email correspondence, Notes, etc."
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-text">Text Content</Label>
            <Textarea
              id="manual-text"
              placeholder="Paste or type your text here..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          <Button
            onClick={handleSaveManualText}
            disabled={isSavingText || !manualText.trim()}
          >
            {isSavingText ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Text
              </>
            )}
          </Button>
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
