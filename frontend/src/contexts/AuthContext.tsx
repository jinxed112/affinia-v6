import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type AuthProvider = 'google' | 'facebook'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signInWithProvider: (provider: AuthProvider, redirectTo?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  // 🆕 NOUVEAU - Méthodes pour gérer les tokens expirés
  clearExpiredSession: () => Promise<void>
  refreshSession: () => Promise<boolean>
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

interface AuthProviderProps {
  children: React.ReactNode
}

// 🔍 Fonction pour détecter les WebViews
const detectWebView = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase()
  
  // Détection des WebViews communes
  const webViewIndicators = [
    'webview',
    'wv',
    'fbav', // Facebook App
    'fban', // Facebook App
    'instagram', // Instagram App
    'twitter', // Twitter App
    'linkedin', // LinkedIn App
    'tiktok', // TikTok App
    'snapchat', // Snapchat App
    'micromessenger', // WeChat
    'line' // Line App
  ]
  
  const isWebView = webViewIndicators.some(indicator => userAgent.includes(indicator))
  
  // Détection supplémentaire
  const isStandalone = window.navigator.standalone === true
  const isMissingChrome = !window.chrome && userAgent.includes('chrome')
  
  return isWebView || isStandalone || isMissingChrome
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isWebView] = useState(detectWebView())

  /**
   * 🆕 NOUVEAU - Nettoie une session expirée
   */
  const clearExpiredSession = async (): Promise<void> => {
    try {
      console.log('🧹 Nettoyage session expirée...')
      
      // Nettoyer l'état local
      setUser(null)
      setSession(null)
      
      // Nettoyer localStorage
      localStorage.clear()
      
      // Déconnexion Supabase
      await supabase.auth.signOut()
      
      console.log('✅ Session expirée nettoyée')
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage session:', error)
    }
  }

  /**
   * 🆕 NOUVEAU - Tente de rafraîchir la session
   */
  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('🔄 Tentative de rafraîchissement session...')
      
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      
      if (error || !newSession) {
        console.log('❌ Impossible de rafraîchir la session:', error?.message)
        await clearExpiredSession()
        return false
      }
      
      console.log('✅ Session rafraîchie avec succès')
      setSession(newSession)
      setUser(newSession.user)
      
      return true
      
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement:', error)
      await clearExpiredSession()
      return false
    }
  }

  /**
   * 🔧 AMÉLIORÉ - Gestion des changements d'auth state
   */
  const handleAuthStateChange = async (event: string, newSession: Session | null) => {
    console.log('🔄 Auth state changed:', event)
    console.log('👤 Nouvelle session:', newSession?.user?.email || 'null')
    
    if (event === 'SIGNED_OUT' || !newSession) {
      console.log('👋 Utilisateur déconnecté')
      setSession(null)
      setUser(null)
      setLoading(false)
      return
    }
    
    if (event === 'TOKEN_REFRESHED') {
      console.log('🔄 Token rafraîchi automatiquement')
      setSession(newSession)
      setUser(newSession.user)
      return
    }
    
    if (event === 'SIGNED_IN' && newSession) {
      // Vérifier si c'est un nouvel utilisateur
      const isNewUser = new Date(newSession.user.created_at).getTime() === new Date(newSession.user.updated_at).getTime()
      console.log('🆕 Nouvel utilisateur:', isNewUser)
      
      // Stocker des infos supplémentaires si nécessaire
      if (isNewUser) {
        localStorage.setItem('affinia_new_user', 'true')
      }
      
      setSession(newSession)
      setUser(newSession.user)
    }
    
    setLoading(false)
    console.log('🔓 setLoading(false) après auth state change')
  }

  /**
   * 🔧 AMÉLIORÉ - Récupération de la session initiale avec gestion d'erreur
   */
  const getInitialSession = async () => {
    try {
      console.log('🔍 Récupération de la session...')
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Erreur lors de la récupération de session:', error)
        
        // Si erreur de token, tenter un refresh
        if (error.message?.includes('refresh_token') || error.message?.includes('expired')) {
          console.log('🔄 Token expiré, tentative de rafraîchissement...')
          const refreshSuccess = await refreshSession()
          
          if (!refreshSuccess) {
            console.log('❌ Rafraîchissement impossible, session cleared')
            await clearExpiredSession()
          }
          
          return
        }
        
        throw error
      }

      if (currentSession) {
        console.log('✅ Session trouvée:', currentSession.user.email)
        
        // Vérifier si la session est encore valide
        const now = new Date().getTime()
        const expiresAt = currentSession.expires_at ? currentSession.expires_at * 1000 : 0
        
        if (expiresAt > 0 && now >= expiresAt) {
          console.log('⚠️ Session expirée, tentative de rafraîchissement...')
          const refreshSuccess = await refreshSession()
          
          if (!refreshSuccess) {
            return // refreshSession s'occupe du nettoyage
          }
        } else {
          setSession(currentSession)
          setUser(currentSession.user)
        }
      } else {
        console.log('ℹ️ Aucune session active')
      }
    } catch (error) {
      console.error('❌ Erreur dans getInitialSession:', error)
      await clearExpiredSession()
    } finally {
      setLoading(false)
      console.log('🔓 setLoading(false) dans finally')
    }
    console.log('✅ AuthContext: Initialisation terminée')
  }

  useEffect(() => {
    console.log('🔍 AuthContext: Initialisation...')
    console.log('📱 WebView détecté:', isWebView)
    
    // Écouter les changements d'auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // Initialiser
    getInitialSession()

    // Cleanup
    return () => {
      console.log('🧹 AuthContext: Cleanup')
      subscription.unsubscribe()
    }
  }, [])

  // Fonction Google existante (gardée telle quelle)
  const signInWithGoogle = async (customRedirectTo?: string) => {
    try {
      console.log('🔄 Début signInWithGoogle')
      console.log('📱 WebView détecté:', isWebView)
      
      // URL de redirection dynamique basée sur l'environnement
      const redirectTo = customRedirectTo || `${window.location.origin}/auth/callback`
      console.log('🔍 Redirect URL:', redirectTo)

      // 🚨 Gestion spécifique des WebViews
      if (isWebView) {
        console.log('⚠️ WebView détecté - Configuration spéciale')
        
        // Option 1: Essayer d'ouvrir dans le navigateur externe
        try {
          // Créer l'URL d'auth Google manuellement
          const authUrl = `${supabase.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`
          
          // Ouvrir dans le navigateur externe
          window.open(authUrl, '_blank', 'noopener,noreferrer')
          
          // Informer l'utilisateur
          throw new Error('WEBVIEW_REDIRECT')
          
        } catch (webViewError) {
          if (webViewError.message === 'WEBVIEW_REDIRECT') {
            throw webViewError
          }
          console.warn('⚠️ Impossible d\'ouvrir le navigateur externe, essai normal...')
        }
      }

      // Configuration OAuth optimisée
      const authConfig = {
        provider: 'google' as const,
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent', // Force le choix de compte Google
          },
          // Options pour récupérer plus d'infos utilisateur
          scopes: 'email profile',
          // 🔥 CLÉ IMPORTANTE: Force l'ouverture dans un vrai navigateur
          skipBrowserRedirect: false
        }
      }

      const { data, error } = await supabase.auth.signInWithOAuth(authConfig)

      if (error) {
        console.error('❌ Erreur signInWithOAuth:', error)
        
        // Diagnostic des erreurs courantes
        if (error.message.includes('redirect')) {
          console.error('🔍 Problème de redirection - vérifiez les URLs dans Google Cloud et Supabase')
        }
        if (error.message.includes('configuration')) {
          console.error('🔍 Problème de configuration - vérifiez les clés OAuth Google')
        }
        if (error.message.includes('disallowed_useragent')) {
          console.error('🔍 WebView bloqué par Google - tentative d\'ouverture externe')
          // Essayer d'ouvrir dans le navigateur externe
          const fallbackUrl = `${window.location.origin}/auth/google-fallback`
          window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
          throw new Error('WEBVIEW_BLOCKED')
        }
        
        throw error
      }

      console.log('✅ signInWithOAuth initialisé:', data)
      
      // L'utilisateur va être redirigé vers Google, puis vers notre callback
      
    } catch (error) {
      console.error('❌ Erreur dans signInWithGoogle:', error)
      
      // Gestion spécifique des erreurs WebView
      if (error.message === 'WEBVIEW_REDIRECT') {
        console.log('📱 Redirection vers navigateur externe en cours...')
        // Ne pas throw l'erreur, c'est normal
        return
      }
      
      if (error.message === 'WEBVIEW_BLOCKED') {
        console.log('🚫 WebView bloqué, redirection fallback activée')
        return
      }
      
      throw error
    }
  }

  // FONCTION: Support multi-provider (gardée telle quelle)
  const signInWithProvider = async (provider: AuthProvider, customRedirectTo?: string) => {
    try {
      console.log(`🔄 Début signInWith${provider}`)
      console.log('📱 WebView détecté:', isWebView)
      
      // Si c'est Google, utilise la fonction existante
      if (provider === 'google') {
        return signInWithGoogle(customRedirectTo)
      }
      
      // URL de redirection dynamique basée sur l'environnement
      const redirectTo = customRedirectTo || `${window.location.origin}/auth/callback`
      console.log('🔍 Redirect URL:', redirectTo)

      // 🚨 Gestion spécifique des WebViews
      if (isWebView) {
        console.log('⚠️ WebView détecté - Configuration spéciale')
        
        try {
          // Créer l'URL d'auth manuellement
          const authUrl = `${supabase.supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`
          
          // Ouvrir dans le navigateur externe
          window.open(authUrl, '_blank', 'noopener,noreferrer')
          
          // Informer l'utilisateur
          throw new Error('WEBVIEW_REDIRECT')
          
        } catch (webViewError) {
          if (webViewError.message === 'WEBVIEW_REDIRECT') {
            throw webViewError
          }
          console.warn('⚠️ Impossible d\'ouvrir le navigateur externe, essai normal...')
        }
      }

      // Configuration Facebook
      const facebookConfig = {
        provider: 'facebook' as const,
        options: {
          redirectTo: redirectTo,
          scopes: 'email public_profile',
          skipBrowserRedirect: false
        }
      }

      const { data, error } = await supabase.auth.signInWithOAuth(facebookConfig)

      if (error) {
        console.error(`❌ Erreur signInWithOAuth ${provider}:`, error)
        
        if (error.message.includes('disallowed_useragent')) {
          console.error('🔍 WebView bloqué par le provider - tentative d\'ouverture externe')
          const fallbackUrl = `${window.location.origin}/auth/${provider}-fallback`
          window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
          throw new Error('WEBVIEW_BLOCKED')
        }
        
        throw error
      }

      console.log(`✅ signInWithOAuth ${provider} initialisé:`, data)
      
    } catch (error) {
      console.error(`❌ Erreur dans signInWith${provider}:`, error)
      
      // Gestion spécifique des erreurs WebView
      if (error.message === 'WEBVIEW_REDIRECT') {
        console.log('📱 Redirection vers navigateur externe en cours...')
        return
      }
      
      if (error.message === 'WEBVIEW_BLOCKED') {
        console.log('🚫 WebView bloqué, redirection fallback activée')
        return
      }
      
      throw error
    }
  }

  // FONCTION: Connexion email (gardée telle quelle)
  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('🔄 Début signInWithEmail:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Erreur signInWithEmail:', error)
        throw error
      }

      console.log('✅ SignIn email réussi:', data.user?.email)
      
    } catch (error) {
      console.error('❌ Erreur dans signInWithEmail:', error)
      throw error
    }
  }

  // FONCTION: Inscription email (gardée telle quelle)
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      console.log('🔄 Début signUpWithEmail:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Rediriger vers une page de confirmation
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      })

      if (error) {
        console.error('❌ Erreur signUpWithEmail:', error)
        throw error
      }

      console.log('✅ SignUp email réussi:', data.user?.email)
      
      // Retourner les données pour informer l'utilisateur
      return data
      
    } catch (error) {
      console.error('❌ Erreur dans signUpWithEmail:', error)
      throw error
    }
  }

  /**
   * 🔧 AMÉLIORÉ - Déconnexion avec nettoyage complet
   */
  const signOut = async () => {
    try {
      console.log('🔄 Début signOut')
      
      // Nettoyer les données locales
      localStorage.removeItem('affinia_new_user')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Erreur signOut:', error)
        // Même en cas d'erreur, nettoyer l'état local
        await clearExpiredSession()
        throw error
      }

      console.log('✅ SignOut réussi')
      
    } catch (error) {
      console.error('❌ Erreur dans signOut:', error)
      throw error
    }
  }

  // Debug: afficher l'état actuel
  useEffect(() => {
    console.log('🔍 AuthContext State:', { 
      user: user?.email || 'null', 
      loading,
      session: !!session,
      isWebView
    })
  }, [user, loading, session, isWebView])

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    // 🆕 NOUVEAU - Méthodes pour gérer les sessions expirées
    clearExpiredSession,
    refreshSession,
    isWebView
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}