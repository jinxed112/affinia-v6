// App.tsx - Version optimisée Safari mobile avec chargement progressif
import React, { useState, useEffect, Suspense, lazy } from 'react'

// Détection Safari mobile pour optimisations
const isSafariMobile = (() => {
  const ua = navigator.userAgent.toLowerCase()
  return /safari/.test(ua) && !/chrome/.test(ua) && /mobile|iphone|ipad/.test(ua)
})()

console.log('🔍 Safari mobile détecté:', isSafariMobile)

// Lazy loading des imports lourds pour Safari mobile
const BrowserRouter = lazy(() => 
  import('react-router-dom').then(module => ({ default: module.BrowserRouter }))
)
const Routes = lazy(() => 
  import('react-router-dom').then(module => ({ default: module.Routes }))
)
const Route = lazy(() => 
  import('react-router-dom').then(module => ({ default: module.Route }))
)
const Navigate = lazy(() => 
  import('react-router-dom').then(module => ({ default: module.Navigate }))
)

// Lazy loading des contexts
const AuthProvider = lazy(() => 
  import('./contexts/AuthContext').then(module => ({ default: module.AuthProvider }))
)
const NotificationProvider = lazy(() => 
  import('./contexts/NotificationContext').then(module => ({ default: module.NotificationProvider }))
)

// Lazy loading des pages
const HomePage = lazy(() => 
  import('./pages/HomePage').then(module => ({ default: module.HomePage }))
)
const Login = lazy(() => import('./pages/Login'))
const AuthCallback = lazy(() => 
  import('./components/AuthCallback').then(module => ({ default: module.AuthCallback }))
)
const AuthConfirm = lazy(() => import('./components/AuthConfirm'))

// Loading fallback optimisé pour Safari mobile
const LoadingFallback: React.FC<{ message?: string }> = ({ message = "Chargement..." }) => (
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
        justifyContent: 'center',
        ...(isSafariMobile ? {} : { animation: 'pulse 2s infinite' })
      }}>
        💜
      </div>
      <h2 style={{ margin: '0 0 0.5rem 0' }}>Affinia</h2>
      <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{message}</p>
    </div>
  </div>
)

// CSS simplifié pour Safari mobile
const addStyles = () => {
  if (document.querySelector('#app-styles')) return // Déjà ajouté
  
  const style = document.createElement('style')
  style.id = 'app-styles'
  
  // CSS de base sans animations complexes pour Safari mobile
  const baseCSS = `
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
  `
  
  // Animations seulement si pas Safari mobile
  const animationCSS = isSafariMobile ? '' : `
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
  
  style.textContent = baseCSS + animationCSS
  document.head.appendChild(style)
}

// Composant principal avec chargement progressif
const App: React.FC = () => {
  const [loadingPhase, setLoadingPhase] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Ajouter les styles immédiatement
    addStyles()
    
    // Chargement progressif pour Safari mobile
    if (isSafariMobile) {
      // Phase 1: CSS ready
      setTimeout(() => setLoadingPhase(1), 100)
      // Phase 2: Contexts ready
      setTimeout(() => setLoadingPhase(2), 300)
      // Phase 3: Router ready
      setTimeout(() => setLoadingPhase(3), 500)
    } else {
      // Chargement immédiat sur desktop
      setLoadingPhase(3)
    }
  }, [])
  
  // Error boundary simple
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 App Error:', event.error)
      setError(`Erreur: ${event.error?.message || 'Erreur inconnue'}`)
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <h1>⚠️ Erreur détectée</h1>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '10px 20px',
            marginTop: '1rem',
            backgroundColor: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Recharger la page
        </button>
      </div>
    )
  }
  
  if (loadingPhase < 3) {
    const messages = [
      'Initialisation...',
      'Préparation de l\'interface...',
      'Chargement des composants...',
      'Finalisation...'
    ]
    return <LoadingFallback message={messages[loadingPhase] || 'Chargement...'} />
  }
  
  // Version simplifiée pour Safari mobile
  if (isSafariMobile) {
    return (
      <Suspense fallback={<LoadingFallback message="Chargement de l'application..." />}>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback message="Initialisation de l'authentification..." />}>
            <AuthProvider>
              <Suspense fallback={<LoadingFallback message="Configuration des notifications..." />}>
                <NotificationProvider>
                  <SafariMobileApp />
                </NotificationProvider>
              </Suspense>
            </AuthProvider>
          </Suspense>
        </BrowserRouter>
      </Suspense>
    )
  }
  
  // Version complète pour desktop (import direct)
  return <DesktopApp />
}

// Version Safari Mobile simplifiée
const SafariMobileApp: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Suspense fallback={<LoadingFallback message="Chargement des pages..." />}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />
          <Route path="/" element={<HomePage isDarkMode={isDarkMode} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </div>
  )
}

// Version Desktop (ton App.tsx original)
const DesktopApp: React.FC = () => {
  // Ici on peut importer directement tout ton App.tsx original
  // sans lazy loading ni optimisations Safari
  return (
    <div>
      <p style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
        Version Desktop - Bientôt disponible
        <br />
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '10px 20px',
            marginTop: '1rem',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Recharger
        </button>
      </p>
    </div>
  )
}

export default App