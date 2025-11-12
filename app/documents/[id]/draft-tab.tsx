"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDocument } from "@/hooks/use-document";
import { useGenerate } from "@/hooks/use-generate";
import { ExportMenu } from "@/components/editor/ExportMenu";
import { Sparkles, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { DEFAULT_TONE_PROMPTS, type TonePreset } from "@/lib/templates/types";
import { toast } from "sonner";
import { db } from "@/lib/firebase-client";
import { doc, updateDoc } from "firebase/firestore";

interface DraftTabProps {
  docId: string;
}

export function DraftTab({ docId }: DraftTabProps) {
  const { document, loading, updateContent } = useDocument(docId);
  const { generate, loading: generating } = useGenerate(docId);
  const [editedContent, setEditedContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Template selection for draft generation
  const [selectedTone, setSelectedTone] = useState<TonePreset>("professional");
  const [customInstructions, setCustomInstructions] = useState("");

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
    // Validate custom instructions if custom is selected
    if (selectedTone === "custom" && !customInstructions.trim()) {
      toast.error("Please provide custom instructions");
      return;
    }

    // Prepare instructions for generation
    // For presets, use the default prompt; for custom, use user input
    const instructions = selectedTone === "custom"
      ? customInstructions.trim()
      : DEFAULT_TONE_PROMPTS[selectedTone as Exclude<TonePreset, "custom">];

    await generate(["compose"], instructions);
  };

  // Get current instructions to display
  const getCurrentInstructions = () => {
    if (selectedTone === "custom") {
      return customInstructions;
    }
    return DEFAULT_TONE_PROMPTS[selectedTone as Exclude<TonePreset, "custom">] || "";
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
            <div className="space-y-6">
              <div className="text-center py-4">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2 font-medium">
                  Ready to compose your demand letter
                </p>
                <p className="text-sm text-muted-foreground">
                  Configure the template and tone below
                </p>
              </div>

              <div className="space-y-4">
                {/* Template and Instructions Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial-template-select">Template</Label>
                    <Select value={selectedTone} onValueChange={(value) => setSelectedTone(value as TonePreset)}>
                      <SelectTrigger id="initial-template-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="assertive">Assertive</SelectItem>
                        <SelectItem value="empathetic">Empathetic</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="initial-instructions">Instructions</Label>
                    <Textarea
                      id="initial-instructions"
                      value={getCurrentInstructions()}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      rows={3}
                      readOnly={selectedTone !== "custom"}
                      className={selectedTone !== "custom" ? "bg-muted cursor-not-allowed" : ""}
                      placeholder={selectedTone === "custom" ? "Enter custom tone instructions..." : ""}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerateDraft}
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generating ? "Composing..." : "Compose Draft"}
                </Button>
              </div>
            </div>
          )}

          {content && (
            <div className="space-y-4">
              {/* Template and Instructions Controls */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div className="space-y-2">
                  <Label htmlFor="template-select">Template</Label>
                  <Select value={selectedTone} onValueChange={(value) => setSelectedTone(value as TonePreset)}>
                    <SelectTrigger id="template-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="assertive">Assertive</SelectItem>
                      <SelectItem value="empathetic">Empathetic</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={getCurrentInstructions()}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={3}
                    readOnly={selectedTone !== "custom"}
                    className={selectedTone !== "custom" ? "bg-muted cursor-not-allowed" : ""}
                    placeholder={selectedTone === "custom" ? "Enter custom tone instructions..." : ""}
                  />
                </div>
              </div>

              <Textarea
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Your demand letter will appear here..."
              />

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button onClick={handleGenerateDraft} disabled={generating} variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? "Generating..." : "Regenerate Draft"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {editedContent.split(/\s+/).filter(Boolean).length} words
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
