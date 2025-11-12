"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useDocument } from "@/hooks/use-document";
import { useGenerate } from "@/hooks/use-generate";
import { Sparkles, GripVertical, Edit2, Check, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { OutlineSection } from "@/lib/firestore-types";

interface OutlineTabProps {
  docId: string;
}

function SortableSection({ section, onEdit, onToggle }: { section: OutlineSection; onEdit: (section: OutlineSection) => void; onToggle: (sectionId: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSection, setEditedSection] = useState(section);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onEdit(editedSection);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSection(section);
    setIsEditing(false);
  };

  const isEnabled = (section as any).enabled !== false; // Default to enabled

  return (
    <div ref={setNodeRef} style={style} className={`flex items-start gap-3 p-4 rounded-lg border bg-card ${!isEnabled ? 'opacity-50' : ''}`}>
      <Checkbox
        checked={isEnabled}
        onCheckedChange={() => onToggle(section.id)}
        className="mt-1"
      />

      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1 space-y-2">
        {isEditing ? (
          <>
            <Input
              value={editedSection.title}
              onChange={(e) => setEditedSection({ ...editedSection, title: e.target.value })}
              placeholder="Section title"
            />
            <Textarea
              value={editedSection.notes || ""}
              onChange={(e) => setEditedSection({ ...editedSection, notes: e.target.value })}
              placeholder="Notes for this section"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {section.order}. {section.title}
                </p>
                {section.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{section.notes}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function OutlineTab({ docId }: OutlineTabProps) {
  const { document, loading, updateOutline } = useDocument(docId);
  const { generate, loading: generating } = useGenerate(docId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !document?.outline) {
      return;
    }

    const oldIndex = document.outline.findIndex((s) => s.id === active.id);
    const newIndex = document.outline.findIndex((s) => s.id === over.id);

    const reorderedOutline = arrayMove(document.outline, oldIndex, newIndex).map(
      (section, index) => ({
        ...section,
        order: index + 1,
      })
    );

    await updateOutline(reorderedOutline);
  };

  const handleEditSection = async (updatedSection: OutlineSection) => {
    if (!document?.outline) return;

    const updatedOutline = document.outline.map((section) =>
      section.id === updatedSection.id ? updatedSection : section
    );

    await updateOutline(updatedOutline);
  };

  const handleToggleSection = async (sectionId: string) => {
    if (!document?.outline) return;

    const updatedOutline = document.outline.map((section) => {
      if (section.id === sectionId) {
        const currentEnabled = (section as any).enabled !== false;
        return { ...section, enabled: !currentEnabled } as any;
      }
      return section;
    });

    await updateOutline(updatedOutline);
  };

  const handleGenerateOutline = async () => {
    await generate(["outline"]);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading outline...</p>
        </CardContent>
      </Card>
    );
  }

  const outline = document?.outline || [];
  const hasFacts = document?.facts && document.facts.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Outline</CardTitle>
          <CardDescription>
            Structure your demand letter. Drag sections to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasFacts && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No facts available yet
              </p>
              <p className="text-sm text-muted-foreground">
                Extract facts first in the Facts tab
              </p>
            </div>
          )}

          {hasFacts && outline.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No outline generated yet
              </p>
              <Button onClick={handleGenerateOutline} disabled={generating}>
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "Generate Outline"}
              </Button>
            </div>
          )}

          {outline.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={outline.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {outline.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      onEdit={handleEditSection}
                      onToggle={handleToggleSection}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {outline.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{outline.length} sections</p>
                <p className="text-sm text-muted-foreground">
                  Continue to Draft to compose the letter
                </p>
              </div>
              <Button onClick={handleGenerateOutline} disabled={generating} variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate Outline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
