// src/components/OnboardingGuard.tsx - VERSION CORRIGÉE
import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useDesignSystem } from '../styles/designSystem'
import { BaseComponents } from './ui/BaseComponents'
import { Brain, Sparkles, ArrowRight, Clock, Shield } from 'lucide-react'

interface OnboardingGuardProps {
  children: React.ReactNode
  isDarkMode: boolean
}

// Routes autorisées sans questionnaire complété
const ALLOWED_ROUTES_WITHOUT_QUESTIONNAIRE = [
  '/questionnaire',
  '/auth/callback',
  '/login'
]

// ✅ AJOUTÉ - Routes autorisées APRÈS questionnaire complété
const ALLOWED_ROUTES_AFTER_QUESTIONNAIRE = [
  '/',
  '/discovery',
  '/chat',
  '/profile',
  '/demandes-miroir',      // ✅ ROUTE MIROIR AJOUTÉE
  '/miroir',               // ✅ ROUTE MIROIR AJOUTÉE  
  '/notifications',
  '/settings'
]

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children, isDarkMode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { hasCompletedQuestionnaire, loading: profileLoading, questionnaire } = useProfile()
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(5)
  const designSystem = useDesignSystem(isDarkMode)

  // Check si c'est un nouvel utilisateur
  const isNewUser = localStorage.getItem('affinia_new_user') === 'true'

  // State pour gérer l'affichage
  const isLoading = authLoading || profileLoading
  const currentPath = location.pathname
  
  // ✅ LOGIQUE ROUTES AMÉLIORÉE
  const isAllowedWithoutQuestionnaire = ALLOWED_ROUTES_WITHOUT_QUESTIONNAIRE.some(route => 
    currentPath.startsWith(route)
  )
  
  const isAllowedAfterQuestionnaire = ALLOWED_ROUTES_AFTER_QUESTIONNAIRE.some(route => 
    currentPath.startsWith(route)
  ) || currentPath.startsWith('/miroir/') // ✅ Routes dynamiques miroir

  // Debug
  useEffect(() => {
    console.log('🛡️ OnboardingGuard State:', {
      user: user?.email,
      currentPath,
      hasCompletedQuestionnaire,
      isAllowedWithoutQuestionnaire,
      isAllowedAfterQuestionnaire,
      isLoading,
      authLoading,
      profileLoading,
      isNewUser
    })
  }, [user, currentPath, hasCompletedQuestionnaire, isAllowedWithoutQuestionnaire, isAllowedAfterQuestionnaire, isLoading, authLoading, profileLoading, isNewUser])

  // ✅ FIX: GESTION DE LA REDIRECTION AMÉLIORÉE
  useEffect(() => {
    // ✅ SPECIAL CASE: Pour les routes miroir, être plus permissif  
    if (currentPath.startsWith('/miroir/')) {
      console.log('🔮 Route miroir détectée, vérification simplifiée:', currentPath)
      
      // Pour les miroirs, on attend seulement que l'auth soit prête
      if (authLoading || !user) {
        console.log('⏳ Attente auth pour route miroir...')
        return
      }
      
      // Si auth OK, laisser passer même si profile loading
      console.log('✅ Auth OK pour route miroir, accès accordé')
      return
    }

    // ✅ POUR LES AUTRES ROUTES: logique normale
    if (isLoading || !user) {
      console.log('⏳ OnboardingGuard - En attente du chargement...', {
        isLoading,
        user: !!user,
        authLoading,
        profileLoading
      })
      return
    }

    console.log('🔍 OnboardingGuard - Vérification redirection:', {
      hasCompletedQuestionnaire,
      currentPath,
      isAllowedWithoutQuestionnaire,
      isAllowedAfterQuestionnaire
    })

    // ✅ LOGIQUE SIMPLIFIÉE ET CLAIRE
    if (hasCompletedQuestionnaire) {
      // Questionnaire complété
      if (currentPath === '/questionnaire') {
        console.log('✅ Questionnaire complété, redirection vers dashboard')
        navigate('/')
        return
      }
      
      // ✅ VÉRIFIER ROUTE AUTORISÉE APRÈS QUESTIONNAIRE
      if (!isAllowedAfterQuestionnaire) {
        console.log('❌ Route non autorisée après questionnaire, redirection vers dashboard')
        navigate('/')
        return
      }
      
      // ✅ Tout OK, laisser passer
      console.log('✅ Route autorisée, accès accordé')
      
    } else {
      // Questionnaire pas complété
      if (!isAllowedWithoutQuestionnaire) {
        console.log('🚨 Redirection vers questionnaire nécessaire')
        
        // Afficher écran de bienvenue si nouvel utilisateur
        if (isNewUser && !showWelcomeScreen) {
          setShowWelcomeScreen(true)
          
          // Countdown de redirection
          const countdown = setInterval(() => {
            setRedirectCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdown)
                localStorage.removeItem('affinia_new_user') // Nettoyer flag
                navigate('/questionnaire')
                return 0
              }
              return prev - 1
            })
          }, 1000)

          return () => clearInterval(countdown)
        } else if (!isNewUser) {
          // Redirection directe si utilisateur existant sans questionnaire
          navigate('/questionnaire')
        }
      }
    }

  }, [user, authLoading, profileLoading, hasCompletedQuestionnaire, isAllowedWithoutQuestionnaire, isAllowedAfterQuestionnaire, currentPath, isNewUser, navigate, isLoading, showWelcomeScreen])

  // Loading state
  if (isLoading && !currentPath.startsWith('/miroir/')) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <p className={`mt-6 text-lg font-medium ${designSystem.getTextClasses('primary')}`}>
              Chargement de votre profil...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Écran de bienvenue pour nouveaux utilisateurs
  if (showWelcomeScreen && !hasCompletedQuestionnaire) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="medium" />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <BaseComponents.Card
            isDarkMode={isDarkMode}
            variant="highlighted"
            className="max-w-2xl w-full p-12 text-center relative overflow-hidden"
          >
            {/* Particules de bienvenue */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-float`}
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 200}ms`
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="text-8xl mb-6 animate-bounce-gentle">🎉</div>
              
              <h1 className={`text-4xl font-bold mb-4 ${designSystem.getTextClasses('primary')}`}>
                Bienvenue sur Affinia !
              </h1>
              
              <p className={`text-xl mb-8 ${designSystem.getTextClasses('secondary')}`}>
                Prêt(e) à découvrir ton profil psychologique unique ?
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-semibold ${designSystem.getTextClasses('primary')}`}>
                      Questionnaire psychologique
                    </h3>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Découvre ta vraie personnalité en 4 étapes
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-semibold ${designSystem.getTextClasses('primary')}`}>
                      Carte miroir unique
                    </h3>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Génère ton profil personnalisé par IA
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-semibold ${designSystem.getTextClasses('primary')}`}>
                      Connexions authentiques
                    </h3>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Trouve des personnes qui te comprennent vraiment
                    </p>
                  </div>
                </div>
              </div>

              {/* Countdown */}
              <div className={`mb-8 p-4 rounded-xl ${designSystem.cardBackground} ${designSystem.border}`}>
                <div className="flex items-center justify-center gap-3">
                  <Clock className="w-5 h-5 text-purple-400 animate-pulse" />
                  <span className={`font-medium ${designSystem.getTextClasses('primary')}`}>
                    Redirection automatique dans {redirectCountdown}s
                  </span>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <BaseComponents.Button
                  variant="secondary"
                  size="medium"
                  onClick={() => {
                    setShowWelcomeScreen(false)
                    localStorage.removeItem('affinia_new_user')
                  }}
                >
                  Annuler
                </BaseComponents.Button>
                
                <BaseComponents.Button
                  variant="primary"
                  size="large"
                  onClick={() => {
                    localStorage.removeItem('affinia_new_user')
                    navigate('/questionnaire')
                  }}
                  className="animate-pulse-glow"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Commencer maintenant
                </BaseComponents.Button>
              </div>
              
              <p className={`text-xs mt-6 ${designSystem.getTextClasses('muted')}`}>
                ⏱️ Temps estimé : 15 minutes • 🔒 Données cryptées et sécurisées
              </p>
            </div>
          </BaseComponents.Card>
        </div>
      </div>
    )
  }

  // ✅ Si tout est OK, afficher le contenu
  return <>{children}</>
}