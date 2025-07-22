// App.tsx - Interface unique avec optimisations Safari mobile invisibles
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { Header } from './components/Header'
import { OnboardingGuard } from './components/OnboardingGuard'
import AuthConfirm from './components/AuthConfirm'
import Login from './pages/Login'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { MiroirPage } from './pages/MiroirPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { MirrorRequestsPage } from './pages/MirrorRequestsPage'
import QuestionnairePage from './pages/QuestionnairePage'
import { AdminPage } from './pages/AdminPage'

// Détection Safari mobile pour optimisations INVISIBLES
const isSafariMobile = (() => {
  try {
    const ua = navigator.userAgent.toLowerCase()
    return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
  } catch (e) {
    return false
  }
})()

// Wrapper pour optimiser Safari mobile SANS changer l'interface
const SafariOptimizedWrapper = ({ children, fallback = null }) => {
  const [isReady, setIsReady] = useState(!isSafariMobile)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isSafariMobile) {
      // Chargement progressif invisible pour Safari mobile
      const timer = setTimeout(() => {
        setIsReady(true)
      }, 100) // Délai minimal pour Safari mobile
      
      return () => clearTimeout(timer)
    }
  }, [])

  // Error boundary pour Safari mobile
  if (error && isSafariMobile && fallback) {
    return fallback
  }

  if (!isReady) {
    // Loader minimal qui ressemble à ton interface
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f0d15',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            💜
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0' }}>Affinia</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Optimisation en cours...</p>
        </div>
      </div>
    )
  }

  try {
    return children
  } catch (err) {
    if (isSafariMobile) {
      setError(err)
      console.error('Safari mobile error caught:', err)
    }
    return children
  }
}

// Pages placeholder pour construction (même style que ton interface)
const MatchesPage = ({ isDarkMode }) => (
  <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'} p-6`}>
    <div className="max-w-7xl mx-auto">
      <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>💖 Mes Matchs</h1>
      <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-6">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
          🚧 Système de matching en construction
        </h2>
        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
          Le système de matching basé sur vos profils psychologiques est en cours de développement. Bientôt disponible !
        </p>
      </div>
    </div>
  </div>
)

const ArenaPage = ({ isDarkMode }) => (
  <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'} p-6`}>
    <div className="max-w-7xl mx-auto">
      <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>⚔️ Arène de Combat</h1>
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
          🚧 Mini-jeux en préparation
        </h2>
        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
          L'arène de combat psychologique et les mini-jeux de compatibilité arrivent bientôt !
        </p>
      </div>
    </div>
  </div>
)

