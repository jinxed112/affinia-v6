// frontend/src/services/authManager.ts - VERSION COMPLÈTE
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

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
    // Auto-initialize
    this.initialize()
  }

  // ✅ MÉTHODE MANQUANTE : getState
  getState(): AuthState {
    return this.state
  }

  // ✅ MÉTHODE MANQUANTE : subscribe
  subscribe(listener: AuthStateListener): () => void {
    this.listeners.push(listener)
    
    // Retourner fonction de désabonnement
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // ✅ MÉTHODE MANQUANTE : initialize
  async initialize(): Promise<void> {
    try {
      console.log('🚀 AuthManager: Initialisation...')

      // Vérifier session existante
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ AuthManager: Erreur getSession:', error)
      }

      // Mettre à jour l'état initial
      this.updateState({
        user: session?.user || null,
        session: session || null,
        loading: false,
        initialized: true
      })

      console.log('✅ AuthManager: Initialisé avec session:', session?.user?.email || 'null')

      // Écouter les changements d'auth
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔔 AuthManager: Auth event:', event)
        console.log('🔔 Session:', session?.user?.email || 'null')

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

  // 🔄 Mettre à jour l'état et notifier les listeners
  private updateState(newState: Partial<AuthState>): void {
    this.state = { ...this.state, ...newState }
    
    // Notifier tous les listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('❌ AuthManager: Erreur listener:', error)
      }
    })
  }

  // ✅ MÉTHODES EXISTANTES (gardées)
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

  // ✅ NOUVELLE MÉTHODE : signOut (utilisée par AuthContext)
  async signOut(): Promise<void> {
    try {
      console.log('🚪 AuthManager: Déconnexion...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ SignOut error:', error)
        throw error
      }

      // L'état sera mis à jour automatiquement via onAuthStateChange
      console.log('✅ AuthManager: Déconnexion réussie')
      
    } catch (error) {
      console.error('💥 AuthManager: Erreur signOut:', error)
      throw error
    }
  }

  // 🔍 DEBUG : Vérifier l'état actuel
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

// Export instance singleton
export const authManager = new AuthManager()

// Export du type pour TypeScript
export type { AuthState }