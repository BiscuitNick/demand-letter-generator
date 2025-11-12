"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDocument } from "@/hooks/use-document";
import { useSources } from "@/hooks/use-sources";
import { useGenerate } from "@/hooks/use-generate";
import { Sparkles, FileText, Plus, Edit, Trash2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";

interface FactsTabProps {
  docId: string;
}

export function FactsTab({ docId }: FactsTabProps) {
  const { document, loading, updateFacts } = useDocument(docId);
  const { hasSources, loading: loadingSources } = useSources(docId);
  const { generate, loading: generating } = useGenerate(docId);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFact, setEditingFact] = useState<any>(null);
  const [factText, setFactText] = useState("");
  const [factSource, setFactSource] = useState("");

  const handleToggleFact = async (factId: string) => {
    if (!document?.facts) return;

    const updatedFacts = document.facts.map((fact) =>
      fact.id === factId ? { ...fact, marked: !fact.marked } : fact
    );

    await updateFacts(updatedFacts);
  };

  const handleGenerateFacts = async () => {
    await generate(["extract"]);
  };

  const handleAddFact = () => {
    setEditingFact(null);
    setFactText("");
    setFactSource("");
    setIsDialogOpen(true);
  };

  const handleEditFact = (fact: any) => {
    setEditingFact(fact);
    setFactText(fact.text);
    setFactSource(fact.sourceFile || "");
    setIsDialogOpen(true);
  };

  const handleDeleteFact = async (factId: string) => {
    if (!document?.facts) return;
    if (!confirm("Are you sure you want to delete this fact?")) return;

    const updatedFacts = document.facts.filter((fact) => fact.id !== factId);
    await updateFacts(updatedFacts);
  };

  const handleSaveFact = async () => {
    if (!document?.facts) return;
    if (!factText.trim()) return;

    let updatedFacts;

    if (editingFact) {
      // Update existing fact
      updatedFacts = document.facts.map((fact) => {
        if (fact.id === editingFact.id) {
          const updated: any = { ...fact, text: factText };
          // Only include sourceFile if it has a value
          if (factSource && factSource.trim()) {
            updated.sourceFile = factSource;
          } else {
            // Remove sourceFile if it was cleared
            delete updated.sourceFile;
          }
          return updated;
        }
        return fact;
      });
    } else {
      // Add new fact
      const newFact: any = {
        id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: factText,
        verified: false,
        marked: true,
        createdAt: Timestamp.now(),
      };
      // Only include sourceFile if it has a value
      if (factSource && factSource.trim()) {
        newFact.sourceFile = factSource;
      }
      updatedFacts = [...document.facts, newFact];
    }

    await updateFacts(updatedFacts);
    setIsDialogOpen(false);
    setFactText("");
    setFactSource("");
    setEditingFact(null);
  };

  if (loading || loadingSources) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading facts...</p>
        </CardContent>
      </Card>
    );
  }

  const facts = document?.facts || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Extracted Facts</CardTitle>
              <CardDescription>
                Review and select the facts to include in your demand letter
              </CardDescription>
            </div>
            <Button onClick={handleAddFact} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Fact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasSources && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No source documents uploaded yet
              </p>
              <p className="text-sm text-muted-foreground">
                Upload documents in the Upload tab to extract facts
              </p>
            </div>
          )}

          {hasSources && facts.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No facts extracted yet
              </p>
              <Button onClick={handleGenerateFacts} disabled={generating}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Extracting..." : "Extract Facts"}
              </Button>
            </div>
          )}

          {facts.length > 0 && (
            <div className="space-y-3">
              {facts.map((fact) => (
                <div
                  key={fact.id}
                  className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={fact.marked}
                    onCheckedChange={() => handleToggleFact(fact.id)}
                    className="mt-1"
                  />

                  <div className="flex-1 space-y-2">
                    <p className="text-sm">{fact.text}</p>

                    <div className="flex items-center gap-2">
                      {fact.sourceFile && (
                        <Badge variant="secondary" className="text-xs">
                          {fact.sourceFile}
                        </Badge>
                      )}
                      {fact.verified && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditFact(fact)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFact(fact.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {facts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {facts.filter((f) => f.marked).length} of {facts.length} facts selected
                </p>
                <p className="text-sm text-muted-foreground">
                  Continue to Outline to structure your letter
                </p>
              </div>
              <Button onClick={handleGenerateFacts} disabled={generating} variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Re-extract Facts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Fact Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFact ? "Edit Fact" : "Add New Fact"}</DialogTitle>
            <DialogDescription>
              {editingFact ? "Update the fact details below." : "Enter the details for the new fact."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fact-text">
                Fact Text <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="fact-text"
                placeholder="Enter the fact..."
                value={factText}
                onChange={(e) => setFactText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fact-source">Source (optional)</Label>
              <Input
                id="fact-source"
                placeholder="e.g., email.pdf, contract.docx"
                value={factSource}
                onChange={(e) => setFactSource(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFact} disabled={!factText.trim()}>
              {editingFact ? "Update" : "Add"} Fact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
