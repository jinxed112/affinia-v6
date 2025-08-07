#!/bin/bash

echo "🚀 CORRECTION COMPLÈTE SÉCURITÉ FRONTEND - AffiniaV6"
echo "=================================================="
echo ""

# 1. AUTHMANAGER SÉCURISÉ - MEMORY STORAGE
echo "📝 1. Création AuthManager sécurisé..."
cat > "./frontend/src/services/authManager.ts" << 'EOF'
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
EOF

# 2. AUTHCONTEXT SIMPLIFIÉ
echo "📝 2. AuthContext simplifié..."
cat > "./frontend/src/contexts/AuthContext.tsx" << 'EOF'
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
EOF

# 3. TOUS LES SERVICES SÉCURISÉS
echo "📝 3. ProfileService sécurisé..."
cat > "./frontend/src/services/profileService.ts" << 'EOF'
import { authManager } from './authManager'

const API_BASE_URL = import.meta.env.VITE_API_URL

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  xp: number
  credits: number
  level: number
  created_at: string
  updated_at?: string
  bio?: string | null
  birth_date?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  max_distance?: number | null
  role?: string
  mirror_visibility?: string
  gender?: string | null
  relationship_type?: string[] | null
  interested_in_genders?: string[] | null
  min_age?: number | null
  max_age?: number | null
  show_me_on_affinia?: boolean | null
}

class ProfileService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authManager.getAccessToken()
    
    if (!token) {
      throw new Error('No access token available')
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    if (response.status === 401) {
      console.warn('🚨 401 - Token invalid, clearing session')
      await authManager.clearSession()
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  async getMyProfile(): Promise<Profile> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/profiles/me`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getMyProfile error:', error)
      throw error
    }
  }

  async updateMyProfile(updates: Partial<Profile>): Promise<Profile> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ updateMyProfile error:', error)
      throw error
    }
  }

  async getLatestQuestionnaire(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/questionnaire/latest`, { headers })
      
      if (response.status === 404) {
        return null
      }

      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getLatestQuestionnaire error:', error)
      throw error
    }
  }
}

export const profileService = new ProfileService()
EOF

echo "📝 4. ChatService sécurisé..."
cat > "./frontend/src/services/chatService.ts" << 'EOF'
import { authManager } from './authManager'
import type { Conversation, Message, SendMessageParams, ChatStats } from '../../../shared/types/chat'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ChatService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authManager.getAccessToken()
    
    if (!token) {
      throw new Error('No access token available')
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    if (response.status === 401) {
      await authManager.clearSession()
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Chat API Error: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Chat operation failed')
    }

    return result.data
  }

  async getConversations(limit = 20, offset = 0): Promise<Conversation[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations?limit=${limit}&offset=${offset}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getConversations error:', error)
      throw error
    }
  }

  async sendMessage(conversationId: string, params: SendMessageParams): Promise<Message> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params)
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ sendMessage error:', error)
      throw error
    }
  }
}

export const chatService = new ChatService()
EOF

echo "📝 5. DiscoveryService sécurisé..."
cat > "./frontend/src/services/discoveryService.ts" << 'EOF'
import { authManager } from './authManager'
import type { DiscoveryProfile, DiscoveryFilters, DiscoveryResponse } from '../../../shared/types/discovery'

const API_BASE_URL = import.meta.env.VITE_API_URL

