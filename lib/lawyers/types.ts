import { Timestamp } from 'firebase/firestore'

export interface Lawyer {
  id?: string
  name: string
  title: string
  lawfirm: string
  address_1: string
  address_2: string
  city: string
  state: string
  zip: string
  email: string
  phone_number: string
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export type LawyerField =
  | 'name'
  | 'title'
  | 'lawfirm'
  | 'address_1'
  | 'address_2'
  | 'city'
  | 'state'
  | 'zip'
  | 'email'
  | 'phone_number'

export interface LawyerFieldOption {
  lawyerId: string
  field: LawyerField
  value: string
  lawyerName: string
}
