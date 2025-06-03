import { atom } from 'jotai'

// Types for our auth state
export interface AuthUser {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  fullName?: string
}

export interface AuthState {
  isAuthenticated: boolean
  isLoaded: boolean
  user: AuthUser | null
}

// Base atoms
export const isAuthenticatedAtom = atom<boolean>(false)
export const isLoadedAtom = atom<boolean>(false)
export const userAtom = atom<AuthUser | null>(null)

// Derived atom that combines all auth state
export const authStateAtom = atom<AuthState>((get) => ({
  isAuthenticated: get(isAuthenticatedAtom),
  isLoaded: get(isLoadedAtom),
  user: get(userAtom),
}))

// Computed atoms for common use cases
export const userIdAtom = atom<string | null>((get) => {
  const user = get(userAtom)
  return user?.id || null
})

export const userDisplayNameAtom = atom<string>((get) => {
  const user = get(userAtom)
  if (!user) return 'Guest'
  
  if (user.fullName) return user.fullName
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.email) return user.email
  return 'User'
})

// Action atoms for updating auth state
export const setAuthenticatedAtom = atom(
  null,
  (get, set, isAuthenticated: boolean) => {
    set(isAuthenticatedAtom, isAuthenticated)
  }
)

export const setUserAtom = atom(
  null,
  (get, set, user: AuthUser | null) => {
    set(userAtom, user)
    set(isAuthenticatedAtom, !!user)
  }
)

export const setLoadedAtom = atom(
  null,
  (get, set, isLoaded: boolean) => {
    set(isLoadedAtom, isLoaded)
  }
)

// Combined action to set all auth state at once
export const setAuthStateAtom = atom(
  null,
  (get, set, authState: Partial<AuthState>) => {
    if (authState.isAuthenticated !== undefined) {
      set(isAuthenticatedAtom, authState.isAuthenticated)
    }
    if (authState.isLoaded !== undefined) {
      set(isLoadedAtom, authState.isLoaded)
    }
    if (authState.user !== undefined) {
      set(userAtom, authState.user)
    }
  }
)

// Reset auth state (for logout)
export const resetAuthAtom = atom(
  null,
  (get, set) => {
    set(isAuthenticatedAtom, false)
    set(isLoadedAtom, true)
    set(userAtom, null)
  }
) 