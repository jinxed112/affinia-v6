// App.tsx - Réintroduction progressive des suspects
import React, { useState, useEffect } from 'react'

// HomePage simple qui fonctionne
const SimpleHomePage = ({ testName, bgColor }) => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: bgColor,
    color: 'white',
    padding: '1rem',
    fontFamily: 'Arial, sans-serif'
  }}>
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '2rem' }}>
      <h1 style={{ 
        fontSize: '2rem', 
        marginBottom: '2rem',
        border: '2px solid white',
        padding: '1rem'
      }}>
        🧪 TEST: {testName}
      </h1>
      
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2>✅ {testName} FONCTIONNE</h2>
        <p>Ce composant/hook ne pose pas de problème sur Safari mobile.</p>
      </div>

      <button 
        onClick={() => alert(`✅ ${testName} OK sur Safari mobile !`)}
        style={{
          padding: '1rem 2rem',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        Confirmer que {testName} marche
      </button>

      <div style={{ marginTop: '2rem', fontSize: '0.8rem' }}>
        <p>Couleur: {bgColor}</p>
        <p>Test: {testName}</p>
        <p>Temps: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  </div>
)

// Détection Safari mobile
const isSafariMobile = (() => {
  try {
    const ua = navigator.userAgent.toLowerCase()
    return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
  } catch (e) {
    return true
  }
})()

export default function App() {
  const [testPhase, setTestPhase] = useState(0)
  const [testResults, setTestResults] = useState([])

  // Tests séquentiels automatiques
  useEffect(() => {
    if (!isSafariMobile) {
      // Desktop → Passer au test final
      setTestPhase(10)
      return
    }

    // Safari mobile → Tests progressifs avec délai
    const tests = [
      { name: 'HomePage Direct', delay: 2000, phase: 1 },
      { name: 'React Router', delay: 4000, phase: 2 },
      { name: 'AuthProvider', delay: 6000, phase: 3 },
      { name: 'NotificationProvider', delay: 8000, phase: 4 },
      { name: 'useAuth Hook', delay: 10000, phase: 5 },
      { name: 'useProfile Hook', delay: 12000, phase: 6 },
      { name: 'PrivateRoute', delay: 14000, phase: 7 },
      { name: 'OnboardingGuard', delay: 16000, phase: 8 }
    ]

    tests.forEach(({ name, delay, phase }) => {
      setTimeout(() => {
        setTestPhase(phase)
        setTestResults(prev => [...prev, { name, phase, success: true }])
      }, delay)
    })
  }, [])

  // Phase 0: Loading initial
  if (testPhase === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f0d15',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>🧪 Préparation des tests séquentiels...</h2>
          <p>Safari mobile détecté - Mode debug</p>
        </div>
      </div>
    )
  }

  // Phase 1: HomePage Direct (déjà testé - fonctionne)
  if (testPhase === 1) {
    return <SimpleHomePage testName="HomePage Direct" bgColor="#ff6b6b" />
  }

  // Phase 2: Test React Router
  if (testPhase === 2) {
    try {
      const { BrowserRouter: Router, Routes, Route } = require('react-router-dom')
      
      return (
        <Router>
          <Routes>
            <Route path="*" element={
              <SimpleHomePage testName="React Router" bgColor="#3b82f6" />
            } />
          </Routes>
        </Router>
      )
    } catch (error) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ef4444', color: 'white', padding: '2rem' }}>
          <h1>❌ React Router ÉCHOUÉ</h1>
          <p>Erreur: {error.message}</p>
        </div>
      )
    }
  }

  // Phase 3: Test AuthProvider
  if (testPhase === 3) {
    try {
      const { BrowserRouter: Router, Routes, Route } = require('react-router-dom')
      const { AuthProvider } = require('./contexts/AuthContext')
      
      return (
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="*" element={
                <SimpleHomePage testName="AuthProvider" bgColor="#10b981" />
              } />
            </Routes>
          </AuthProvider>
        </Router>
      )
    } catch (error) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ef4444', color: 'white', padding: '2rem' }}>
          <h1>❌ AuthProvider ÉCHOUÉ</h1>
          <p>Erreur: {error.message}</p>
          <p>C'EST LE COUPABLE ! 🎯</p>
        </div>
      )
    }
  }

  // Phase 4: Test NotificationProvider
  if (testPhase === 4) {
    try {
      const { BrowserRouter: Router, Routes, Route } = require('react-router-dom')
      const { AuthProvider } = require('./contexts/AuthContext')
      const { NotificationProvider } = require('./contexts/NotificationContext')
      
      return (
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="*" element={
                  <SimpleHomePage testName="NotificationProvider" bgColor="#8b5cf6" />
                } />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      )
    } catch (error) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ef4444', color: 'white', padding: '2rem' }}>
          <h1>❌ NotificationProvider ÉCHOUÉ</h1>
          <p>Erreur: {error.message}</p>
          <p>C'EST LE COUPABLE ! 🎯</p>
        </div>
      )
    }
  }

  // Phase 5: Test useAuth Hook
  if (testPhase === 5) {
    try {
      const { BrowserRouter: Router, Routes, Route } = require('react-router-dom')
      const { AuthProvider, useAuth } = require('./contexts/AuthContext')
      const { NotificationProvider } = require('./contexts/NotificationContext')
      
      const TestUseAuth = () => {
        const { user, loading } = useAuth()
        return <SimpleHomePage testName="useAuth Hook" bgColor="#f59e0b" />
      }
      
      return (
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="*" element={<TestUseAuth />} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      )
    } catch (error) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ef4444', color: 'white', padding: '2rem' }}>
          <h1>❌ useAuth Hook ÉCHOUÉ</h1>
          <p>Erreur: {error.message}</p>
          <p>C'EST LE COUPABLE ! 🎯</p>
        </div>
      )
    }
  }

  // Phase 6: Test useProfile Hook
  if (testPhase === 6) {
    try {
      const { BrowserRouter: Router, Routes, Route } = require('react-router-dom')
      const { AuthProvider, useAuth } = require('./contexts/AuthContext')
      const { NotificationProvider } = require('./contexts/NotificationContext')
      const { useProfile } = require('./hooks/useProfile')
      
      const TestUseProfile = () => {
        const { user } = useAuth()
        const { profile, loading } = useProfile()
        return <SimpleHomePage testName="useProfile Hook" bgColor="#ec4899" />
      }
      
      return (
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="*" element={<TestUseProfile />} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      )
    } catch (error) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ef4444', color: 'white', padding: '2rem' }}>
          <h1>❌ useProfile Hook ÉCHOUÉ</h1>
          <p>Erreur: {error.message}</p>
          <p>C'EST LE COUPABLE ! 🎯</p>
        </div>
      )
    }
  }

  // Phase 7: Test PrivateRoute
  if (testPhase === 7) {
    try {
      const { BrowserRouter: Router, Routes, Route, Navigate } = require('react-router-dom')
      const { AuthProvider, useAuth } = require('./contexts/AuthContext')
      const { NotificationProvider } = require('./contexts/NotificationContext')
      
      const PrivateRoute = ({ children }) => {
        const { user, loading } = useAuth()
        if (loading) return <div>Loading...</div>
        return children // Simplifié pour test
      }
      
      return (
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="*" element={
                  <PrivateRoute>
                    <SimpleHomePage testName="PrivateRoute" bgColor="#06b6d4" />
                  </PrivateRoute>
                } />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      )
    } catch (error) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ef4444', color: 'white', padding: '2rem' }}>
          <h1>❌ PrivateRoute ÉCHOUÉ</h1>
          <p>Erreur: {error.message}</p>
          <p>C'EST LE COUPABLE ! 🎯</p>
        </div>
      )
    }
  }

  // Phase 8: Test OnboardingGuard
  if (testPhase === 8) {
    try {
      const { BrowserRouter: Router, Routes, Route } = require('react-router-dom')
      const { AuthProvider, useAuth } = require('./contexts/AuthContext')
      const { NotificationProvider } = require('./contexts/NotificationContext')
      const { OnboardingGuard } = require('./components/OnboardingGuard')
      
      const PrivateRoute = ({ children }) => {
        const { user, loading } = useAuth()
        if (loading) return <div>Loading...</div>
        return children
      }
      
      return (
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="*" element={
                  <PrivateRoute>
                    <OnboardingGuard isDarkMode={true}>
                      <SimpleHomePage testName="OnboardingGuard" bgColor="#84cc16" />
                    </OnboardingGuard>
                  </PrivateRoute>
                } />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      )
    } catch (error) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#ef4444', color: 'white', padding: '2rem' }}>
          <h1>❌ OnboardingGuard ÉCHOUÉ</h1>
          <p>Erreur: {error.message}</p>
          <p>C'EST LE COUPABLE ! 🎯</p>
        </div>
      )
    }
  }

  // Desktop ou test final
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#374151',
      color: 'white',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>🖥️ Desktop Mode</h1>
        <p>Tous les tests sont bypassed sur desktop.</p>
        
        {testResults.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Résultats Safari mobile:</h3>
            {testResults.map((result, index) => (
              <p key={index}>✅ {result.name}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}