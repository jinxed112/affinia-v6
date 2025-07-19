import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔍 AuthContext: Initialisation...')
    
    // Fonction pour gérer les changements d'auth state
    const handleAuthStateChange = (event: string, session: Session | null) => {
      console.log('🔄 Auth state changed:', event)
      console.log('👤 Nouvelle session:', session?.user?.email || 'null')
      
      if (event === 'SIGNED_IN' && session) {
        // Vérifier si c'est un nouvel utilisateur
        const isNewUser = new Date(session.user.created_at).getTime() === new Date(session.user.updated_at).getTime()
        console.log('🆕 Nouvel utilisateur:', isNewUser)
        
        // Stocker des infos supplémentaires si nécessaire
        if (isNewUser) {
          localStorage.setItem('affinia_new_user', 'true')
        }
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      console.log('🔓 setLoading(false) après auth state change')
    }

    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        console.log('🔍 Récupération de la session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Erreur lors de la récupération de session:', error)
          throw error
        }

        if (session) {
          console.log('✅ Session trouvée:', session.user.email)
          setSession(session)
          setUser(session.user)
        } else {
          console.log('ℹ️ Aucune session active')
        }
      } catch (error) {
        console.error('❌ Erreur dans getInitialSession:', error)
      } finally {
        setLoading(false)
        console.log('🔓 setLoading(false) dans finally')
      }
      console.log('✅ AuthContext: Initialisation terminée')
    }

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

  const signInWithGoogle = async (customRedirectTo?: string) => {
    try {
      console.log('🔄 Début signInWithGoogle')
      
      // URL de redirection dynamique basée sur l'environnement
      const redirectTo = customRedirectTo || `${window.location.origin}/auth/callback`
      console.log('🔍 Redirect URL:', redirectTo)

      // Configuration OAuth adaptée pour inscription et connexion
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent', // Force le choix de compte Google
          },
          // Options pour récupérer plus d'infos utilisateur
          scopes: 'email profile'
        }
      })

      if (error) {
        console.error('❌ Erreur signInWithOAuth:', error)
        
        // Diagnostic des erreurs courantes
        if (error.message.includes('redirect')) {
          console.error('🔍 Problème de redirection - vérifiez les URLs dans Google Cloud et Supabase')
        }
        if (error.message.includes('configuration')) {
          console.error('🔍 Problème de configuration - vérifiez les clés OAuth Google')
        }
        
        throw error
      }

      console.log('✅ signInWithOAuth initialisé:', data)
      
      // L'utilisateur va être redirigé vers Google, puis vers notre callback
      // Pas besoin de faire quoi que ce soit ici
      
    } catch (error) {
      console.error('❌ Erreur dans signInWithGoogle:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('🔄 Début signOut')
      
      // Nettoyer les données locales
      localStorage.removeItem('affinia_new_user')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Erreur signOut:', error)
        throw error
      }

      console.log('✅ SignOut réussi')
      
      // Ces states seront mis à jour automatiquement par onAuthStateChange
      
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
      session: !!session 
    })
  }, [user, loading, session])

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}