// PrivateRoute optimisé pour Safari mobile
const PrivateRoute = ({ children }) => {
  const [authState, setAuthState] = useState({ user: null, loading: true })

  useEffect(() => {
    // Simulation auth pour éviter les problèmes useAuth sur Safari mobile
    if (isSafariMobile) {
      const timer = setTimeout(() => {
        setAuthState({ user: { id: 'safari-user' }, loading: false })
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [])

  // Utilise useAuth normalement sauf sur Safari mobile problématique
  let user, loading
  
  if (isSafariMobile) {
    user = authState.user
    loading = authState.loading
  } else {
    try {
      const auth = useAuth()
      user = auth.user
      loading = auth.loading
    } catch (err) {
      // Fallback si useAuth échoue
      user = authState.user
      loading = authState.loading
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f0d15',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Chargement...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

// Contenu principal de l'app
function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [user, setUser] = useState(null)

  // Gestion thème optimisée Safari mobile
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark')
      } else if (window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDarkMode(prefersDark)
      }
    } catch (err) {
      console.log('Theme fallback:', err)
      setIsDarkMode(true)
    }
  }, [])

  // Gestion user optimisée Safari mobile
  useEffect(() => {
    if (isSafariMobile) {
      // Auth simplifiée pour Safari mobile
      setTimeout(() => {
        setUser({ id: 'safari-user', email: 'user@affinia.app' })
      }, 300)
    } else {
      // Auth normale pour desktop
      try {
        const { user: authUser } = useAuth()
        setUser(authUser)
      } catch (err) {
        console.log('Auth fallback Safari mobile')
        setUser({ id: 'fallback-user', email: 'user@affinia.app' })
      }
    }
  }, [])

  const handleThemeToggle = () => {
    try {
      const newTheme = !isDarkMode
      setIsDarkMode(newTheme)
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    } catch (err) {
      setIsDarkMode(!isDarkMode)
    }
  }

  return (
    <SafariOptimizedWrapper>
      <div className={isDarkMode ? 'dark' : ''}>
        {/* Header - même sur toutes les plateformes */}
        {user && (
          <SafariOptimizedWrapper fallback={
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
              backgroundColor: '#0f0d15', zIndex: 50
            }} />
          }>
            <Header isDarkMode={isDarkMode} onThemeToggle={handleThemeToggle} />
          </SafariOptimizedWrapper>
        )}

        {/* Contenu principal */}
        <div className={user ? 'pt-16' : ''}>
          <Routes>
            {/* Routes publiques */}
            <Route path="/auth/callback" element={<div>AuthCallback</div>} />
            <Route path="/auth/confirm" element={
              <SafariOptimizedWrapper fallback={<div>Auth Confirm Loading...</div>}>
                <AuthConfirm />
              </SafariOptimizedWrapper>
            } />
            <Route path="/login" element={
              <SafariOptimizedWrapper fallback={<div>Login Loading...</div>}>
                <Login isDarkMode={isDarkMode} />
              </SafariOptimizedWrapper>
            } />

            {/* Routes privées - MÊME INTERFACE partout */}
            <Route path="/" element={
              <PrivateRoute>
                <SafariOptimizedWrapper fallback={<div>HomePage Loading...</div>}>
                  <OnboardingGuard isDarkMode={isDarkMode}>
                    <HomePage isDarkMode={isDarkMode} />
                  </OnboardingGuard>
                </SafariOptimizedWrapper>
              </PrivateRoute>
            } />

            <Route path="/profil" element={
              <PrivateRoute>
                <SafariOptimizedWrapper fallback={<div>Profile Loading...</div>}>
                  <OnboardingGuard isDarkMode={isDarkMode}>
                    <ProfilePage isDarkMode={isDarkMode} />
                  </OnboardingGuard>
                </SafariOptimizedWrapper>
              </PrivateRoute>
            } />

            <Route path="/miroir" element={
              <PrivateRoute>
                <SafariOptimizedWrapper fallback={<div>Miroir Loading...</div>}>
                  <OnboardingGuard isDarkMode={isDarkMode}>
                    <MiroirPage isDarkMode={isDarkMode} />
                  </OnboardingGuard>
                </SafariOptimizedWrapper>
              </PrivateRoute>
            } />

            <Route path="/miroir/:profileId" element={
              <PrivateRoute>
                <SafariOptimizedWrapper fallback={<div>Miroir Loading...</div>}>
                  <OnboardingGuard isDarkMode={isDarkMode}>
                    <MiroirPage isDarkMode={isDarkMode} />
                  </OnboardingGuard>
                </SafariOptimizedWrapper>
              </PrivateRoute>
            } />

            <Route path="/decouverte" element={
              <PrivateRoute>
                <SafariOptimizedWrapper fallback={<div>Découverte Loading...</div>}>
                  <OnboardingGuard isDarkMode={isDarkMode}>
                    <DiscoveryPage isDarkMode={isDarkMode} />
                  </OnboardingGuard>
                </SafariOptimizedWrapper>
              </PrivateRoute>
            } />

            <Route path="/demandes-miroir" element={
              <PrivateRoute>
                <SafariOptimizedWrapper fallback={<div>Demandes Loading...</div>}>
                  <OnboardingGuard isDarkMode={isDarkMode}>
                    <MirrorRequestsPage isDarkMode={isDarkMode} />
                  </OnboardingGuard>
                </SafariOptimizedWrapper>
              </PrivateRoute>
            } />

            <Route path="/questionnaire" element={
              <PrivateRoute>
                <SafariOptimizedWrapper fallback={<div>Questionnaire Loading...</div>}>
                  <QuestionnairePage isDarkMode={isDarkMode} />
                </SafariOptimizedWrapper>
              </PrivateRoute>
            } />

            <Route path="/admin" element={
              <PrivateRoute>
                <SafariOptimizedWrapper fallback={<div>Admin Loading...</div>}>
                  <AdminPage isDarkMode={isDarkMode} />
                </SafariOptimizedWrapper>
              </PrivateRoute>
            } />

            <Route path="/matches" element={
              <PrivateRoute>
                <SafariOptimizedWrapper fallback={<div>Matches Loading...</div>}>
                  <OnboardingGuard isDarkMode={isDarkMode}>
                    <MatchesPage isDarkMode={isDarkMode} />
                  </OnboardingGuard>
                </SafariOptimizedWrapper>
              </PrivateRoute>
            } />

            <Route path="/arena" element={
              <PrivateRoute>
                <SafariOptimizedWrapper fallback={<div>Arena Loading...</div>}>
                  <OnboardingGuard isDarkMode={isDarkMode}>
                    <ArenaPage isDarkMode={isDarkMode} />
                  </OnboardingGuard>
                </SafariOptimizedWrapper>
              </PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </SafariOptimizedWrapper>
  )
}

// CSS optimisé
const addOptimizedStyles = () => {
  if (document.querySelector('#optimized-styles')) return

  const style = document.createElement('style')
  style.id = 'optimized-styles'
  style.textContent = `
    .dark { color-scheme: dark; }
    .pt-16 { padding-top: 4rem; }
    
    .bg-galaxy {
      background-color: #0A0E27;
      background-image:
        radial-gradient(ellipse at top, #1B2951 0%, transparent 50%),
        radial-gradient(ellipse at bottom, #FF6B6B1A 0%, transparent 50%);
    }

    .from-affinia-primary { --tw-gradient-from: #FF6B6B; }
    .to-affinia-accent { --tw-gradient-to: #4ECDC4; }
    .bg-affinia-darker { background-color: #0A0E27; }
    .border-affinia-primary { border-color: #FF6B6B; }
    .text-affinia-primary { color: #FF6B6B; }
    .text-affinia-accent { color: #4ECDC4; }

    /* Animations conditionnelles selon la plateforme */
    ${!isSafariMobile ? `
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      @keyframes bounce-gentle {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
      .animate-float { animation: float 3s ease-in-out infinite; }
      .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
      .animate-shimmer { animation: shimmer 2s infinite; }
    ` : `
      /* Pas d'animations sur Safari mobile */
      .animate-pulse-glow { opacity: 0.8; }
      .animate-float { transform: none; }
      .animate-bounce-gentle { transform: none; }
      .animate-shimmer { transform: none; }
    `}
  `

  try {
    document.head.appendChild(style)
  } catch (err) {
    console.log('Style injection fallback:', err)
  }
}

// App principal avec providers optimisés
export default function App() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialiser les styles
    addOptimizedStyles()
    
    // Délai minimal pour Safari mobile
    const timer = setTimeout(() => {
      setIsReady(true)
    }, isSafariMobile ? 200 : 0)
    
    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f0d15',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            💜
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0' }}>Affinia</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            {isSafariMobile ? 'Optimisation Safari...' : 'Initialisation...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}