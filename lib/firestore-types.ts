import type { Timestamp } from "firebase/firestore";

/**
 * Document status in the workflow pipeline.
 */
export type DocumentStatus = "draft" | "extracting" | "outlining" | "composing" | "reviewing" | "complete";

/**
 * Fact extracted from source documents.
 */
export interface Fact {
  id: string;
  text: string;
  sourceFile?: string;
  verified: boolean;
  marked?: boolean; // For user review/selection
  createdAt: Timestamp;
}

/**
 * Section in the document outline.
 */
export interface OutlineSection {
  id: string;
  title: string;
  order: number;
  notes?: string;
}

/**
 * Source document metadata.
 */
export interface SourceDocument {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  path: string; // Storage path
  signedUrl?: string;
  uploadedAt: Timestamp;
}

/**
 * Collaborator on a document.
 */
export interface Collaborator {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: "owner" | "editor" | "viewer";
  addedAt: Timestamp;
}

/**
 * Main document schema for demand letters.
 */
export interface Document {
  id?: string; // Firestore document ID
  title: string;
  status: DocumentStatus;

  // Workflow data
  sources: SourceDocument[];
  facts: Fact[];
  outline: OutlineSection[];
  content?: string; // Y.js content or final draft

  // Metadata
  ownerId: string;
  collaborators: Collaborator[];
  templateId?: string;
  version: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Comment on a document.
 */
export interface Comment {
  id?: string; // Firestore document ID
  docId: string; // Reference to parent document

  // Comment content
  text: string;
  resolved: boolean;

  // Position in document (for anchored comments)
  range?: {
    from: number;
    to: number;
  };

  // Author info
  authorId: string;
  authorName?: string;
  authorPhoto?: string;

  // Thread support
  parentId?: string; // For replies
  replies?: Comment[];

  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Template for tone/style presets.
 */
export interface Template {
  id?: string; // Firestore document ID
  name: string;
  description?: string;

  // Prompt configuration
  tonePrompt: string; // AI prompt for tone adjustment

  // Preset type
  preset?: "professional" | "assertive" | "empathetic" | "custom";

  // Ownership
  userId: string; // Owner of the template
  isPublic: boolean; // Whether others can use it

  // Usage stats
  usageCount?: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
