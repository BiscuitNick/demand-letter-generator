'use client'

import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore'
import type { Lawyer } from '../types'
import { useAuth } from '@/contexts/auth-context'

export function useLawyers(db: Firestore) {
  const { user } = useAuth()
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user || !db) {
      setLawyers([])
      setLoading(false)
      return
    }

    setLoading(true)

    const lawyersRef = collection(db, 'lawyers')
    const q = query(
      lawyersRef,
      where('createdBy', '==', user.uid),
      orderBy('name', 'asc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lawyersData: Lawyer[] = []
        snapshot.forEach((doc) => {
          lawyersData.push({
            id: doc.id,
            ...doc.data(),
          } as Lawyer)
        })
        setLawyers(lawyersData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching lawyers:', err)
        setError(err as Error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [db, user])

  const addLawyer = async (lawyerData: Omit<Lawyer, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const lawyersRef = collection(db, 'lawyers')
      await addDoc(lawyersRef, {
        ...lawyerData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Error adding lawyer:', err)
      throw err
    }
  }

  const updateLawyer = async (
    lawyerId: string,
    lawyerData: Partial<Omit<Lawyer, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const lawyerRef = doc(db, 'lawyers', lawyerId)
      await updateDoc(lawyerRef, {
        ...lawyerData,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Error updating lawyer:', err)
      throw err
    }
  }

  const deleteLawyer = async (lawyerId: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const lawyerRef = doc(db, 'lawyers', lawyerId)
      await deleteDoc(lawyerRef)
    } catch (err) {
      console.error('Error deleting lawyer:', err)
      throw err
    }
  }

  return {
    lawyers,
    loading,
    error,
    addLawyer,
    updateLawyer,
    deleteLawyer,
  }
}
