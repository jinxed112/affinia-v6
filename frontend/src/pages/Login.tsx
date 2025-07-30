import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Sun, Moon, Sparkles, Users, Brain, AlertTriangle, UserPlus, LogIn, Play, ArrowRight, Eye, Shield, Zap, Star, Quote, ChevronDown, Instagram, Twitter, Youtube, ExternalLink, Smartphone, Mail, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

interface AffiniaLandingProps {
  isDarkMode?: boolean
}

const AffiniaLanding: React.FC<AffiniaLandingProps> = ({ isDarkMode: propIsDarkMode }) => {
  const [currentSection, setCurrentSection] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(propIsDarkMode ?? true)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [authError, setAuthError] = useState<string>('')
  const [showWebViewWarning, setShowWebViewWarning] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | 'email' | null>(null)
  const navigate = useNavigate()
  const { user, signInWithGoogle, signInWithProvider, signInWithEmail, signUpWithEmail, loading, isWebView } = useAuth()

  useEffect(() => {
    if (propIsDarkMode !== undefined) {
      setIsDarkMode(propIsDarkMode)
    } else {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark')
      }
    }
  }, [propIsDarkMode])

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  // Afficher un avertissement WebView au chargement si nécessaire
  useEffect(() => {
    if (isWebView) {
      setShowWebViewWarning(true)
    }
  }, [isWebView])

  // Gestion de l'authentification par provider
  const handleProviderAuth = async (provider: 'google' | 'facebook') => {
    try {
      setAuthError('')
      setLoadingProvider(provider)
      
      console.log(`🔄 Tentative de connexion ${provider}`)
      console.log('📱 WebView détecté:', isWebView)
      
      const redirectTo = `${window.location.origin}/auth/callback`
      
      if (provider === 'google') {
        await signInWithGoogle(redirectTo)
      } else {
        await signInWithProvider(provider, redirectTo)
      }
      
    } catch (error: any) {
      console.error(`❌ Erreur lors de l'authentification ${provider}:`, error)
      
      // Gestion spécifique des erreurs
      if (error.message === 'WEBVIEW_REDIRECT') {
        setAuthError('Connexion en cours dans votre navigateur...')
        setTimeout(() => setAuthError(''), 3000)
        return
      }
      
      if (error.message === 'WEBVIEW_BLOCKED') {
        setAuthError('Connexion ouverte dans votre navigateur par défaut')
        setTimeout(() => setAuthError(''), 5000)
        return
      }
      
      if (error.message?.includes('disallowed_useragent')) {
        setAuthError('Veuillez ouvrir Affinia dans Chrome ou Safari pour vous connecter')
        setShowWebViewWarning(true)
        return
      }
      
      if (error.message?.includes('popup')) {
        setAuthError(`Veuillez autoriser les popups pour ${provider}`)
        return
      }
      
      // Erreur générale
      setAuthError(`Erreur de connexion ${provider}. Veuillez réessayer.`)
    } finally {
      setLoadingProvider(null)
    }
  }

  // Navigation vers la page de connexion
  const handleLoginRedirect = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('🔄 Basculement vers le mode login')
    setShowLoginForm(true)
  }

  // Retour vers la landing
  const handleBackToLanding = () => {
    console.log('🔄 Retour vers la landing')
    setShowLoginForm(false)
    setAuthError('')
  }

  // Gestion du thème
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode)
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light')
  }

  // Fonction pour ouvrir dans le navigateur externe
  const openInBrowser = () => {
    const currentUrl = window.location.href
    // Copier l'URL dans le presse-papier
    navigator.clipboard.writeText(currentUrl).then(() => {
      alert('Lien copié ! Collez-le dans Chrome ou Safari pour continuer.')
    }).catch(() => {
      alert(`Copiez ce lien et ouvrez-le dans Chrome ou Safari :\n${currentUrl}`)
    })
  }

  // Données pour la landing page (garder tes données existantes)
  const testimonials = [
    {
      text: "Pour la première fois, j'ai rencontré quelqu'un qui comprend vraiment qui je suis. Affinia a révélé des aspects de ma personnalité que j'ignorais moi-même.",
      author: "Sarah, 28 ans",
      avatar: "👩‍🦰"
    },
    {
      text: "J'étais sceptique au début, mais l'IA d'Affinia m'a fait découvrir des connexions incroyables. Fini les conversations superficielles !",
      author: "Thomas, 32 ans", 
      avatar: "👨‍💻"
    },
    {
      text: "Affinia m'a aidée à mieux me connaître avant même de rencontrer qui que ce soit. C'est révolutionnaire.",
      author: "Marie, 25 ans",
      avatar: "👩‍🎨"
    }
  ]

  const steps = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Découvre ton miroir",
      description: "L'IA analyse ta personnalité profonde en quelques questions",
      gradient: "from-purple-600 to-pink-600"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Révèle ton essence",
      description: "Obtiens un profil authentique qui révèle qui tu es vraiment",
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Connecte authentiquement",
      description: "Rencontre des personnes qui résonnent avec ton être profond",
      gradient: "from-green-600 to-emerald-600"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Vis des connexions vraies",
      description: "Construis des relations basées sur l'authenticité, pas l'apparence",
      gradient: "from-pink-600 to-rose-600"
    }
  ]

  const concepts = [
    {
      title: "Ton miroir intérieur",
      subtitle: "Pas un profil, une révélation",
      content: "Notre IA ne crée pas un profil de rencontre classique. Elle révèle ton essence profonde, tes valeurs cachées, tes rêves enfouis. Pour la première fois, vois-toi vraiment.",
      icon: <Brain className="w-12 h-12" />,
      gradient: "from-purple-600 to-pink-600"
    },
    {
      title: "Connexions d'âmes",
      subtitle: "Pas un catalogue, une quête",
      content: "Fini les swipes infinis et les conversations vides. Affinia t'aide à découvrir des personnes qui vibrent sur la même fréquence que toi. L'amour n'est pas un algorithme.",
      icon: <Users className="w-12 h-12" />,
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      title: "Technologie humaine",
      subtitle: "L'IA au service du cœur",
      content: "Le jour où la technologie dépassera nos échanges humains… cette prophétie n'a pas eu lieu. Avec Affinia, c'est le lien qui renaît. Une intelligence artificielle qui rallume le feu humain.",
      icon: <Sparkles className="w-12 h-12" />,
      gradient: "from-green-600 to-emerald-600"
    }
  ]

  const manifestSections = [
    {
      title: "Affinia",
      subtitle: "Où la technologie rallume le feu humain",
      content: `"Le jour où la technologie dépassera nos échanges humains…" — Cette prophétie n'a pas eu lieu. Avec Affinia, c'est le lien qui renaît.`,
      icon: <Sparkles className="w-6 h-6" />,
      gradient: "from-purple-600 to-pink-600"
    },
    {
      title: "Un miroir authentique",
      subtitle: "Découvre qui tu es vraiment",
      content: `Affinia utilise l'intelligence artificielle pour révéler ta vraie personnalité, au-delà des masques sociaux. Un outil qui t'aide à entendre ta propre voix intérieure et à t'accepter pleinement.`,
      icon: <Brain className="w-6 h-6" />,
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      title: "Des connexions authentiques",
      subtitle: "Trouve ceux qui vibrent vraiment avec toi",
      content: `Fini les swipes infinis. Affinia t'aide à découvrir des personnes qui résonnent avec ton essence profonde. Parce que la vraie complicité naît de l'authenticité, pas de l'apparence.`,
      icon: <Users className="w-6 h-6" />,
      gradient: "from-green-600 to-emerald-600"
    },
    {
      title: "Une quête, pas un supermarché",
      subtitle: "L'amour n'est pas un algorithme",
      content: `Ce n'est pas un catalogue de profils. C'est une aventure de découverte de soi et de rencontre profonde. Une technologie au service de l'humain, pour créer des liens qui durent.`,
      icon: <Heart className="w-6 h-6" />,
      gradient: "from-pink-600 to-rose-600"
    }
  ]

  // Animation auto des témoignages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Animation auto des sections
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSection(prev => (prev + 1) % manifestSections.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      
      {/* Background mystique */}
      <div className="fixed inset-0 z-0">
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20' 
            : 'bg-gradient-to-br from-purple-100/50 via-white to-pink-100/50'
        }`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)]" />
      </div>

      {/* Theme Toggle */}
      <button
        onClick={handleThemeToggle}
        className={`fixed top-6 right-6 z-50 p-3 rounded-xl transition-all duration-300 ${
          isDarkMode
            ? 'bg-gray-800/80 hover:bg-gray-700/80 text-yellow-400'
            : 'bg-white/80 hover:bg-white text-gray-800'
        } backdrop-blur-sm shadow-lg hover:scale-110`}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Avertissement WebView */}
      {showWebViewWarning && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md p-4 rounded-xl ${
          isDarkMode ? 'bg-orange-900/90 border border-orange-500/50 text-orange-200' : 'bg-orange-100/90 border border-orange-300/50 text-orange-800'
        } backdrop-blur-sm shadow-xl`}>
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium mb-1">App détectée</p>
              <p className="text-sm">Pour te connecter, ouvre Affinia dans Chrome ou Safari.</p>
              <button 
                onClick={openInBrowser}
                className="mt-2 text-sm underline flex items-center gap-1 hover:opacity-80"
              >
                Copier le lien <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <button 
              onClick={() => setShowWebViewWarning(false)}
              className="text-lg leading-none hover:opacity-80"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {authError && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md p-4 rounded-xl ${
          isDarkMode ? 'bg-red-900/90 border border-red-500/50 text-red-200' : 'bg-red-100/90 border border-red-300/50 text-red-800'
        } backdrop-blur-sm shadow-xl`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">{authError}</p>
            </div>
            <button 
              onClick={() => setAuthError('')}
              className="text-lg leading-none hover:opacity-80"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Condition pour afficher Landing ou Login Form */}
      {showLoginForm ? (
        <LoginForm 
          isDarkMode={isDarkMode}
          handleProviderAuth={handleProviderAuth}
          signInWithEmail={signInWithEmail}
          signUpWithEmail={signUpWithEmail}
          loadingProvider={loadingProvider}
          setLoadingProvider={setLoadingProvider}
          handleBackToLanding={handleBackToLanding}
          isWebView={isWebView}
          authError={authError}
          setAuthError={setAuthError}
        />
      ) : (
        <LandingContent 
          isDarkMode={isDarkMode}
          handleProviderAuth={handleProviderAuth}
          handleLoginRedirect={handleLoginRedirect}
          loadingProvider={loadingProvider}
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          currentTestimonial={currentTestimonial}
          setCurrentTestimonial={setCurrentTestimonial}
          manifestSections={manifestSections}
          testimonials={testimonials}
          concepts={concepts}
          steps={steps}
          isWebView={isWebView}
        />
      )}
    </div>
  )
}

export { AffiniaLanding }
export default AffiniaLanding

// Composant formulaire de login avec nouvelles options ET reset password
const LoginForm: React.FC<{
  isDarkMode: boolean
  handleProviderAuth: (provider: 'google' | 'facebook') => void
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<any>
  loadingProvider: 'google' | 'facebook' | 'email' | null
  setLoadingProvider: (provider: 'google' | 'facebook' | 'email' | null) => void
  handleBackToLanding: () => void
  isWebView: boolean
  authError: string
  setAuthError: (error: string) => void
}> = ({ 
  isDarkMode, 
  handleProviderAuth, 
  signInWithEmail, 
  signUpWithEmail,
  loadingProvider,
  setLoadingProvider, 
  handleBackToLanding, 
  isWebView, 
  authError,
  setAuthError 
}) => {
  
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setAuthError('')
      setLoadingProvider('email')

      if (isSignUp) {
        // Validation pour l'inscription
        if (password !== confirmPassword) {
          setAuthError('Les mots de passe ne correspondent pas')
          return
        }
        if (password.length < 6) {
          setAuthError('Le mot de passe doit contenir au moins 6 caractères')
          return
        }
        
        const result = await signUpWithEmail(email, password)
        
        if (result?.user && !result?.user?.email_confirmed_at) {
          setAuthError('Un email de confirmation a été envoyé. Vérifiez votre boîte mail.')
        }
      } else {
        // Connexion
        await signInWithEmail(email, password)
      }
      
    } catch (error: any) {
      console.error('❌ Erreur email auth:', error)
      
      if (error.message?.includes('Invalid login credentials')) {
        setAuthError('Email ou mot de passe incorrect')
      } else if (error.message?.includes('User already registered')) {
        setAuthError('Un compte existe déjà avec cet email')
      } else {
        setAuthError(error.message || 'Erreur de connexion')
      }
    } finally {
      setLoadingProvider(null)
    }
  }

  // 🔥 NOUVELLE FONCTION : Reset Password
  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Veuillez entrer votre email d\'abord')
      return
    }
    
    try {
      setAuthError('')
      setLoadingProvider('email')
      
      console.log('🔄 Envoi email reset password pour:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        console.error('❌ Erreur reset password:', error)
        setAuthError('Erreur lors de l\'envoi de l\'email')
        return
      }
      
      console.log('✅ Email de reset envoyé avec succès')
      setAuthError('✅ Email de réinitialisation envoyé ! Vérifiez votre boîte mail.')
      
    } catch (error: any) {
      console.error('❌ Erreur reset password:', error)
      setAuthError('Une erreur est survenue')
    } finally {
      setLoadingProvider(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
      <div className={`w-full max-w-md p-8 rounded-2xl ${
        isDarkMode 
          ? 'bg-gray-800/50 border border-gray-700/50' 
          : 'bg-white/50 border border-gray-200/50'
      } backdrop-blur-sm shadow-2xl`}>
        
        {/* Bouton retour */}
        {!showEmailForm && (
          <button
            onClick={handleBackToLanding}
            className={`mb-6 flex items-center gap-2 text-sm ${
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Retour à l'accueil
          </button>
        )}

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-purple-600" />
            <span className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Affinia
            </span>
          </div>
        </div>

        {showEmailForm ? (
          // Formulaire email
          <div>
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {isSignUp ? 'Créer un compte' : 'Se connecter'}
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {isSignUp ? 'Rejoins la communauté Affinia' : 'Bon retour parmi nous'}
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500' 
                      : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>
              
              <div>
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500' 
                      : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              </div>

              {isSignUp && (
                <div>
                  <input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500' 
                        : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loadingProvider === 'email'}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50"
              >
                {loadingProvider === 'email' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                {loadingProvider === 'email' ? 'Connexion...' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
              </button>
            </form>

            {/* 🔥 BOUTON MOT DE PASSE OUBLIÉ */}
            {!isSignUp && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={!email || loadingProvider !== null}
                  className={`text-sm hover:underline transition-colors ${
                    isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                  } ${(!email || loadingProvider !== null) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {loadingProvider === 'email' ? 'Envoi en cours...' : 'Mot de passe oublié ?'}
                </button>
                {!email && (
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Entrez votre email d'abord
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className={`text-sm hover:underline ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}
              >
                {isSignUp ? 'J\'ai déjà un compte' : 'Créer un compte'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowEmailForm(false)}
                className={`text-sm hover:underline ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Retour aux options de connexion
              </button>
            </div>
          </div>
        ) : (
          // Options de connexion
          <div>
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Se connecter
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Choisis ta méthode de connexion
              </p>
            </div>

            {/* Avertissement WebView */}
            {isWebView && (
              <div className={`mb-6 p-4 rounded-xl ${
                isDarkMode ? 'bg-orange-900/30 border border-orange-500/30 text-orange-200' : 'bg-orange-100/50 border border-orange-300/50 text-orange-700'
              }`}>
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Navigation dans une app</p>
                    <p>Pour te connecter, ces liens s'ouvriront dans ton navigateur.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons providers sociaux */}
            <div className="space-y-3 mb-6">
              {/* Google */}
              <button
                onClick={() => handleProviderAuth('google')}
                disabled={loadingProvider !== null}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 ${
                  isDarkMode
                    ? 'bg-white hover:bg-gray-100 text-gray-900'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                } shadow-lg hover:shadow-xl`}
              >
                <div className="flex items-center justify-center">
                  {loadingProvider === 'google' ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : isWebView ? (
                    <ExternalLink className="w-5 h-5" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                </div>
                
                <div className="flex-1 text-left">
                  <div className="font-semibold">
                    {loadingProvider === 'google' 
                      ? 'Connexion...' 
                      : isWebView 
                        ? 'Ouvrir Google'
                        : 'Se connecter avec Google'
                    }
                  </div>
                  {loadingProvider !== 'google' && (
                    <div className="text-sm opacity-80">
                      Gmail, YouTube, Drive...
                    </div>
                  )}
                </div>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleProviderAuth('facebook')}
                disabled={loadingProvider !== null}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50"
              >
                <div className="flex items-center justify-center">
                  {loadingProvider === 'facebook' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isWebView ? (
                    <ExternalLink className="w-5 h-5" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                </div>
                
                <div className="flex-1 text-left">
                  <div className="font-semibold">
                    {loadingProvider === 'facebook' 
                      ? 'Connexion...' 
                      : isWebView 
                        ? 'Ouvrir Facebook'
                        : 'Se connecter avec Facebook'
                    }
                  </div>
                  {loadingProvider !== 'facebook' && (
                    <div className="text-sm opacity-80">
                      Facebook, Instagram, Messenger...
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Séparateur */}
            <div className="relative my-6">
              <div className={`absolute inset-0 flex items-center ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`}>
                <div className="w-full border-t border-current opacity-30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-4 ${
                  isDarkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-white/50 text-gray-600'
                }`}>
                  ou
                </span>
              </div>
            </div>

            {/* Bouton Email */}
            <button
              onClick={() => setShowEmailForm(true)}
              disabled={loadingProvider !== null}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-gray-800/50 text-white hover:bg-gray-700/50 border border-gray-700' 
                  : 'bg-white/50 text-gray-900 hover:bg-white border border-gray-200'
              } backdrop-blur-sm shadow-lg hover:shadow-xl`}
            >
              <Mail className="w-5 h-5" />
              Continuer avec un email
            </button>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className={`text-xs leading-relaxed ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                En te connectant, tu acceptes nos conditions et tu commences ton voyage de découverte personnelle.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Composant contenu de la landing page (garde tes composants existants)
const LandingContent: React.FC<{
  isDarkMode: boolean
  handleProviderAuth: (provider: 'google' | 'facebook') => void
  handleLoginRedirect: () => void
  loadingProvider: 'google' | 'facebook' | 'email' | null
  currentSection: number
  setCurrentSection: (index: number) => void
  currentTestimonial: number
  setCurrentTestimonial: (index: number) => void
  manifestSections: any[]
  testimonials: any[]
  concepts: any[]
  steps: any[]
  isWebView: boolean
}> = ({ 
  isDarkMode, 
  handleProviderAuth, 
  handleLoginRedirect, 
  loadingProvider, 
  currentSection, 
  setCurrentSection, 
  currentTestimonial, 
  setCurrentTestimonial,
  manifestSections, 
  testimonials, 
  concepts, 
  steps,
  isWebView
}) => {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-6xl mx-auto text-center">
          
          {/* Logo et titre principal */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <h1 className={`text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}>
                Affinia
              </h1>
            </div>
            
            <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Où la technologie rallume<br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                le feu humain
              </span>
            </h2>
            
            <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Découvre qui tu es vraiment. Connecte-toi à ton essence profonde. 
              Rencontre des âmes qui vibrent sur ta fréquence.
            </p>
          </div>

          {/* CTA Principal - Ouvrir les options */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <button 
              onClick={handleLoginRedirect}
              disabled={loadingProvider !== null}
              className={`group px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-3 disabled:opacity-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white`}
            >
              {loadingProvider ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Brain className="w-6 h-6" />
              )}
              {loadingProvider ? 'Connexion...' : 'Découvre ton miroir'}
              {!loadingProvider && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <button 
              onClick={handleLoginRedirect}
              disabled={loadingProvider !== null}
              className={`group px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 flex items-center gap-3 disabled:opacity-50 cursor-pointer ${
                isDarkMode 
                  ? 'bg-gray-800/50 text-white hover:bg-gray-700/50 border border-gray-700' 
                  : 'bg-white/50 text-gray-900 hover:bg-white border border-gray-200'
              } backdrop-blur-sm`}
            >
              <LogIn className="w-6 h-6" />
              J'ai déjà un compte
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                3
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Moyens de connexion
              </div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                16
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Types de personnalité
              </div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                ∞
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Facettes uniques
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        </div>
      </section>

      {/* CONCEPTS SECTION */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Une révolution dans la façon<br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                de se rencontrer
              </span>
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Affinia repense complètement l'approche des rencontres. 
              Pas de superficialité, pas de catalogues humains.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {concepts.map((concept, index) => (
              <div
                key={index}
                className={`p-8 rounded-2xl transition-all duration-500 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700/50' 
                    : 'bg-white/50 hover:bg-white/70 border border-gray-200/50'
                } backdrop-blur-sm shadow-xl hover:shadow-2xl group`}
              >
                <div className={`p-4 rounded-xl bg-gradient-to-r ${concept.gradient} text-white mb-6 w-fit`}>
                  {concept.icon}
                </div>
                
                <h3 className={`text-2xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {concept.title}
                </h3>
                
                <h4 className={`text-lg font-medium mb-4 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {concept.subtitle}
                </h4>
                
                <p className={`leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {concept.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO SECTIONS */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className={`relative overflow-hidden rounded-3xl p-12 ${
            isDarkMode 
              ? 'bg-gray-800/50 border border-gray-700/50' 
              : 'bg-white/50 border border-gray-200/50'
          } backdrop-blur-sm shadow-2xl`}>
            
            {/* Indicateurs */}
            <div className="flex justify-center gap-2 mb-8">
              {manifestSections.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSection(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSection
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 scale-110'
                      : isDarkMode
                        ? 'bg-gray-600 hover:bg-gray-500'
                        : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {/* Contenu animé */}
            <div className="text-center min-h-[300px] flex flex-col justify-center">
              {manifestSections.map((section, index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ${
                    index === currentSection
                      ? 'opacity-100 transform translate-y-0'
                      : 'opacity-0 transform translate-y-8 absolute inset-0 pointer-events-none'
                  }`}
                >
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${section.gradient} text-white mb-6 w-fit mx-auto`}>
                    {section.icon}
                  </div>
                  
                  <h3 className={`text-3xl md:text-4xl font-bold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {section.title}
                  </h3>
                  
                  <h4 className={`text-xl font-medium mb-6 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    {section.subtitle}
                  </h4>
                  
                  <p className={`text-lg leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ÉTAPES SECTION */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Comment ça marche ?
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Quatre étapes simples pour découvrir qui tu es vraiment et rencontrer ton match authentique.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                
                {/* Numéro et connexion */}
                <div className="flex items-center justify-center mb-6">
                  <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl bg-gradient-to-r ${step.gradient} shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    {index + 1}
                  </div>
                  
                  {/* Ligne de connexion */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute left-1/2 transform translate-x-8 w-32 h-0.5 bg-gradient-to-r from-purple-600/30 to-pink-600/30"></div>
                  )}
                </div>

                <div className={`p-6 rounded-2xl transition-all duration-500 group-hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700/50' 
                    : 'bg-white/50 hover:bg-white/70 border border-gray-200/50'
                } backdrop-blur-sm shadow-xl hover:shadow-2xl`}>
                  
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${step.gradient} text-white mb-4 w-fit mx-auto`}>
                    {step.icon}
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </h3>
                  
                  <p className={`text-sm leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <button 
              onClick={handleLoginRedirect}
              className="group px-12 py-4 rounded-xl font-semibold text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-3 mx-auto"
            >
              <Play className="w-6 h-6" />
              Commencer mon voyage
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className={`mt-4 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Inscription gratuite • Aucune carte bancaire requise
            </p>
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES SECTION */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Ils ont trouvé leur<br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                véritable miroir
              </span>
            </h2>
          </div>

          <div className={`relative overflow-hidden rounded-3xl p-12 ${
            isDarkMode 
              ? 'bg-gray-800/50 border border-gray-700/50' 
              : 'bg-white/50 border border-gray-200/50'
          } backdrop-blur-sm shadow-2xl`}>
            
            {/* Citation */}
            <div className="text-center mb-8">
              <Quote className={`w-12 h-12 mx-auto mb-6 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>

            {/* Contenu témoignage animé */}
            <div className="text-center min-h-[200px] flex flex-col justify-center relative">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ${
                    index === currentTestimonial
                      ? 'opacity-100 transform translate-y-0'
                      : 'opacity-0 transform translate-y-8 absolute inset-0 pointer-events-none'
                  }`}
                >
                  <blockquote className={`text-xl md:text-2xl leading-relaxed mb-8 italic ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    "{testimonial.text}"
                  </blockquote>
                  
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-4xl">{testimonial.avatar}</div>
                    <div className="text-left">
                      <cite className={`font-semibold not-italic ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {testimonial.author}
                      </cite>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Indicateurs témoignages */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 scale-110'
                      : isDarkMode
                        ? 'bg-gray-600 hover:bg-gray-500'
                        : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          
          <div className={`p-12 rounded-3xl ${
            isDarkMode 
              ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/20' 
              : 'bg-gradient-to-br from-purple-100/80 to-pink-100/80 border border-purple-200/50'
          } backdrop-blur-sm shadow-2xl`}>
            
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Prêt à découvrir<br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ton vrai toi ?
              </span>
            </h2>
            
            <p className={`text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Rejoins des milliers de personnes qui ont choisi l'authenticité plutôt que la superficialité.
              Ton miroir intérieur t'attend.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={handleLoginRedirect}
                className="group px-12 py-5 rounded-xl font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-3"
              >
                <Sparkles className="w-7 h-7" />
                Commencer maintenant
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-8 mt-8 text-sm opacity-75">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>100% sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Inscription rapide</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>Gratuit</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}