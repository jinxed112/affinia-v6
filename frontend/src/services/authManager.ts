// frontend/src/services/authManager.ts - VERSION PROPRE
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

const DEBUG_AUTH = false; // ← DÉSACTIVÉ POUR PRODUCTION

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
}

type AuthStateListener = (state: AuthState) => void

class AuthManager {
  private state: AuthState = {
    user: null,
    session: null,
    loading: true,
    initialized: false
  }

  private listeners: AuthStateListener[] = []

  constructor() {
    this.initialize()
  }

  getState(): AuthState {
    return this.state
  }

  subscribe(listener: AuthStateListener): () => void {
    this.listeners.push(listener)

    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  async initialize(): Promise<void> {
    try {
      if (DEBUG_AUTH) console.log('🚀 AuthManager: Initialisation...')

      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ AuthManager: Erreur getSession:', error)
      }

      this.updateState({
        user: session?.user || null,
        session: session || null,
        loading: false,
        initialized: true
      })

      if (DEBUG_AUTH) console.log('✅ AuthManager: Initialisé avec session:', session?.user?.email || 'null')

      supabase.auth.onAuthStateChange((event, session) => {
        if (DEBUG_AUTH) {
          console.log('🔔 AuthManager: Auth event:', event)
          console.log('🔔 Session:', session?.user?.email || 'null')
        }

        this.updateState({
          user: session?.user || null,
          session: session || null,
          loading: false,
          initialized: true
        })
      })

    } catch (error) {
      console.error('💥 AuthManager: Erreur d\'initialisation:', error)
      this.updateState({
        user: null,
        session: null,
        loading: false,
        initialized: true
      })
    }
  }

  private updateState(newState: Partial<AuthState>): void {
    this.state = { ...this.state, ...newState }

    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('❌ AuthManager: Erreur listener:', error)
      }
    })
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error('❌ getAccessToken error:', error)
      return null
    }
  }

  async clearSession(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('❌ clearSession error:', error)
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('❌ getCurrentUser error:', error)
      return null
    }
  }

  async signOut(): Promise<void> {
    try {
      if (DEBUG_AUTH) console.log('🚪 AuthManager: Déconnexion...')

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ SignOut error:', error)
        throw error
      }

      if (DEBUG_AUTH) console.log('✅ AuthManager: Déconnexion réussie')

    } catch (error) {
      console.error('💥 AuthManager: Erreur signOut:', error)
      throw error
    }
  }

  debug(): void {
    console.log('🔍 AuthManager Debug State:', {
      user: this.state.user?.email || 'null',
      hasSession: !!this.state.session,
      loading: this.state.loading,
      initialized: this.state.initialized,
      listenersCount: this.listeners.length
    })
  }
}

export const authManager = new AuthManager()
export type { AuthState }
