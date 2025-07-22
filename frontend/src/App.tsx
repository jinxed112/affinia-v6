// App.tsx - Version SIMPLE qui marche sur Safari mobile
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import AuthConfirm from './components/AuthConfirm'
import Login from './pages/Login'
import { HomePage } from './pages/HomePage'

// Détection Safari mobile
const isSafariMobile = (() => {
  const ua = navigator.userAgent.toLowerCase()
  return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
})()

console.log('🔍 Safari mobile détecté:', isSafariMobile)

// Loading fallback simple
const SimpleLoading: React.FC = () => (
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
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '60px',
        height: '60px',
        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
        borderRadius: '50%',
        margin: '0 auto 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        💜
      </div>
      <h2>Affinia</h2>
      <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Chargement...</p>
    </div>
  </div>
)

// Composant pour protéger les routes privées - VERSION SIMPLE
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <SimpleLoading />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

// Composant principal simplifié
function AppContent() {
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Gestion thème simplifiée
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark')
      }
    } catch (err) {
      setIsDarkMode(true)
    }
  }, [])

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Routes>
        {/* Routes publiques */}
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />

        {/* Routes privées */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage isDarkMode={isDarkMode} />
            </PrivateRoute>
          }
        />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
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

// CSS de base simplifié
const addSimpleStyles = () => {
  if (document.querySelector('#simple-styles')) return

  const style = document.createElement('style')
  style.id = 'simple-styles'
  style.textContent = `
    .dark { color-scheme: dark; }
    body { 
      background-color: #0f0d15; 
      color: white; 
      font-family: 'Inter', Arial, sans-serif;
    }
    
    /* Seulement animations de base sur desktop */
    ${!isSafariMobile ? `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .animate-pulse { animation: pulse 2s infinite; }
    ` : ''}
  `
  
  try {
    document.head.appendChild(style)
  } catch (err) {
    console.log('Style injection failed:', err)
  }
}

// Ajouter les styles au chargement
addSimpleStyles()