// App.tsx - Debug Safari mobile avec imports ES6 standards
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

// Détection Safari mobile
const isSafariMobile = (() => {
  try {
    const ua = navigator.userAgent.toLowerCase()
    return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
  } catch (e) {
    return true
  }
})()

// Debug Safari mobile - étapes progressives
const SafariDebugger = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState(['🔍 Début debug Safari mobile...'])

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const steps = [
      {
        name: 'Test 1: React basique',
        test: () => {
          addLog('✅ React useState/useEffect - OK')
          return true
        }
      },
      {
        name: 'Test 2: Router basique',
        test: () => {
          addLog('✅ React Router imports - OK')
          return true
        }
      },
      {
        name: 'Test 3: AuthContext',
        test: () => {
          addLog('✅ AuthContext import - OK')
          return true
        }
      },
      {
        name: 'Test 4: HomePage import',
        test: () => {
          addLog('✅ HomePage import - OK')
          return true
        }
      },
      {
        name: 'Test 5: Tous les imports',
        test: () => {
          addLog('✅ Tous les imports - OK')
          return true
        }
      }
    ]

    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        try {
          const step = steps[currentStep]
          addLog(`🧪 Test: ${step.name}`)
          step.test()
          setCurrentStep(currentStep + 1)
        } catch (err) {
          addLog(`❌ ERREUR: ${err.message}`)
          setError(err)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [currentStep])

  // Si erreur
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '1rem',
        fontFamily: 'monospace'
      }}>
        <h1>🚨 CRASH DÉTECTÉ À L'ÉTAPE {currentStep + 1}</h1>
        <p>Erreur: {error.message}</p>
        <div style={{ marginTop: '2rem', fontSize: '0.8rem' }}>
          <h3>Logs:</h3>
          {logs.map((log, index) => (
            <div key={index} style={{ padding: '0.25rem 0' }}>{log}</div>
          ))}
        </div>
      </div>
    )
  }

  // Tests terminés sans erreur → Essayer le rendu progressif
  if (currentStep >= 5) {
    return <ProgressiveRender />
  }

  // Interface de debug
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          🔍 Debug Safari Mobile
        </h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#374151',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(currentStep / 5) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #059669)',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            Étape {currentStep}/5
          </p>
        </div>

        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          padding: '1rem',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{
              padding: '0.25rem 0',
              fontSize: '0.9rem',
              fontFamily: 'monospace'
            }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Rendu progressif des composants
const ProgressiveRender = () => {
  const [renderStep, setRenderStep] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderStep(renderStep + 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [renderStep])

  try {
    // Étape 0: Juste un div
    if (renderStep === 0) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#8b5cf6',
          color: 'white',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1>🟣 Étape 0: Div basique - OK</h1>
          <p>Prochaine étape dans 1 seconde...</p>
        </div>
      )
    }

    // Étape 1: Router seul
    if (renderStep === 1) {
      return (
        <Router>
          <div style={{
            minHeight: '100vh',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h1>🔵 Étape 1: Router - OK</h1>
            <p>Prochaine étape dans 1 seconde...</p>
          </div>
        </Router>
      )
    }

    // Étape 2: Router + AuthProvider
    if (renderStep === 2) {
      return (
        <Router>
          <AuthProvider>
            <div style={{
              minHeight: '100vh',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h1>🟢 Étape 2: Router + AuthProvider - OK</h1>
              <p>Prochaine étape dans 1 seconde...</p>
            </div>
          </AuthProvider>
        </Router>
      )
    }

    // Étape 3: + NotificationProvider
    if (renderStep === 3) {
      return (
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <div style={{
                minHeight: '100vh',
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <h1>🟡 Étape 3: + NotificationProvider - OK</h1>
                <p>Prochaine étape dans 1 seconde...</p>
              </div>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      )
    }

    // Étape 4: + useAuth hook
    if (renderStep === 4) {
      const TestUseAuth = () => {
        const { user, loading } = useAuth()
        return (
          <div style={{
            minHeight: '100vh',
            backgroundColor: '#ec4899',
            color: 'white',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h1>🩷 Étape 4: + useAuth hook - OK</h1>
            <p>Loading: {loading ? 'true' : 'false'}</p>
            <p>User: {user ? 'connecté' : 'non connecté'}</p>
            <p>Prochaine étape dans 1 seconde...</p>
          </div>
        )
      }

      return (
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <TestUseAuth />
            </NotificationProvider>
          </AuthProvider>
        </Router>
      )
    }

    // Étape 5: + Routes
    if (renderStep === 5) {
      return (
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="*" element={
                  <div style={{
                    minHeight: '100vh',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '2rem',
                    textAlign: 'center'
                  }}>
                    <h1>🔴 Étape 5: + Routes - OK</h1>
                    <p>Prochaine étape: HomePage complète dans 1 seconde...</p>
                  </div>
                } />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      )
    }

    // Étape finale: HomePage complète
    const PrivateRoute = ({ children }) => {
      const { user, loading } = useAuth()
      if (loading) return <div>Loading...</div>
      return children // Pas de redirect pour le test
    }

    return (
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <div className="dark">
              <Header isDarkMode={true} onThemeToggle={() => {}} />
              <div className="pt-16">
                <Routes>
                  <Route path="/login" element={<Login isDarkMode={true} />} />
                  <Route path="/" element={
                    <PrivateRoute>
                      <OnboardingGuard isDarkMode={true}>
                        <HomePage isDarkMode={true} />
                      </OnboardingGuard>
                    </PrivateRoute>
                  } />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </div>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    )

  } catch (err) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#7f1d1d',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1>💥 CRASH À L'ÉTAPE {renderStep}</h1>
        <p>Erreur: {err.message}</p>
        <p>Stack: {err.stack}</p>
      </div>
    )
  }
}

// App principal
export default function App() {
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Loader
  if (showLoader) {
    return (
      <div style={{
        minHeight: '100vh',
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
          <p style={{ color: '#9ca3af' }}>
            {isSafariMobile ? 'Debug Safari Mobile...' : 'Chargement...'}
          </p>
        </div>
      </div>
    )
  }

  // Après le loader
  if (isSafariMobile) {
    return <SafariDebugger />
  } else {
    // Desktop: version normale simplifiée
    return (
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <div className="dark">
              <Header isDarkMode={true} onThemeToggle={() => {}} />
              <div className="pt-16">
                <Routes>
                  <Route path="/" element={<HomePage isDarkMode={true} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </div>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    )
  }
}