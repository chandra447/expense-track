import { useAtomValue } from 'jotai'
import {
  authStateAtom,
  userIdAtom,
  userDisplayNameAtom,
  isAuthenticatedAtom,
  isLoadedAtom,
  userAtom,
  type AuthState,
  type AuthUser,
} from '@/store/auth'

// Main hook for authentication state
export function useAuthState(): AuthState {
  return useAtomValue(authStateAtom)
}

// Hook for checking if user is authenticated
export function useIsAuthenticated(): boolean {
  return useAtomValue(isAuthenticatedAtom)
}

// Hook for checking if auth is loaded
export function useIsAuthLoaded(): boolean {
  return useAtomValue(isLoadedAtom)
}

// Hook for getting user data
export function useAuthUser(): AuthUser | null {
  return useAtomValue(userAtom)
}

// Hook for getting user ID
export function useUserId(): string | null {
  return useAtomValue(userIdAtom)
}

// Hook for getting user display name
export function useUserDisplayName(): string {
  return useAtomValue(userDisplayNameAtom)
}

// Combined hook that mimics Clerk's useAuth but uses Jotai
export function useAuth() {
  const authState = useAtomValue(authStateAtom)
  
  return {
    isSignedIn: authState.isAuthenticated,
    isLoaded: authState.isLoaded,
    userId: authState.user?.id || null,
    user: authState.user,
  }
}

// Hook that mimics Clerk's useUser but uses Jotai
export function useUser() {
  const authState = useAtomValue(authStateAtom)
  
  return {
    isSignedIn: authState.isAuthenticated,
    isLoaded: authState.isLoaded,
    user: authState.user,
  }
} 