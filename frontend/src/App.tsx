import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthCallback } from './components/AuthCallback'
import AuthConfirm from './components/AuthConfirm'  // 👈 NOUVEAU
import { Header } from './components/Header'
import { OnboardingGuard } from './components/OnboardingGuard'
// ✅ Import corrigé - utilise l'export par défaut pour plus de simplicité
import Login from './pages/Login'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { MiroirPage } from './pages/MiroirPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { MirrorRequestsPage } from './pages/MirrorRequestsPage'
import QuestionnairePage from './pages/QuestionnairePage'
import { AdminPage } from './pages/AdminPage'
import { supabase } from './lib/supabase'

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

  console.log('🔍 PrivateRoute - Loading:', loading, 'User:', user?.email)

  // Si on a un user, on affiche la page même si loading = true
  if (user) {
    return <>{children}</>
  }

  // Si pas d'user et qu'on charge encore, afficher le spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-gray-800 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="mt-6 text-white text-lg font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  // Pas d'user et pas en chargement = redirection login
  return <Navigate to="/login" />
}

// Composant principal de l'application
function AppContent() {
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Récupérer la préférence de thème au chargement
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    } else {
      // Détecter la préférence système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
    }
  }, [])

  // Fonction pour basculer le thème
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }
  
  // ✅ TEST DIRECT SUPABASE AVEC TIMEOUT
  React.useEffect(() => {
    console.log('🚨 APP.TSX - Test direct Supabase')
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout getSession')), 3000)
    );
    
    Promise.race([
      supabase.auth.getSession(),
      timeoutPromise
    ]).then(({ data, error }) => {
      console.log('🚨 APP.TSX - Session userId:', data?.session?.user?.id)
      console.log('🚨 APP.TSX - Session email:', data?.session?.user?.email)
      console.log('🚨 APP.TSX - Error:', error)
      
      if (data?.session?.user?.id) {
        console.log('🚨 APP.TSX - Test query profiles direct...')
        supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single()
          .then(({ data: profileData, error: profileError }) => {
            console.log('🚨 APP.TSX - Profile data:', profileData)
            console.log('🚨 APP.TSX - Profile error:', profileError)
          })
      }
    }).catch(error => {
      console.log('🚨 APP.TSX - TIMEOUT OU ERREUR:', error.message)
      console.log('🚨 APP.TSX - Supabase semble bloqué!')
    })
  }, [])
  
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {/* Header global - affiché seulement si connecté */}
      {user && <Header isDarkMode={isDarkMode} onThemeToggle={handleThemeToggle} />}
      
      {/* Contenu principal avec OnboardingGuard pour les routes privées */}
      <div className={user ? 'pt-16' : ''}>
        <Routes>
          {/* ✅ ROUTES PUBLIQUES - Pas de protection */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />  {/* 👈 NOUVEAU */}
          <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />
          
          {/* ✅ ROUTES PRIVÉES - Avec OnboardingGuard */}
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
          
          {/* ✅ QUESTIONNAIRE - Accessible même sans questionnaire complété */}
          <Route
            path="/questionnaire"
            element={
              <PrivateRoute>
                <QuestionnairePage isDarkMode={isDarkMode} />
              </PrivateRoute>
            }
          />

          {/* ✅ ADMIN - Protégé mais pas soumis à l'onboarding */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminPage isDarkMode={isDarkMode} />
              </PrivateRoute>
            }
          />

          {/* ✅ AUTRES PAGES - Avec OnboardingGuard */}
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
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

// Composant App principal avec tous les providers
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

// ✅ STYLES DE BASE CONSERVÉS
const style = document.createElement('style')
style.textContent = `
  .dark {
    color-scheme: dark;
  }
  
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
  .pt-16 { padding-top: 4rem; }
  
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
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-bounce-gentle {
    animation: bounce-gentle 2s ease-in-out infinite;
  }

  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`
document.head.appendChild(style)