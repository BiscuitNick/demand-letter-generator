import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  Timestamp,
} from "firebase/firestore";
import type { Document, Comment, Template } from "./firestore-types";

/**
 * Firestore converter for Document type.
 * Handles serialization/deserialization between Firestore and TypeScript types.
 */
export const documentConverter: FirestoreDataConverter<Document> = {
  toFirestore(document: Document): DocumentData {
    const { id: _id, ...data } = document;
    return {
      ...data,
      updatedAt: Timestamp.now(),
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Document {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      title: data.title,
      status: data.status,
      sources: data.sources ?? [],
      facts: data.facts ?? [],
      outline: data.outline ?? [],
      content: data.content,
      ownerId: data.ownerId,
      collaborators: data.collaborators ?? [],
      templateId: data.templateId,
      version: data.version ?? 1,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

/**
 * Firestore converter for Comment type.
 * Handles nested replies and range serialization.
 */
export const commentConverter: FirestoreDataConverter<Comment> = {
  toFirestore(comment: Comment): DocumentData {
    const { id: _id, ...data } = comment;
    return {
      ...data,
      updatedAt: Timestamp.now(),
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Comment {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      docId: data.docId,
      text: data.text,
      resolved: data.resolved ?? false,
      range: data.range,
      authorId: data.authorId,
      authorName: data.authorName,
      authorPhoto: data.authorPhoto,
      parentId: data.parentId,
      replies: data.replies ?? [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

/**
 * Firestore converter for Template type.
 * Handles preset validation and usage tracking.
 */
export const templateConverter: FirestoreDataConverter<Template> = {
  toFirestore(template: Template): DocumentData {
    const { id: _id, ...data } = template;
    return {
      ...data,
      updatedAt: Timestamp.now(),
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Template {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name,
      description: data.description,
      tonePrompt: data.tonePrompt,
      preset: data.preset,
      userId: data.userId,
      isPublic: data.isPublic ?? false,
      usageCount: data.usageCount ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};
