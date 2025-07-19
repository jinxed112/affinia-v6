import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Sun, Moon, Sparkles, Users, Brain, AlertTriangle, UserPlus, LogIn, Play, ArrowRight, Eye, Shield, Zap, Star, Quote, ChevronDown, Instagram, Twitter, Youtube } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AffiniaLandingProps {
  isDarkMode?: boolean
}

const AffiniaLanding: React.FC<AffiniaLandingProps> = ({ isDarkMode: propIsDarkMode }) => {
  const [currentSection, setCurrentSection] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(propIsDarkMode ?? true)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [showLoginForm, setShowLoginForm] = useState(false) // État pour basculer entre landing et login
  const navigate = useNavigate()
  const { user, signInWithGoogle, loading } = useAuth()

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

  // Gestion de l'authentification Google
  const handleGoogleAuth = async () => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      await signInWithGoogle(redirectTo)
    } catch (error) {
      console.error('❌ Erreur lors de l\'authentification:', error)
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
  }

  // Gestion du thème
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode)
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light')
  }

  // Données pour la landing page - déclarées avant les useEffect
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

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

      {/* Condition pour afficher Landing ou Login Form */}
      {showLoginForm ? (
        <LoginForm 
          isDarkMode={isDarkMode}
          handleGoogleAuth={handleGoogleAuth}
          loading={loading}
          handleBackToLanding={handleBackToLanding}
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
        />
      )}
    </div>
  )
}

export { AffiniaLanding }
export default AffiniaLanding

