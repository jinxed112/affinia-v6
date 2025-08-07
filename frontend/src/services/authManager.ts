import { supabase } from '../lib/supabase'

class AuthManager {
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

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('❌ getCurrentUser error:', error)
      return null
    }
  }
}

export const authManager = new AuthManager()
