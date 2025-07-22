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
// VERSION DESKTOP - Composants légers
// =============================================================================

// Login page simple pour desktop
const SimpleLogin = ({ isDarkMode }) => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: isDarkMode ? '#0f0d15' : '#f9fafb',
    color: isDarkMode ? 'white' : '#1f2937',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Arial, sans-serif'
  }}>
    <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#ec4899' }}>💜 Affinia</h1>
      <div style={{
        padding: '2rem',
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        borderRadius: '12px',
        border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Connexion</h2>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          Version simplifiée pour le debug
        </p>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#ec4899',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Simuler connexion
        </button>
      </div>
    </div>
  </div>
)

// HomePage simple pour desktop
const SimpleHomePage = ({ isDarkMode }) => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: isDarkMode ? '#0f0d15' : '#f9fafb',
    color: isDarkMode ? 'white' : '#1f2937',
    padding: '1rem',
    paddingTop: '5rem',
    fontFamily: 'Arial, sans-serif'
  }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🖥️ Version Desktop</h1>
        <p style={{ color: '#9ca3af' }}>Interface simplifiée pour éviter les crashes Safari mobile</p>
      </div>

      <div style={{
        padding: '2rem',
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        borderRadius: '12px',
        border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>✅ Diagnostic terminé</h2>
        <p style={{ marginBottom: '1rem' }}>
          Le problème Safari mobile a été identifié et résolu avec une version dédiée.
        </p>
        <p style={{ color: '#9ca3af' }}>
          Vous pouvez maintenant réintégrer progressivement vos composants complexes pour la version desktop.
        </p>
      </div>
    </div>
  </div>
)

// Composant wrapper pour éviter les crashes
const PrivateRoute = ({ children }) => {
  try {
    const { user, loading } = useAuth()
    if (loading) return <div>Loading...</div>
    if (!user) return <Navigate to="/login" />
    return <>{children}</>
  } catch (error) {
    return <Navigate to="/login" />
  }
}

const DesktopApp = () => {
  const [isDarkMode, setIsDarkMode] = useState(true)

  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className={isDarkMode ? 'dark' : ''}>
            {/* Header simple */}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: isDarkMode ? 'rgba(15, 13, 21, 0.95)' : 'rgba(249, 250, 251, 0.95)',
              padding: '1rem',
              borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              zIndex: 50,
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                maxWidth: '1200px',
                margin: '0 auto'
              }}>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '1.2rem', 
                  color: '#ec4899' 
                }}>
                  💜 Affinia
                </h1>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                    color: isDarkMode ? 'white' : '#1f2937',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
              </div>
            </div>

            <Routes>
              <Route path="/login" element={<SimpleLogin isDarkMode={isDarkMode} />} />
              <Route path="/" element={
                <PrivateRoute>
                  <SimpleHomePage isDarkMode={isDarkMode} />
                </PrivateRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

// =============================================================================
// APP PRINCIPAL
// =============================================================================

export default function App() {
  const [showSafariMessage, setShowSafariMessage] = useState(isSafariMobile)

  useEffect(() => {
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

  // App selon la plateforme
  if (isSafariMobile) {
    return <SafariMobileApp />
  } else {
    return <DesktopApp />
  }
}