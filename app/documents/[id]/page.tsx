'use client'

import { use, useState } from 'react';
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDocument } from "@/hooks/use-document";
import { Pencil, Check, X } from "lucide-react";
import { UploadTab } from "./upload-tab";
import { FactsTab } from "./facts-tab";
import { OutlineTab } from "./outline-tab";
import { DraftTab } from "./draft-tab";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DocumentPage({ params }: DocumentPageProps) {
  return (
    <ProtectedRoute>
      <DocumentPageContent params={params} />
    </ProtectedRoute>
  );
}

function DocumentPageContent({ params }: DocumentPageProps) {
  const { id } = use(params);
  const { document, loading, updateTitle } = useDocument(id);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  const handleStartEdit = () => {
    setEditedTitle(document?.title || "");
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim()) {
      await updateTitle(editedTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {isEditingTitle ? (
            <>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-4xl font-bold h-auto py-2"
                autoFocus
                placeholder="Enter document title"
              />
              <Button onClick={handleSaveTitle} size="icon" variant="ghost">
                <Check className="h-5 w-5 text-green-600" />
              </Button>
              <Button onClick={handleCancelEdit} size="icon" variant="ghost">
                <X className="h-5 w-5 text-red-600" />
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold">
                {loading ? "Loading..." : document?.title || "Untitled Document"}
              </h1>
              <Button
                onClick={handleStartEdit}
                size="icon"
                variant="ghost"
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <p className="text-muted-foreground">
          Follow the steps to create your demand letter: Upload → Facts → Outline → Draft
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="facts">Facts</TabsTrigger>
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <UploadTab docId={id} />
        </TabsContent>

        <TabsContent value="facts" className="space-y-4">
          <FactsTab docId={id} />
        </TabsContent>

        <TabsContent value="outline" className="space-y-4">
          <OutlineTab docId={id} />
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <DraftTab docId={id} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
