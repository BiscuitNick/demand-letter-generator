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
import { Sparkles, FileText, Wand2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DEFAULT_TONE_PROMPTS, TONE_PRESET_LABELS, TONE_PRESET_DESCRIPTIONS, type TonePreset } from "@/lib/templates/types";
import { toast } from "sonner";

interface DraftTabProps {
  docId: string;
}

export function DraftTab({ docId }: DraftTabProps) {
  const { document, loading, updateContent } = useDocument(docId);
  const { generate, loading: generating } = useGenerate(docId);
  const [editedContent, setEditedContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Tone refinement state
  const [selectedTone, setSelectedTone] = useState<TonePreset>("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isRefining, setIsRefining] = useState(false);

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

  const handleRefine = async () => {
    if (!content) {
      toast.error("No content to refine");
      return;
    }

    const instructions = selectedTone === "custom" ? customInstructions.trim() : undefined;

    if (selectedTone === "custom" && !instructions) {
      toast.error("Please provide custom instructions");
      return;
    }

    setIsRefining(true);
    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId,
          tonePreset: selectedTone !== "custom" ? selectedTone : undefined,
          instructions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refine document");
      }

      toast.success("Document refined successfully");
      // Content will be updated via the document listener
    } catch (error) {
      console.error("Error refining document:", error);
      toast.error("Failed to refine document");
    } finally {
      setIsRefining(false);
    }
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

      {/* Tone Refinement */}
      {content && (
        <Card>
          <CardHeader>
            <CardTitle>Adjust Tone & Style</CardTitle>
            <CardDescription>
              Refine the tone and style of your generated letter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tone-preset">Tone Preset</Label>
              <Select value={selectedTone} onValueChange={(value) => setSelectedTone(value as TonePreset)}>
                <SelectTrigger id="tone-preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">
                    <div>
                      <div className="font-medium">Professional</div>
                      <div className="text-xs text-muted-foreground">
                        {TONE_PRESET_DESCRIPTIONS.professional}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="assertive">
                    <div>
                      <div className="font-medium">Assertive</div>
                      <div className="text-xs text-muted-foreground">
                        {TONE_PRESET_DESCRIPTIONS.assertive}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="empathetic">
                    <div>
                      <div className="font-medium">Empathetic</div>
                      <div className="text-xs text-muted-foreground">
                        {TONE_PRESET_DESCRIPTIONS.empathetic}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div>
                      <div className="font-medium">Custom</div>
                      <div className="text-xs text-muted-foreground">
                        Define your own custom tone and style
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedTone === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="custom-instructions">Custom Instructions</Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="Describe the tone and style you want..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {selectedTone !== "custom" && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="font-medium mb-1">Default Instructions:</p>
                <p className="text-muted-foreground">
                  {DEFAULT_TONE_PROMPTS[selectedTone as Exclude<TonePreset, "custom">]}
                </p>
              </div>
            )}

            <Button onClick={handleRefine} disabled={isRefining} className="w-full">
              {isRefining ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Refine Tone & Style
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
