import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { getSession, signIn as apiSignIn, signUp as apiSignUp, signOut as apiSignOut, forgotPassword as apiForgotPassword, deleteAccount as apiDeleteAccount, User } from '../lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const session = await getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Error refreshing session:', error)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true)
      await refreshSession()
      setIsLoading(false)
    }
    initSession()
  }, [refreshSession])

  const signIn = async (email: string, password: string) => {
    const response = await apiSignIn(email, password)
    setUser(response.user)
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const response = await apiSignUp(email, password, name)
    setUser(response.user)
  }

  const signOut = async () => {
    await apiSignOut()
    setUser(null)
  }

  const forgotPassword = async (email: string) => {
    await apiForgotPassword(email)
  }

  const deleteAccount = async (password: string) => {
    await apiDeleteAccount(password)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      forgotPassword,
      deleteAccount,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

