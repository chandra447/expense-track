"use client";

import { useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useSetAtom } from 'jotai'
import { setAuthStateAtom, resetAuthAtom, type AuthUser } from '@/store/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const setAuthState = useSetAtom(setAuthStateAtom)
  const resetAuth = useSetAtom(resetAuthAtom)

  useEffect(() => {
    // Wait for both auth and user to be loaded
    const isFullyLoaded = authLoaded && userLoaded

    if (!isFullyLoaded) {
      // Still loading, set loading state
      setAuthState({
        isLoaded: false,
        isAuthenticated: false,
        user: null,
      })
      return
    }

    if (isSignedIn && user) {
      // User is authenticated, sync user data to Jotai
      const authUser: AuthUser = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined,
        fullName: user.fullName || undefined,
      }

      setAuthState({
        isLoaded: true,
        isAuthenticated: true,
        user: authUser,
      })
    } else {
      // User is not authenticated
      resetAuth()
    }
  }, [isSignedIn, authLoaded, userLoaded, user, setAuthState, resetAuth])

  return <>{children}</>
} 