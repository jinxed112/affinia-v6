import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Sun, Moon, Sparkles, Users, Brain, AlertTriangle, UserPlus, LogIn, Play, ArrowRight, Eye, Shield, Zap, Star, Quote, ChevronDown, Instagram, Twitter, Youtube, ExternalLink, Smartphone } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

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
  const navigate = useNavigate()
  const { user, signInWithGoogle, loading, isWebView } = useAuth()

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

  // Gestion de l'authentification Google améliorée
  const handleGoogleAuth = async () => {
    try {
      setAuthError('')
      
      console.log('🔄 Tentative de connexion Google')
      console.log('📱 WebView détecté:', isWebView)
      
      const redirectTo = `${window.location.origin}/auth/callback`
      await signInWithGoogle(redirectTo)
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'authentification:', error)
      
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
        setAuthError('Veuillez autoriser les popups pour vous connecter')
        return
      }
      
      // Erreur générale
      setAuthError('Erreur de connexion. Veuillez réessayer.')
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

  // Données pour la landing page
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
              <p className="text-sm">Pour te connecter avec Google, ouvre Affinia dans Chrome ou Safari.</p>
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
          handleGoogleAuth={handleGoogleAuth}
          loading={loading}
          handleBackToLanding={handleBackToLanding}
          isWebView={isWebView}
          authError={authError}
        />
      ) : (
        <LandingContent 
          isDarkMode={isDarkMode}
          handleGoogleAuth={handleGoogleAuth}
          handleLoginRedirect={handleLoginRedirect}
          loading={loading}
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

// Composant formulaire de login adapté
const LoginForm: React.FC<{
  isDarkMode: boolean
  handleGoogleAuth: () => void
  loading: boolean
  handleBackToLanding: () => void
  isWebView: boolean
  authError: string
}> = ({ isDarkMode, handleGoogleAuth, loading, handleBackToLanding, isWebView, authError }) => {

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
      <div className={`w-full max-w-md p-8 rounded-2xl ${
        isDarkMode 
          ? 'bg-gray-800/50 border border-gray-700/50' 
          : 'bg-white/50 border border-gray-200/50'
      } backdrop-blur-sm shadow-2xl`}>
        
        {/* Bouton retour */}
        <button
          onClick={handleBackToLanding}
          className={`mb-6 flex items-center gap-2 text-sm ${
            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          } transition-colors`}
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Retour à l'accueil
        </button>

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

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Reconnecte-toi
          </h2>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Bon retour dans ton espace personnel
          </p>
        </div>

        {/* Avertissement WebView spécifique au login */}
        {isWebView && (
          <div className={`mb-6 p-4 rounded-xl ${
            isDarkMode ? 'bg-orange-900/30 border border-orange-500/30 text-orange-200' : 'bg-orange-100/50 border border-orange-300/50 text-orange-700'
          }`}>
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">Navigation dans une app</p>
                <p>Pour te connecter, ouvre ce lien dans Chrome ou Safari.</p>
              </div>
            </div>
          </div>
        )}

        {/* Bouton Google */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 ${
            isWebView
              ? isDarkMode
                ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg hover:shadow-xl'
                : 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg hover:shadow-xl'
              : isDarkMode
                ? 'bg-white hover:bg-gray-100 text-gray-900 shadow-lg hover:shadow-xl'
                : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
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
          {loading 
            ? 'Connexion...' 
            : isWebView 
              ? 'Ouvrir dans le navigateur'
              : 'Se connecter avec Google'
          }
        </button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-xs leading-relaxed ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            En te connectant, tu retrouves ton espace de découverte personnelle.
          </p>
        </div>
      </div>
    </div>
  )
}

// Composant contenu de la landing page (inchangé sauf isWebView)
const LandingContent: React.FC<{
  isDarkMode: boolean
  handleGoogleAuth: () => void
  handleLoginRedirect: () => void
  loading: boolean
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
  handleGoogleAuth, 
  handleLoginRedirect, 
  loading, 
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

          {/* CTA Principal avec indication WebView */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <button 
              onClick={handleGoogleAuth}
              disabled={loading}
              className={`group px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-3 disabled:opacity-50 ${
                isWebView
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              }`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isWebView ? (
                <ExternalLink className="w-6 h-6" />
              ) : (
                <Brain className="w-6 h-6" />
              )}
              {loading 
                ? 'Connexion...' 
                : isWebView 
                  ? 'Ouvrir dans le navigateur'
                  : 'Découvre ton miroir'
              }
              {!loading && !isWebView && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <button 
              onClick={handleLoginRedirect}
              disabled={loading}
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

          {/* Stats honnêtes */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
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
                5
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Dimensions analysées
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

      {/* Le reste du contenu reste identique... */}
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

      {/* Toutes les autres sections restent identiques... */}
    </>
  )
}