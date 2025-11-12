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
  const template: Template = {
    id,
    name: data.name,
    tonePreset: data.tonePreset,
    tonePrompt: data.tonePrompt,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    createdBy: data.createdBy,
    isDefault: data.isDefault || false,
  }

  // Only include optional fields if they exist
  if (data.description !== undefined) {
    template.description = data.description
  }
  if (data.sections !== undefined) {
    template.sections = data.sections
  }

  return template
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

  const templateData: any = {
    name: options.name,
    tonePreset: options.tonePreset,
    tonePrompt: options.tonePrompt,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp(),
    createdBy: options.createdBy,
    isDefault: options.isDefault || false,
  }

  // Only include optional fields if they are defined
  if (options.description !== undefined) {
    templateData.description = options.description
  }
  if (options.sections !== undefined) {
    templateData.sections = options.sections
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
    updatedAt: serverTimestamp(),
  }

  // Only include fields that are actually provided
  if (options.name !== undefined) {
    updateData.name = options.name
  }
  if (options.description !== undefined) {
    updateData.description = options.description
  }
  if (options.tonePreset !== undefined) {
    updateData.tonePreset = options.tonePreset
  }
  if (options.tonePrompt !== undefined) {
    updateData.tonePrompt = options.tonePrompt
  }
  if (options.sections !== undefined) {
    updateData.sections = options.sections
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