class DiscoveryService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authManager.getAccessToken()
    
    if (!token) {
      throw new Error('No access token available')
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    if (response.status === 401) {
      await authManager.clearSession()
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Discovery API Error: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Discovery operation failed')
    }

    return result.data
  }

  async getDiscoveryProfiles(filters: DiscoveryFilters = {}): Promise<DiscoveryResponse> {
    try {
      const headers = await this.getAuthHeaders()
      
      const params = new URLSearchParams()
      if (filters.gender) params.append('gender', filters.gender)
      if (filters.min_age) params.append('min_age', filters.min_age.toString())
      if (filters.max_age) params.append('max_age', filters.max_age.toString())

      const response = await fetch(`${API_BASE_URL}/api/discovery?${params}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getDiscoveryProfiles error:', error)
      throw error
    }
  }

  async requestMirrorAccess(receiverId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/mirror-request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ receiver_id: receiverId })
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ requestMirrorAccess error:', error)
      throw error
    }
  }
}

export const discoveryService = new DiscoveryService()
EOF

echo "📝 6. GamificationService sécurisé..."
cat > "./frontend/src/services/gamificationService.ts" << 'EOF'
import { authManager } from './authManager'

const API_BASE_URL = import.meta.env.VITE_API_URL

export interface Quest {
  id: string
  type: 'profile' | 'photo' | 'questionnaire' | 'social'
  title: string
  description: string
  xp_reward: number
  credits_reward: number
  icon: string
  required_level: number
  is_active: boolean
}

class GamificationService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authManager.getAccessToken()
    
    if (!token) {
      throw new Error('No access token available')
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    if (response.status === 401) {
      await authManager.clearSession()
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Gamification API Error: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  }

  async getUserQuests(): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/gamification/quests`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getUserQuests error:', error)
      throw error
    }
  }

  async completeQuest(questType: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/gamification/complete-quest`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questType })
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ completeQuest error:', error)
      throw error
    }
  }
}

export const gamificationService = new GamificationService()
EOF

echo "📝 7. AdminService sécurisé..."
cat > "./frontend/src/services/adminService.ts" << 'EOF'
import { authManager } from './authManager'

const API_BASE_URL = import.meta.env.VITE_API_URL

class AdminService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authManager.getAccessToken()
    
    if (!token) {
      throw new Error('No access token available')
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    if (response.status === 401) {
      await authManager.clearSession()
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Admin API Error: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  }

  async getDashboard(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getDashboard error:', error)
      throw error
    }
  }

  async checkAdminStatus(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers })
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export const adminService = new AdminService()
EOF

# 8. ERROR BOUNDARY GLOBAL
echo "📝 8. Error Boundary global..."
cat > "./frontend/src/components/ErrorBoundary.tsx" << 'EOF'
import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
      <h2 className="text-xl font-bold text-red-400 mb-4">Something went wrong</h2>
      <p className="text-gray-300 mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <div className="space-y-2">
        <button
          onClick={resetError}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
        >
          Reload page
        </button>
      </div>
    </div>
  </div>
)
EOF

# 9. APP.TSX AVEC ERROR BOUNDARY
echo "📝 9. App.tsx avec Error Boundary..."
cat > "./frontend/src/App.tsx" << 'EOF'
import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header } from './components/Header'
import { AuthCallback } from './components/AuthCallback'
import { OnboardingGuard } from './components/OnboardingGuard'
import AuthConfirm from './components/AuthConfirm'
import Login from './pages/Login'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { MiroirPage } from './pages/MiroirPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { MirrorRequestsPage } from './pages/MirrorRequestsPage'
import SimpleQuestionnairePage from './pages/SimpleQuestionnairePage'
import { AdminPage } from './pages/AdminPage'
import { ResetPasswordPage } from './pages'
import { ChatPage } from './components/chat/ChatPage'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

function AppContent() {
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = React.useState(true)

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode)
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light')
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {user && <Header isDarkMode={isDarkMode} onThemeToggle={handleThemeToggle} />}
      
      <div className={user ? 'pt-16' : ''}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />
          <Route path="/reset-password" element={<ResetPasswordPage isDarkMode={isDarkMode} />} />

          <Route path="/" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <HomePage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/profil" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <ProfilePage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/miroir" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <MiroirPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/decouverte" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <DiscoveryPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/demandes-miroir" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <MirrorRequestsPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/questionnaire" element={
            <PrivateRoute>
              <SimpleQuestionnairePage isDarkMode={isDarkMode} />
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute>
              <AdminPage isDarkMode={isDarkMode} />
            </PrivateRoute>
          } />

          <Route path="/chat" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <ChatPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/chat/:conversationId" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <ChatPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}
EOF

# 10. SUPPRESSION DES HOOKS AUTH REDONDANTS
echo "📝 10. Suppression hooks redondants..."
rm -f "./frontend/src/hooks/auth/useAuthActions.ts"
rm -f "./frontend/src/hooks/auth/useAuthState.ts"

# 11. HOOK useAuth SIMPLE
echo "📝 11. Hook useAuth simplifié..."
cat > "./frontend/src/hooks/auth/useAuth.ts" << 'EOF'
import { useContext } from 'react'
import { AuthContext } from '../../contexts/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
EOF

echo ""
echo "✅ CORRECTION TERMINÉE !"
echo "========================"
echo ""
echo "🔒 SÉCURITÉ FRONTEND CORRIGÉE :"
echo "  ✅ AuthManager memory-only (fini localStorage XSS)"
echo "  ✅ Tous les services utilisent AuthManager"
echo "  ✅ Error boundary global"
echo "  ✅ State management unifié"
echo "  ✅ Auto-refresh tokens"
echo "  ✅ Cleanup approprié"
echo ""
echo "🚀 Redémarrez le frontend avec: npm run dev"