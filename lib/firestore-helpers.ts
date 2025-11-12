import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase-client";
import {
  documentConverter,
  commentConverter,
  templateConverter,
} from "./firestore-converters";
import type { Document, Comment, Template } from "./firestore-types";

/**
 * Get a typed collection reference for documents.
 */
export function getDocumentsCollection(): CollectionReference<Document> {
  return collection(db, "documents").withConverter(documentConverter);
}

/**
 * Get a typed document reference for a specific document.
 */
export function getDocumentRef(docId: string): DocumentReference<Document> {
  return doc(db, "documents", docId).withConverter(documentConverter);
}

/**
 * Get a typed collection reference for comments.
 */
export function getCommentsCollection(): CollectionReference<Comment> {
  return collection(db, "comments").withConverter(commentConverter);
}

/**
 * Get a typed document reference for a specific comment.
 */
export function getCommentRef(commentId: string): DocumentReference<Comment> {
  return doc(db, "comments", commentId).withConverter(commentConverter);
}

/**
 * Get a typed collection reference for comments on a specific document.
 * Uses a subcollection under the document.
 */
export function getDocumentCommentsCollection(
  docId: string
): CollectionReference<Comment> {
  return collection(db, "documents", docId, "comments").withConverter(
    commentConverter
  );
}

/**
 * Get a typed collection reference for templates.
 */
export function getTemplatesCollection(): CollectionReference<Template> {
  return collection(db, "templates").withConverter(templateConverter);
}

/**
 * Get a typed document reference for a specific template.
 */
export function getTemplateRef(templateId: string): DocumentReference<Template> {
  return doc(db, "templates", templateId).withConverter(templateConverter);
}

/**
 * Get a typed collection reference for source documents subcollection.
 * This is stored as a subcollection under each document.
 */
export function getSourcesCollection(
  docId: string
): CollectionReference<DocumentData> {
  return collection(db, "documents", docId, "sources");
}
