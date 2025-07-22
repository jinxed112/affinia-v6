// App.tsx - Version Safari Mobile dédiée + Desktop normal
import React, { useState, useEffect } from 'react'

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
// VERSION SAFARI MOBILE - Simple, sans routing, sans hooks complexes
// =============================================================================

const SafariMobileApp = () => {
  const [currentPage, setCurrentPage] = useState('home')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Simulation auth simple pour Safari mobile
  useEffect(() => {
    // Simuler un check auth simple
    setTimeout(() => {
      // Pour le moment, on simule un utilisateur connecté
      setUser({ email: 'user@example.com', id: '123' })
      setLoading(false)
    }, 1000)
  }, [])

  // Pages simples pour Safari mobile
  const HomePage = () => (
    <div style={{
      minHeight: '100vh',
      minHeight: '-webkit-fill-available',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header simple */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(15, 13, 21, 0.95)',
        padding: '1rem',
        borderBottom: '1px solid #374151',
        zIndex: 50
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

      {/* Contenu */}
      <div style={{ paddingTop: '5rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏠 Tableau de Bord</h2>
          <p style={{ color: '#9ca3af' }}>Version Safari Mobile Optimisée</p>
        </div>

        {/* Stats simples */}
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

        {/* Info Safari mobile */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#065f46',
          borderRadius: '8px',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          <p>✅ Version Safari Mobile Optimisée</p>
          <p style={{ fontSize: '0.8rem', color: '#d1fae5', marginTop: '0.5rem' }}>
            Interface simplifiée pour des performances maximales sur Safari mobile.
          </p>
        </div>
      </div>
    </div>
  )

  const ProfilPage = () => (
    <div style={{
      minHeight: '100vh',
      minHeight: '-webkit-fill-available',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '1rem',
      paddingTop: '5rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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

        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>👤 Mon Profil</h1>
        
        <div style={{
          padding: '2rem',
          backgroundColor: '#1f2937',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#374151',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            👤
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Profil Utilisateur</h2>
          <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>{user?.email}</p>
          <p style={{ color: '#9ca3af' }}>Version Safari mobile simplifiée</p>
        </div>
      </div>
    </div>
  )

  const QuestionnairePage = () => (
    <div style={{
      minHeight: '100vh',
      minHeight: '-webkit-fill-available',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '1rem',
      paddingTop: '5rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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

        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>📝 Questionnaire</h1>
        
        <div style={{
          padding: '2rem',
          backgroundColor: '#1f2937',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
          <h2 style={{ marginBottom: '1rem' }}>Questionnaire en cours de développement</h2>
          <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
            Le questionnaire psychologique sera bientôt disponible dans la version Safari mobile.
          </p>
          <p style={{ color: '#9ca3af' }}>
            En attendant, utilisez la version desktop pour compléter votre profil.
          </p>
        </div>
      </div>
    </div>
  )

  const OtherPage = ({ title, emoji }) => (
    <div style={{
      minHeight: '100vh',
      minHeight: '-webkit-fill-available',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '1rem',
      paddingTop: '5rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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
        </div>
      </div>
    </div>
  )

  // Loading pour Safari mobile
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

  // Router simple pour Safari mobile
  switch (currentPage) {
    case 'profil':
      return <ProfilPage />
    case 'questionnaire':
      return <QuestionnairePage />
    case 'miroir':
      return <OtherPage title="Mon Miroir" emoji="🪞" />
    case 'decouverte':
      return <OtherPage title="Découverte" emoji="🔍" />
    default:
      return <HomePage />
  }
}

// =============================================================================
// VERSION DESKTOP - Avec tous les composants complexes
// =============================================================================

const DesktopApp = () => {
  try {
    const { BrowserRouter: Router, Routes, Route, Navigate } = require('react-router-dom')
    const { AuthProvider, useAuth } = require('./contexts/AuthContext')
    const { NotificationProvider } = require('./contexts/NotificationContext')
    const { Header } = require('./components/Header')
    const { OnboardingGuard } = require('./components/OnboardingGuard')
    const AuthConfirm = require('./components/AuthConfirm').default
    const Login = require('./pages/Login').default
    const { HomePage } = require('./pages/HomePage')
    const { ProfilePage } = require('./pages/ProfilePage')
    const { MiroirPage } = require('./pages/MiroirPage')
    const { DiscoveryPage } = require('./pages/DiscoveryPage')
    const { MirrorRequestsPage } = require('./pages/MirrorRequestsPage')
    const QuestionnairePage = require('./pages/QuestionnairePage').default
    const { AdminPage } = require('./pages/AdminPage')

    const PrivateRoute = ({ children }) => {
      const { user, loading } = useAuth()
      if (loading) return <div>Loading...</div>
      if (!user) return <Navigate to="/login" />
      return <>{children}</>
    }

    const AppContent = () => {
      const { user } = useAuth()
      const [isDarkMode, setIsDarkMode] = React.useState(true)

      return (
        <div className={isDarkMode ? 'dark' : ''}>
          {user && <Header isDarkMode={isDarkMode} onThemeToggle={() => setIsDarkMode(!isDarkMode)} />}
          <div className={user ? 'pt-16' : ''}>
            <Routes>
              <Route path="/auth/callback" element={<div>AuthCallback</div>} />
              <Route path="/auth/confirm" element={<AuthConfirm />} />
              <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />
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
              <Route path="/questionnaire" element={
                <PrivateRoute>
                  <QuestionnairePage isDarkMode={isDarkMode} />
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
  } catch (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1>⚠️ Erreur Desktop</h1>
        <p>Impossible de charger la version complète.</p>
        <p>Erreur: {error.message}</p>
      </div>
    )
  }
}

// =============================================================================
// APP PRINCIPAL - Détection automatique Safari mobile vs Desktop
// =============================================================================

export default function App() {
  const [showSafariMessage, setShowSafariMessage] = React.useState(isSafariMobile)

  React.useEffect(() => {
    if (isSafariMobile) {
      const timer = setTimeout(() => setShowSafariMessage(false), 2000)
      return () => clearTimeout(timer)
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

  // Router selon la plateforme
  if (isSafariMobile) {
    return <SafariMobileApp />
  } else {
    return <DesktopApp />
  }
}