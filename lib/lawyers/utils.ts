import type { Lawyer, LawyerField, LawyerFieldOption } from './types'

/**
 * Matches a placeholder text to a lawyer field.
 * Returns the best matching field based on keywords in the placeholder.
 */
export function matchPlaceholderToField(placeholderText: string): LawyerField | null {
  const normalized = placeholderText.toLowerCase().replace(/[_\s-]/g, '')

  // Define keyword patterns for each field
  const patterns: Record<LawyerField, string[]> = {
    name: ['name', 'lawyer', 'attorney', 'counsel'],
    title: ['title', 'position', 'role'],
    lawfirm: ['lawfirm', 'firm', 'office', 'practice'],
    address_1: ['address', 'street', 'location', 'addr'],
    address_2: ['address2', 'suite', 'unit', 'apt'],
    city: ['city', 'town', 'municipality'],
    state: ['state', 'province'],
    zip: ['zip', 'zipcode', 'postal', 'postalcode'],
    email: ['email', 'mail'],
    phone_number: ['phone', 'tel', 'number', 'contact'],
  }

  // Try to find a matching field
  for (const [field, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return field as LawyerField
      }
    }
  }

  return null
}

/**
 * Gets lawyer field options for a specific field.
 * Returns an array of options with lawyer ID, field, value, and lawyer name.
 */
export function getLawyerFieldOptions(
  lawyers: Lawyer[],
  field: LawyerField
): LawyerFieldOption[] {
  return lawyers
    .filter((lawyer) => lawyer[field]) // Only include lawyers with this field populated
    .map((lawyer) => ({
      lawyerId: lawyer.id!,
      field,
      value: lawyer[field] as string,
      lawyerName: lawyer.name,
    }))
}

/**
 * Gets all field options for a lawyer.
 * Returns an array with all non-empty fields for the lawyer.
 */
export function getAllLawyerFieldOptions(lawyer: Lawyer): LawyerFieldOption[] {
  const fields: LawyerField[] = [
    'name',
    'title',
    'lawfirm',
    'address_1',
    'address_2',
    'city',
    'state',
    'zip',
    'email',
    'phone_number',
  ]

  return fields
    .filter((field) => lawyer[field]) // Only non-empty fields
    .map((field) => ({
      lawyerId: lawyer.id!,
      field,
      value: lawyer[field] as string,
      lawyerName: lawyer.name,
    }))
}

/**
 * Formats a lawyer field name for display.
 */
export function formatFieldName(field: LawyerField): string {
  const names: Record<LawyerField, string> = {
    name: 'Name',
    title: 'Title',
    lawfirm: 'Law Firm',
    address_1: 'Address Line 1',
    address_2: 'Address Line 2',
    city: 'City',
    state: 'State',
    zip: 'ZIP Code',
    email: 'Email',
    phone_number: 'Phone Number',
  }
  return names[field]
}
