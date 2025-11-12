import type { Firestore } from 'firebase/firestore'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import type {
  Template,
  TemplateDocument,
  CreateTemplateOptions,
  UpdateTemplateOptions,
} from './types'

/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate()
}

/**
 * Convert Firestore template document to Template type
 */
function convertTemplateDocument(id: string, data: TemplateDocument): Template {
  return {
    id,
    name: data.name,
    description: data.description,
    tonePreset: data.tonePreset,
    tonePrompt: data.tonePrompt,
    sections: data.sections,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    createdBy: data.createdBy,
    isDefault: data.isDefault || false,
  }
}

/**
 * Get all templates
 */
export async function listTemplates(db: Firestore): Promise<Template[]> {
  const templatesRef = collection(db, 'templates')
  const q = query(templatesRef, orderBy('createdAt', 'desc'))

  const snapshot = await getDocs(q)
  const templates: Template[] = []

  snapshot.forEach((doc) => {
    const data = doc.data() as TemplateDocument
    templates.push(convertTemplateDocument(doc.id, data))
  })

  console.log('[TemplateService] Listed templates:', templates.length)
  return templates
}

/**
 * Get a single template by ID
 */
export async function getTemplate(
  db: Firestore,
  templateId: string
): Promise<Template | null> {
  const templateRef = doc(db, 'templates', templateId)
  const snapshot = await getDoc(templateRef)

  if (!snapshot.exists()) {
    console.log('[TemplateService] Template not found:', templateId)
    return null
  }

  const data = snapshot.data() as TemplateDocument
  return convertTemplateDocument(snapshot.id, data)
}

/**
 * Get default template
 */
export async function getDefaultTemplate(db: Firestore): Promise<Template | null> {
  const templatesRef = collection(db, 'templates')
  const q = query(templatesRef, where('isDefault', '==', true))

  const snapshot = await getDocs(q)
  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  const data = doc.data() as TemplateDocument
  return convertTemplateDocument(doc.id, data)
}

/**
 * Create a new template
 */
export async function createTemplate(
  db: Firestore,
  options: CreateTemplateOptions
): Promise<string> {
  const templatesRef = collection(db, 'templates')
  const templateRef = doc(templatesRef)

  const templateData: Omit<TemplateDocument, 'updatedAt'> & { updatedAt: any } = {
    name: options.name,
    description: options.description,
    tonePreset: options.tonePreset,
    tonePrompt: options.tonePrompt,
    sections: options.sections,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp(),
    createdBy: options.createdBy,
    isDefault: options.isDefault || false,
  }

  await setDoc(templateRef, templateData)
  console.log('[TemplateService] Created template:', templateRef.id)

  return templateRef.id
}

/**
 * Update an existing template
 */
export async function updateTemplate(
  db: Firestore,
  templateId: string,
  options: UpdateTemplateOptions
): Promise<void> {
  const templateRef = doc(db, 'templates', templateId)

  const updateData: any = {
    ...options,
    updatedAt: serverTimestamp(),
  }

  await updateDoc(templateRef, updateData)
  console.log('[TemplateService] Updated template:', templateId)
}

/**
 * Delete a template
 */
export async function deleteTemplate(
  db: Firestore,
  templateId: string
): Promise<void> {
  const templateRef = doc(db, 'templates', templateId)
  await deleteDoc(templateRef)
  console.log('[TemplateService] Deleted template:', templateId)
}

/**
 * Set a template as default (and unset others)
 */
export async function setDefaultTemplate(
  db: Firestore,
  templateId: string
): Promise<void> {
  // First, unset all default templates
  const templatesRef = collection(db, 'templates')
  const q = query(templatesRef, where('isDefault', '==', true))
  const snapshot = await getDocs(q)

  const updatePromises = snapshot.docs.map((doc) =>
    updateDoc(doc.ref, { isDefault: false, updatedAt: serverTimestamp() })
  )

  await Promise.all(updatePromises)

  // Set the new default
  const templateRef = doc(db, 'templates', templateId)
  await updateDoc(templateRef, {
    isDefault: true,
    updatedAt: serverTimestamp(),
  })

  console.log('[TemplateService] Set default template:', templateId)
}
