import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

class AuthManager {
  private state: AuthState = {
    user: null,
    session: null,
    loading: true,
    error: null
  }

  private listeners: Set<(state: AuthState) => void> = new Set()
  private refreshTimer: NodeJS.Timeout | null = null

  getState(): AuthState {
    return { ...this.state }
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState())
      } catch (error) {
        console.error('AuthManager: Listener error:', error)
      }
    })
  }

  private setState(updates: Partial<AuthState>): void {
    this.state = { ...this.state, ...updates }
    this.notify()
  }

  async getAccessToken(): Promise<string | null> {
    try {
      if (!this.state.session) {
        await this.refreshSession()
      }

      if (this.state.session) {
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = this.state.session.expires_at || 0

        if (now >= expiresAt - 300) {
          await this.refreshSession()
        }
      }

      return this.state.session?.access_token || null
    } catch (error) {
      console.error('❌ AuthManager: getAccessToken error:', error)
      return null
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()

      if (error || !session) {
        await this.clearSession()
        return false
      }

      this.setState({
        session,
        user: session.user,
        error: null,
        loading: false
      })

      this.scheduleTokenRefresh(session)
      return true
    } catch (error) {
      console.error('❌ AuthManager: refresh error:', error)
      await this.clearSession()
      return false
    }
  }

  private scheduleTokenRefresh(session: Session): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    const expiresAt = session.expires_at || 0
    const now = Math.floor(Date.now() / 1000)
    const refreshIn = (expiresAt - now - 300) * 1000 // 5min avant expiration

    if (refreshIn > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshSession()
      }, refreshIn)
    }
  }

  async initialize(): Promise<void> {
    try {
      this.setState({ loading: true, error: null })

      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      if (session) {
        this.setState({
          session,
          user: session.user,
          loading: false
        })
        this.scheduleTokenRefresh(session)
      } else {
        this.setState({ loading: false })
      }

      // Listen to auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔔 Auth state change:', event)
        
        if (session) {
          this.setState({
            session,
            user: session.user,
            error: null,
            loading: false
          })
          this.scheduleTokenRefresh(session)
        } else {
          this.clearSession()
        }
      })

    } catch (error) {
      console.error('❌ AuthManager: init error:', error)
      this.setState({
        error: error.message,
        loading: false
      })
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut()
      await this.clearSession()
    } catch (error) {
      console.error('❌ AuthManager: signOut error:', error)
      await this.clearSession()
    }
  }

  async clearSession(): Promise<void> {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    // Clear localStorage
    try {
      localStorage.clear()
    } catch (error) {
      console.warn('Cannot clear localStorage:', error)
    }

    this.setState({
      user: null,
      session: null,
      error: null,
      loading: false
    })
  }

  cleanup(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }
    this.listeners.clear()
  }
}

export const authManager = new AuthManager()
