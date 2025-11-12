'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Header } from './header'

interface LayoutWrapperProps {
  children: React.ReactNode
}

/**
 * Wrapper component that conditionally renders the header based on the current route.
 * Excludes header from login page and includes user data from auth context.
 */
export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Don't show header on login page or root page
  const showHeader = pathname !== '/login' && pathname !== '/'

  const userData = user
    ? {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }
    : null

  return (
    <>
      {showHeader && <Header user={userData} onSignOut={signOut} />}
      {children}
    </>
  )
}
