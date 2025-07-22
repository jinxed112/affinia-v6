// App.tsx - Version Safari Mobile + Desktop avec imports ES6 standard
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'

// Détection Safari mobile
const isSafariMobile = (() => {
  try {
    const ua = navigator.userAgent.toLowerCase()
    return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
  } catch (e) {
    return true
  }
})()

console.log('🔍 Safari mobile détecté:', isSafariMobile)

// =============================================================================
// VERSION SAFARI MOBILE - Simple, sans composants complexes
// =============================================================================

const SafariMobileApp = () => {
  const [currentPage, setCurrentPage] = useState('home')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Simulation auth simple pour Safari mobile
  useEffect(() => {
    setTimeout(() => {
      setUser({ email: 'user@example.com', id: '123' })
      setLoading(false)
    }, 1000)
  }, [])

  // HomePage Safari mobile
  const HomePage = () => (
    <div style={{
      minHeight: '100vh',
      minHeight: '-webkit-fill-available',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header fixe */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(15, 13, 21, 0.95)',
        padding: '1rem',
        borderBottom: '1px solid #374151',
        zIndex: 50,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#ec4899' }}>💜 Affinia</h1>
          <button
            onClick={() => setCurrentPage('profil')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            👤 Profil
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{ paddingTop: '5rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏠 Tableau de Bord</h2>
          <p style={{ color: '#9ca3af' }}>Version Safari Mobile Optimisée</p>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[
            { emoji: '🏆', label: 'NIVEAU', value: '1' },
            { emoji: '⚡', label: 'XP', value: '0' },
            { emoji: '💫', label: 'CRÉDITS', value: '1000' },
            { emoji: '❤️', label: 'MATCHS', value: '0' }
          ].map((stat, index) => (
            <div key={index} style={{
              padding: '1.5rem',
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #374151'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.emoji}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Status questionnaire */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#7c2d12',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid #dc2626'
        }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>⏳ Questionnaire En Attente</h3>
          <p style={{ marginBottom: '1rem', color: '#fecaca' }}>
            Complétez le questionnaire pour débloquer toutes les fonctionnalités.
          </p>
          <button
            onClick={() => setCurrentPage('questionnaire')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            📝 Faire le questionnaire
          </button>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[
            { emoji: '👤', label: 'Mon Profil', page: 'profil' },
            { emoji: '📝', label: 'Questionnaire', page: 'questionnaire' },
            { emoji: '🪞', label: 'Mon Miroir', page: 'miroir' },
            { emoji: '🔍', label: 'Découverte', page: 'decouverte' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(item.page)}
              style={{
                padding: '1rem',
                backgroundColor: '#374151',
                color: 'white',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.emoji}</div>
              {item.label}
            </button>
          ))}
        </div>

        {/* Success message */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#065f46',
          borderRadius: '8px',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          <p>🎉 Safari Mobile fonctionne !</p>
          <p style={{ fontSize: '0.8rem', color: '#d1fae5', marginTop: '0.5rem' }}>
            Interface simplifiée pour des performances maximales.
          </p>
        </div>
      </div>
    </div>
  )

  // Autres pages simples
  const SimplePage = ({ title, emoji, backButton = true }) => (
    <div style={{
      minHeight: '100vh',
      minHeight: '-webkit-fill-available',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '1rem',
      paddingTop: backButton ? '5rem' : '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {backButton && (
          <button
            onClick={() => setCurrentPage('home')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '2rem'
            }}
          >
            ← Retour
          </button>
        )}

        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{emoji} {title}</h1>
        
        <div style={{
          padding: '2rem',
          backgroundColor: '#1f2937',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
          <h2 style={{ marginBottom: '1rem' }}>{title} en cours de développement</h2>
          <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
            Cette fonctionnalité sera bientôt disponible dans la version Safari mobile.
          </p>
          <p style={{ color: '#9ca3af' }}>
            Utilisez la version desktop pour accéder aux fonctionnalités complètes.
          </p>
        </div>
      </div>
    </div>
  )

  // Loading
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        minHeight: '-webkit-fill-available',
        backgroundColor: '#0f0d15',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
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
          <p style={{ color: '#9ca3af' }}>Version Safari Mobile</p>
        </div>
      </div>
    )
  }

  // Navigation simple
  switch (currentPage) {
    case 'profil':
      return <SimplePage title="Mon Profil" emoji="👤" />
    case 'questionnaire':
      return <SimplePage title="Questionnaire" emoji="📝" />
    case 'miroir':
      return <SimplePage title="Mon Miroir" emoji="🪞" />
    case 'decouverte':
      return <SimplePage title="Découverte" emoji="🔍" />
    default:
      return <HomePage />
  }
}

// =============================================================================
// VERSION DESKTOP - Avec tes composants originaux complets
// =============================================================================

// Imports de tes composants originaux pour desktop
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

// Composant wrapper pour les routes privées
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f0d15',
        color: 'white'
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

// Placeholder pour les pages en construction
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

const DesktopApp = () => {
  const AppContent = () => {
    const { user } = useAuth()
    const [isDarkMode, setIsDarkMode] = useState(true)

    // Gestion du thème
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
        {/* Header complet */}
        {user && <Header isDarkMode={isDarkMode} onThemeToggle={handleThemeToggle} />}

        {/* Contenu principal */}
        <div className={user ? 'pt-16' : ''}>
          <Routes>
            {/* Routes publiques */}
            <Route path="/auth/callback" element={<div>AuthCallback</div>} />
            <Route path="/auth/confirm" element={<AuthConfirm />} />
            <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />

            {/* Routes privées avec OnboardingGuard */}
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

// =============================================================================
// APP PRINCIPAL
// =============================================================================

// CSS optimisé pour desktop
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

    /* Animations pour desktop */
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
  `

  try {
    document.head.appendChild(style)
  } catch (err) {
    console.log('Style injection fallback:', err)
  }
}

export default function App() {
  const [showSafariMessage, setShowSafariMessage] = useState(isSafariMobile)

  useEffect(() => {
    if (isSafariMobile) {
      const timer = setTimeout(() => setShowSafariMessage(false), 2000)
      return () => clearTimeout(timer)
    } else {
      // Initialiser les styles CSS pour desktop
      addOptimizedStyles()
    }
  }, [])

  // Message de transition Safari mobile
  if (showSafariMessage) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#065f46',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            📱
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0' }}>Safari Mobile Détecté</h2>
          <p style={{ color: '#d1fae5' }}>Chargement de la version optimisée...</p>
        </div>
      </div>
    )
  }

  // App selon la plateforme
  if (isSafariMobile) {
    return <SafariMobileApp />
  } else {
    return <DesktopApp />
  }
}