// Composant formulaire de login classique
const LoginForm: React.FC<{
  isDarkMode: boolean
  handleGoogleAuth: () => void
  loading: boolean
  handleBackToLanding: () => void
}> = ({ isDarkMode, handleGoogleAuth, loading, handleBackToLanding }) => {

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

        {/* Header - Seulement connexion */}
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

        {/* Bouton Google */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 ${
            isDarkMode
              ? 'bg-white hover:bg-gray-100 text-gray-900 shadow-lg hover:shadow-xl'
              : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Connexion...' : 'Se connecter avec Google'}
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

// Composant contenu de la landing page
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
  steps 
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

          {/* CTA Principal */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <button 
              onClick={handleGoogleAuth}
              disabled={loading}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Brain className="w-6 h-6" />
              )}
              {loading ? 'Connexion...' : 'Découvre ton miroir'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
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

          {/* Stats ou Social Proof */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                10K+
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Miroirs révélés
              </div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                2.5K+
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Connexions authentiques
              </div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                94%
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Se découvrent vraiment
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

      {/* APERÇU DU MIROIR IA */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Voici à quoi ressemble<br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ton miroir intérieur
              </span>
            </h2>
          </div>

          <div className={`relative p-8 rounded-3xl ${
            isDarkMode 
              ? 'bg-gray-800/30 border border-gray-700/50' 
              : 'bg-white/30 border border-gray-200/50'
          } backdrop-blur-sm shadow-2xl`}>
            
            {/* Mock de l'interface du miroir */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              
              <div className="space-y-6">
                <div className={`p-6 rounded-xl ${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
                } backdrop-blur-sm`}>
                  <h3 className={`text-xl font-bold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Ton essence profonde
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        Créatif introverti avec une forte empathie
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        Recherche l'authenticité dans les relations
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        Valeurs : liberté, créativité, connexion
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-xl ${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
                } backdrop-blur-sm`}>
                  <h3 className={`text-xl font-bold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Tes patterns cachés
                  </h3>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    "Tu cherches des connexions profondes mais as tendance à te protéger derrière l'humour. 
                    Ton besoin d'authenticité est ton plus grand moteur."
                  </p>
                </div>
              </div>

              <div className="relative">
                {/* Zone vidéo placeholder */}
                <div className={`aspect-video rounded-xl ${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'
                } flex items-center justify-center border-2 border-dashed ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-400'
                }`}>
                  <div className="text-center">
                    <Play className={`w-16 h-16 mx-auto mb-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <p className={`text-lg font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Vidéo de démonstration
                    </p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Voir ton miroir en action
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ÉTAPES DU PARCOURS */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Ton voyage en 4 étapes
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              De la découverte de soi aux connexions authentiques
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className={`relative p-6 rounded-2xl bg-gradient-to-r ${step.gradient} text-white mb-6 mx-auto w-fit transition-all duration-300 group-hover:scale-110 shadow-xl`}>
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-gray-900 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                
                <h3 className={`text-xl font-bold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {step.title}
                </h3>
                
                <p className={`${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8">
                    <ArrowRight className={`w-6 h-6 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Ils ont découvert<br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                leur vrai moi
              </span>
            </h2>
          </div>

          <div className="relative">
            <div className={`p-8 rounded-2xl ${
              isDarkMode 
                ? 'bg-gray-800/50 border border-gray-700/50' 
                : 'bg-white/50 border border-gray-200/50'
            } backdrop-blur-sm shadow-xl text-center transition-all duration-500`}>
              
              <Quote className={`w-12 h-12 mx-auto mb-6 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
              
              <p className={`text-xl md:text-2xl leading-relaxed mb-8 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                "{testimonials[currentTestimonial].text}"
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <div className="text-4xl">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {testimonials[currentTestimonial].author}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Utilisateur Affinia
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation témoignages */}
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 scale-125'
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

      {/* SECTION TEASER VIDÉO */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className={`p-12 rounded-3xl ${
            isDarkMode 
              ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30' 
              : 'bg-gradient-to-r from-purple-100/50 to-pink-100/50 border border-purple-200/30'
          } backdrop-blur-sm shadow-2xl text-center`}>
            
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Prêt(e) à découvrir qui tu es vraiment ?
            </h2>
            
            <p className={`text-xl mb-8 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Regarde cette vidéo de 2 minutes qui va changer ta façon de voir les rencontres
            </p>

            {/* Zone vidéo teaser */}
            <div className="relative mb-8">
              <div className={`aspect-video rounded-xl ${
                isDarkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'
              } flex items-center justify-center border-2 border-dashed ${
                isDarkMode ? 'border-gray-600' : 'border-gray-400'
              } group cursor-pointer hover:border-purple-500 transition-all duration-300`}>
                
                <div className="text-center group-hover:scale-110 transition-transform duration-300">
                  <div className="p-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white mb-4 mx-auto w-fit shadow-xl">
                    <Play className="w-12 h-12" />
                  </div>
                  <p className={`text-lg font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Voir le teaser Affinia
                  </p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    2 min · Plein écran disponible
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleGoogleAuth}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-3 mx-auto disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Zap className="w-6 h-6" />
              )}
              {loading ? 'Connexion...' : 'Commencer mon voyage'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`relative z-10 py-16 px-6 border-t ${
        isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
      }`}>
        <div className="max-w-6xl mx-auto">
          
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            
            {/* Logo et description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
                <span className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Affinia
                </span>
              </div>
              <p className={`mb-6 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                La technologie qui rallume le feu humain. 
                Découvre ton essence profonde et connecte-toi authentiquement.
              </p>
              
              {/* Social Links */}
              <div className="flex gap-4">
                <button 
                  onClick={() => alert('Suivez-nous bientôt sur Instagram !')}
                  className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                    isDarkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Instagram className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => alert('Suivez-nous bientôt sur Twitter !')}
                  className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                    isDarkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => alert('Chaîne YouTube bientôt disponible !')}
                  className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                    isDarkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Youtube className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Liens */}
            <div>
              <h3 className={`font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Produit
              </h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={handleGoogleAuth}
                    className={`hover:underline ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Comment ça marche
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleGoogleAuth}
                    className={`hover:underline ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Découvre ton miroir
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleLoginRedirect}
                    className={`hover:underline cursor-pointer ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Connexions authentiques
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className={`font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Support
              </h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => alert('Page en cours de développement')}
                    className={`hover:underline ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Confidentialité
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => alert('Page en cours de développement')}
                    className={`hover:underline ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Conditions
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => alert('Page en cours de développement')}
                    className={`hover:underline ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className={`pt-8 border-t ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          } text-center`}>
            <p className={`${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              © 2025 Affinia. Tous droits réservés. Fait avec ❤️ pour rallumer le feu humain.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}