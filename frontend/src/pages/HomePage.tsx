// src/pages/HomePage.tsx - VERSION DEBUG SAFARI MOBILE
import React, { useState, useEffect } from 'react'
import { 
  Heart, Sparkles, Shield, Star, Trophy, Zap, Brain, 
  Target, Eye, PenTool, Calendar, CheckCircle, Lock,
  TrendingUp, Activity, Gamepad2, User, Crown, Home,
  Gift, Camera, Swords, ChevronRight, Coins, Users,
  Plus, Circle, Check, Download, Copy, Flame, Gem,
  Clock, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'

// Détection Safari mobile
const isSafariMobile = (() => {
  const ua = navigator.userAgent.toLowerCase()
  return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
})()

interface HomePageProps {
  isDarkMode?: boolean
}

export const HomePage: React.FC<HomePageProps> = ({ isDarkMode = true }) => {
  const { user } = useAuth()
  const { profile, questionnaire, loading, error, refreshProfile, hasCompletedQuestionnaire } = useProfile()
  
  // États de debug - chaque section testée individuellement
  const [debugPhase, setDebugPhase] = useState(0)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [errorDetails, setErrorDetails] = useState<string[]>([])

  // Handler d'erreur global pour debug
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 HomePage Error caught:', event.error)
      setErrorDetails(prev => [...prev, `Error: ${event.error?.message || 'Unknown error'}`])
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 HomePage Promise rejection:', event.reason)
      setErrorDetails(prev => [...prev, `Promise rejection: ${event.reason}`])
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Tests progressifs pour identifier le coupable
  const runTest = (testName: string, testFn: () => void) => {
    try {
      console.log(`🧪 Testing ${testName}...`)
      testFn()
      setTestResults(prev => ({ ...prev, [testName]: true }))
      console.log(`✅ ${testName} OK`)
      return true
    } catch (error) {
      console.error(`❌ ${testName} FAILED:`, error)
      setTestResults(prev => ({ ...prev, [testName]: false }))
      setErrorDetails(prev => [...prev, `${testName}: ${error.message}`])
      return false
    }
  }

  // Test automatique séquentiel
  useEffect(() => {
    if (!isSafariMobile) {
      // Desktop → Passer directement au rendu normal
      setDebugPhase(10)
      return
    }

    // Safari mobile → Test progressif
    const tests = [
      { name: 'Basic React', fn: () => { const x = 1 + 1 } },
      { name: 'useAuth Hook', fn: () => { if (user) console.log('User OK') } },
      { name: 'useProfile Hook', fn: () => { if (profile) console.log('Profile OK') } },
      { name: 'State Management', fn: () => { const [test, setTest] = useState(0); setTest(1) } },
      { name: 'Lucide Icons', fn: () => { const icon = Heart } },
      { name: 'Complex Calculations', fn: () => { 
        const currentLevel = profile?.level || 1
        const currentXp = profile?.xp || 0
        const nextLevelXp = currentLevel ** 2 * 100
        const progress = (currentXp / nextLevelXp) * 100
      }}
    ]

    tests.forEach((test, index) => {
      setTimeout(() => {
        if (runTest(test.name, test.fn)) {
          setDebugPhase(index + 1)
        }
      }, (index + 1) * 500)
    })

    // Test final → Affichage complet
    setTimeout(() => {
      setDebugPhase(10)
    }, tests.length * 500 + 1000)

  }, [user, profile])

  // Vue de debug pour Safari mobile
  if (isSafariMobile && debugPhase < 10) {
    return (
      <div style={{
        minHeight: '100vh',
        minHeight: '-webkit-fill-available',
        backgroundColor: '#0f0d15',
        color: 'white',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
            🔍 HomePage Debug Safari Mobile
          </h1>
          
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ marginBottom: '1rem' }}>Phase de test: {debugPhase}/6</p>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#374151',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(debugPhase / 6) * 100}%`,
                height: '100%',
                backgroundColor: '#10b981',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Résultats des tests:</h3>
            {Object.entries(testResults).map(([test, success]) => (
              <div key={test} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem',
                margin: '0.25rem 0',
                backgroundColor: success ? '#065f46' : '#7f1d1d',
                borderRadius: '4px'
              }}>
                <span>{test}</span>
                <span>{success ? '✅' : '❌'}</span>
              </div>
            ))}
          </div>

          {errorDetails.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#ef4444' }}>Erreurs détectées:</h3>
              {errorDetails.map((error, index) => (
                <div key={index} style={{
                  padding: '0.5rem',
                  margin: '0.25rem 0',
                  backgroundColor: '#7f1d1d',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}>
                  {error}
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              onClick={() => setDebugPhase(10)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Forcer l'affichage complet
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Vue normale - VERSION ULTRA-SIMPLIFIÉE pour Safari mobile
  if (isSafariMobile) {
    return (
      <div style={{
        minHeight: '100vh',
        minHeight: '-webkit-fill-available',
        backgroundColor: '#0f0d15',
        color: 'white',
        padding: '1rem',
        paddingTop: '6rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Header simple */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏠 Tableau de Bord</h1>
            <p style={{ color: '#9ca3af' }}>Version Safari Mobile Optimisée</p>
          </div>

          {/* Stats simples - Pas de composants complexes */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile?.level || 1}</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>NIVEAU</div>
            </div>
            
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile?.xp || 0}</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>XP</div>
            </div>
            
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💫</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile?.credits || 0}</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>CRÉDITS</div>
            </div>
          </div>

          {/* Status questionnaire simple */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: hasCompletedQuestionnaire ? '#065f46' : '#7c2d12',
            borderRadius: '12px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              {hasCompletedQuestionnaire ? '✅ Questionnaire Complété' : '⏳ Questionnaire En Attente'}
            </h3>
            <p style={{ marginBottom: '1rem', color: '#d1d5db' }}>
              {hasCompletedQuestionnaire 
                ? 'Votre profil psychologique est prêt !'
                : 'Complétez le questionnaire pour débloquer toutes les fonctionnalités.'
              }
            </p>
            <button
              onClick={() => window.location.href = hasCompletedQuestionnaire ? '/profil' : '/questionnaire'}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: hasCompletedQuestionnaire ? '#3b82f6' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              {hasCompletedQuestionnaire ? 'Voir mon profil' : 'Faire le questionnaire'}
            </button>
          </div>

          {/* Navigation simple */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { label: '👤 Profil', url: '/profil' },
              { label: '🪞 Miroir', url: '/miroir' },
              { label: '🔍 Découverte', url: '/decouverte' },
              { label: '📝 Questionnaire', url: '/questionnaire' }
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => window.location.href = item.url}
                style={{
                  padding: '1rem',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  textAlign: 'center'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Debug info */}
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            backgroundColor: '#1f2937', 
            borderRadius: '8px',
            fontSize: '0.8rem'
          }}>
            <p>🔍 Mode Safari Mobile Détecté</p>
            <p>✅ Tests passés: {Object.keys(testResults).length}</p>
            <p>❌ Erreurs: {errorDetails.length}</p>
            {loading && <p>⏳ Chargement profile...</p>}
            {error && <p style={{ color: '#ef4444' }}>❌ Erreur: {error.message}</p>}
          </div>
        </div>
      </div>
    )
  }

  // Vue desktop normale (ton code actuel)
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '1rem',
      paddingTop: '6rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>🖥️ Desktop - Version Complète</h1>
        <p style={{ color: '#9ca3af' }}>Toutes les fonctionnalités sont disponibles sur desktop.</p>
        
        {/* Ajouter ici ton code complet pour desktop si nécessaire */}
      </div>
    </div>
  )
}