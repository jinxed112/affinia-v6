import React, { createContext, useContext, useEffect } from 'react'
import { authManager } from '../services/authManager'
import type { AuthState } from '../services/authManager'
import { supabase } from '../lib/supabase'

export type AuthProvider = 'google' | 'facebook'

interface AuthContextType extends AuthState {
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signInWithProvider: (provider: AuthProvider, redirectTo?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  isWebView: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const detectWebView = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase()
  const webViewIndicators = ['webview', 'wv', 'fbav', 'fban', 'instagram', 'twitter']
  return webViewIndicators.some(indicator => userAgent.includes(indicator))
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = React.useState(authManager.getState())
  const [isWebView] = React.useState(detectWebView())

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authManager.subscribe(setAuthState)
    
    // Initialize auth
    authManager.initialize()

    return () => {
      unsubscribe()
    }
  }, [])

  const signInWithGoogle = async (customRedirectTo?: string) => {
    try {
      const redirectTo = customRedirectTo || `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile',
          skipBrowserRedirect: false
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('❌ signInWithGoogle error:', error)
      throw error
    }
  }

  const signInWithProvider = async (provider: AuthProvider, customRedirectTo?: string) => {
    if (provider === 'google') {
      return signInWithGoogle(customRedirectTo)
    }

    try {
      const redirectTo = customRedirectTo || `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: 'email public_profile',
          skipBrowserRedirect: false
        }
      })

      if (error) throw error
    } catch (error) {
      console.error(`❌ signInWith${provider} error:`, error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error) {
      console.error('❌ signInWithEmail error:', error)
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ signUpWithEmail error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await authManager.signOut()
    } catch (error) {
      console.error('❌ signOut error:', error)
      throw error
    }
  }

  const value = {
    ...authState,
    signInWithGoogle,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isWebView
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
