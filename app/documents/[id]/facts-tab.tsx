"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useDocument } from "@/hooks/use-document";
import { useGenerate } from "@/hooks/use-generate";
import { Sparkles, FileText } from "lucide-react";

interface FactsTabProps {
  docId: string;
}

export function FactsTab({ docId }: FactsTabProps) {
  const { document, loading, updateFacts } = useDocument(docId);
  const { generate, loading: generating } = useGenerate(docId);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading facts...</p>
        </CardContent>
      </Card>
    );
  }

  const facts = document?.facts || [];
  const hasSources = document?.sources && document.sources.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Extracted Facts</CardTitle>
          <CardDescription>
            Review and select the facts to include in your demand letter
          </CardDescription>
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
    </div>
  );
}
