"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDocument } from "@/hooks/use-document";
import { useGenerate } from "@/hooks/use-generate";
import { ExportMenu } from "@/components/editor/ExportMenu";
import { Sparkles, FileText } from "lucide-react";
import { useState, useEffect } from "react";

interface DraftTabProps {
  docId: string;
}

export function DraftTab({ docId }: DraftTabProps) {
  const { document, loading, updateContent } = useDocument(docId);
  const { generate, loading: generating } = useGenerate(docId);
  const [editedContent, setEditedContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (document?.content) {
      setEditedContent(document.content);
    }
  }, [document?.content]);

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setHasChanges(value !== document?.content);
  };

  const handleSave = async () => {
    await updateContent(editedContent);
    setHasChanges(false);
  };

  const handleGenerateDraft = async () => {
    await generate(["compose"]);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading draft...</p>
        </CardContent>
      </Card>
    );
  }

  const hasOutline = document?.outline && document.outline.length > 0;
  const content = document?.content || "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Draft Letter</CardTitle>
              <CardDescription>
                Review and edit your generated demand letter
              </CardDescription>
            </div>
            {content && (
              <div className="flex gap-2">
                {hasChanges && (
                  <Button onClick={handleSave} variant="default">
                    Save Changes
                  </Button>
                )}
                <ExportMenu docId={docId} />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasOutline && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No outline available yet
              </p>
              <p className="text-sm text-muted-foreground">
                Create an outline first in the Outline tab
              </p>
            </div>
          )}

          {hasOutline && !content && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No draft generated yet
              </p>
              <Button onClick={handleGenerateDraft} disabled={generating}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Composing..." : "Compose Draft"}
              </Button>
            </div>
          )}

          {content && (
            <div className="space-y-4">
              <Textarea
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Your demand letter will appear here..."
              />

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {editedContent.split(/\s+/).filter(Boolean).length} words
                </p>
                <Button onClick={handleGenerateDraft} disabled={generating} variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate Draft
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
