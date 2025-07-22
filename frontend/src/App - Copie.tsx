// App.tsx - Chargement progressif pour Safari mobile
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
import { supabase } from './lib/supabase'

// Détection Safari mobile
const isSafariMobile = (() => {
  const ua = navigator.userAgent.toLowerCase()
  return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
})()

console.log('🔍 Safari mobile détecté - Mode progressif:', isSafariMobile)

// Loading progressif pour Safari mobile
const ProgressiveLoader: React.FC<{ phase: number; total: number; message: string }> = ({ phase, total, message }) => (
  <div style={{
    minHeight: '100vh',
    minHeight: isSafariMobile ? '-webkit-fill-available' : '100vh',
    backgroundColor: '#0f0d15',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Arial, sans-serif'
  }}>
    <div style={{ textAlign: 'center', maxWidth: '300px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
        borderRadius: '50%',
        margin: '0 auto 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem'
      }}>
        💜
      </div>
      
      <h2 style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>Affinia</h2>
      
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#374151',
        borderRadius: '4px',
        margin: '1rem 0',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(phase / total) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #ec4899, #8b5cf6)',
          borderRadius: '4px',
          transition: 'width 0.5s ease'
        }} />
      </div>
      
      <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>{message}</p>
      <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>
        Étape {phase}/{total} - {Math.round((phase / total) * 100)}%
      </p>
      
      {isSafariMobile && (
        <p style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '1rem' }}>
          Mode Safari mobile optimisé
        </p>
      )}
    </div>
  </div>
)

// Pages placeholder temporaires
const MatchesPage = ({ isDarkMode }: { isDarkMode: boolean }) => (
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

const ArenaPage = ({ isDarkMode }: { isDarkMode: boolean }) => (
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

// Composant pour protéger les routes privées
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <ProgressiveLoader phase={1} total={3} message="Vérification de l'authentification..." />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

// Hook pour chargement progressif
const useProgressiveLoading = () => {
  const [loadingPhase, setLoadingPhase] = useState(0)
  
  useEffect(() => {
    if (!isSafariMobile) {
      // Chargement immédiat sur desktop
      setLoadingPhase(5)
      return
    }
    
    // Chargement progressif sur Safari mobile
    const phases = [
      { delay: 100, phase: 1, message: "Initialisation..." },
      { delay: 300, phase: 2, message: "Configuration de l'authentification..." },
      { delay: 500, phase: 3, message: "Préparation de l'interface..." },
      { delay: 700, phase: 4, message: "Chargement des composants..." },
      { delay: 1000, phase: 5, message: "Finalisation..." }
    ]
    
    phases.forEach(({ delay, phase }) => {
      setTimeout(() => setLoadingPhase(phase), delay)
    })
  }, [])
  
  return loadingPhase
}

// Composant principal avec chargement progressif
function AppContent() {
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const loadingPhase = useProgressiveLoading()

  // Gestion thème avec fallback Safari mobile
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
      console.log('🔍 Theme fallback:', err)
      setIsDarkMode(true)
    }
  }, [])

  // Fonction toggle thème avec fallback
  const handleThemeToggle = () => {
    try {
      const newTheme = !isDarkMode
      setIsDarkMode(newTheme)
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    } catch (err) {
      setIsDarkMode(!isDarkMode)
    }
  }

  // Test Supabase seulement après chargement complet
  useEffect(() => {
    if (loadingPhase >= 5) {
      console.log('🚨 APP.TSX - Test Supabase après chargement progressif')
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout getSession')), isSafariMobile ? 5000 : 3000)
      )

      Promise.race([
        supabase.auth.getSession(),
        timeoutPromise
      ]).then(({ data, error }) => {
        console.log('🚨 APP.TSX - Session:', data?.session?.user?.email)
        if (error) console.log('🚨 APP.TSX - Error:', error)
      }).catch(error => {
        console.log('🚨 APP.TSX - Timeout/Error:', error.message)
      })
    }
  }, [loadingPhase])

  // Afficher loader progressif pendant le chargement
  if (loadingPhase < 5) {
    const messages = [
      "Initialisation...",
      "Configuration de l'authentification...",
      "Préparation de l'interface...",
      "Chargement des composants...",
      "Finalisation..."
    ]
    return <ProgressiveLoader 
      phase={loadingPhase} 
      total={5} 
      message={messages[loadingPhase - 1] || "Chargement..."} 
    />
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {/* Header global */}
      {user && <Header isDarkMode={isDarkMode} onThemeToggle={handleThemeToggle} />}

      {/* Contenu principal */}
      <div className={user ? 'pt-16' : ''}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/auth/callback" element={<div>AuthCallback</div>} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />

          {/* Routes privées avec OnboardingGuard */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <OnboardingGuard isDarkMode={isDarkMode}>
                  <HomePage isDarkMode={isDarkMode} />
                </OnboardingGuard>
              </PrivateRoute>
            }
          />

          <Route
            path="/profil"
            element={
              <PrivateRoute>
                <OnboardingGuard isDarkMode={isDarkMode}>
                  <ProfilePage isDarkMode={isDarkMode} />
                </OnboardingGuard>
              </PrivateRoute>
            }
          />

          <Route
            path="/miroir"
            element={
              <PrivateRoute>
                <OnboardingGuard isDarkMode={isDarkMode}>
                  <MiroirPage isDarkMode={isDarkMode} />
                </OnboardingGuard>
              </PrivateRoute>
            }
          />

          <Route
            path="/miroir/:profileId"
            element={
              <PrivateRoute>
                <OnboardingGuard isDarkMode={isDarkMode}>
                  <MiroirPage isDarkMode={isDarkMode} />
                </OnboardingGuard>
              </PrivateRoute>
            }
          />

          <Route
            path="/decouverte"
            element={
              <PrivateRoute>
                <OnboardingGuard isDarkMode={isDarkMode}>
                  <DiscoveryPage isDarkMode={isDarkMode} />
                </OnboardingGuard>
              </PrivateRoute>
            }
          />

          <Route
            path="/demandes-miroir"
            element={
              <PrivateRoute>
                <OnboardingGuard isDarkMode={isDarkMode}>
                  <MirrorRequestsPage isDarkMode={isDarkMode} />
                </OnboardingGuard>
              </PrivateRoute>
            }
          />

          <Route
            path="/questionnaire"
            element={
              <PrivateRoute>
                <QuestionnairePage isDarkMode={isDarkMode} />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminPage isDarkMode={isDarkMode} />
              </PrivateRoute>
            }
          />

          <Route
            path="/matches"
            element={
              <PrivateRoute>
                <OnboardingGuard isDarkMode={isDarkMode}>
                  <MatchesPage isDarkMode={isDarkMode} />
                </OnboardingGuard>
              </PrivateRoute>
            }
          />

          <Route
            path="/arena"
            element={
              <PrivateRoute>
                <OnboardingGuard isDarkMode={isDarkMode}>
                  <ArenaPage isDarkMode={isDarkMode} />
                </OnboardingGuard>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

// App principal avec providers
export default function App() {
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

// CSS optimisé Safari mobile
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

    /* Animations seulement sur desktop */
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
    ` : ''}
  `

  try {
    document.head.appendChild(style)
  } catch (err) {
    console.log('Style injection fallback:', err)
  }
}

// Initialiser les styles
addOptimizedStyles()