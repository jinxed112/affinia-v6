// App.tsx - Fix NotificationProvider Safari mobile
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthCallback } from './components/AuthCallback'
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
import { ResetPasswordPage } from "./pages"

// Détection Safari mobile
const isSafariMobile = (() => {
  try {
    const ua = navigator.userAgent.toLowerCase()
    return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
  } catch (e) {
    return false
  }
})()

console.log('🔍 Safari mobile détecté:', isSafariMobile)

// NotificationProvider vide pour Safari mobile (pour éviter le crash)
const SafariNotificationProvider = ({ children }) => {
  // Contexte notifications minimal pour Safari mobile
  const mockNotificationContext = {
    notifications: [],
    addNotification: () => console.log('Notification ignorée sur Safari mobile'),
    removeNotification: () => {},
    clearNotifications: () => {}
  }

  return (
    <div>
      {children}
    </div>
  )
}

// Pages placeholder pour construction
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

// PrivateRoute
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()

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
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Gestion thème
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
    <div className={isDarkMode ? 'dark' : ''}>
      {/* Header */}
      {user && <Header isDarkMode={isDarkMode} onThemeToggle={handleThemeToggle} />}

      {/* Contenu principal */}
      <div className={user ? 'pt-16' : ''}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />
          <Route path="/reset-password" element={<ResetPasswordPage isDarkMode={isDarkMode} />} />

          {/* Routes privées */}
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

          <Route path="/miroir/:profileId" element={
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
              <QuestionnairePage isDarkMode={isDarkMode} />
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute>
              <AdminPage isDarkMode={isDarkMode} />
            </PrivateRoute>
          } />

          <Route path="/matches" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <MatchesPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/arena" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <ArenaPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
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

    /* Animations conditionnelles */
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

// App principal
export default function App() {
  useEffect(() => {
    addOptimizedStyles()
  }, [])

  return (
    <Router>
      <AuthProvider>
        {/* NotificationProvider conditionnel selon la plateforme */}
        {isSafariMobile ? (
          <SafariNotificationProvider>
            <AppContent />
          </SafariNotificationProvider>
        ) : (
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        )}
      </AuthProvider>
    </Router>
  )
}