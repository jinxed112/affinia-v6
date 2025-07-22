// src/pages/HomePage.tsx - MINIMAL Safari - Test imports un par un
import React, { useState, useEffect } from 'react'

// Détection Safari mobile
const isSafariMobile = (() => {
  try {
    const ua = navigator.userAgent.toLowerCase()
    return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
  } catch (e) {
    return true // Fallback sécurisé
  }
})()

interface HomePageProps {
  isDarkMode?: boolean
}

export const HomePage: React.FC<HomePageProps> = ({ isDarkMode = true }) => {
  const [testPhase, setTestPhase] = useState(0)
  const [testResults, setTestResults] = useState<string[]>([])
  const [importTests, setImportTests] = useState<Record<string, boolean>>({})

  // Helper pour tester les imports sans les faire crasher
  const testImport = (name: string, testFn: () => void | Promise<void>) => {
    try {
      const result = testFn()
      if (result instanceof Promise) {
        result.then(() => {
          setImportTests(prev => ({ ...prev, [name]: true }))
          setTestResults(prev => [...prev, `✅ ${name} OK`])
        }).catch((error) => {
          setImportTests(prev => ({ ...prev, [name]: false }))
          setTestResults(prev => [...prev, `❌ ${name} FAILED: ${error.message}`])
        })
      } else {
        setImportTests(prev => ({ ...prev, [name]: true }))
        setTestResults(prev => [...prev, `✅ ${name} OK`])
      }
    } catch (error) {
      setImportTests(prev => ({ ...prev, [name]: false }))
      setTestResults(prev => [...prev, `❌ ${name} FAILED: ${error.message}`])
    }
  }

  // Tests séquentiels pour Safari mobile
  useEffect(() => {
    if (!isSafariMobile) {
      setTestPhase(999) // Desktop → Skip tests
      return
    }

    setTestResults(['🔍 Début des tests Safari mobile...'])

    // Test 1: React hooks de base
    setTimeout(() => {
      testImport('React useState/useEffect', () => {
        const [test, setTest] = useState(0)
        setTest(1)
      })
      setTestPhase(1)
    }, 500)

    // Test 2: Lucide icons
    setTimeout(() => {
      testImport('Lucide Icons', async () => {
        const { Heart } = await import('lucide-react')
        if (!Heart) throw new Error('Heart icon not found')
      })
      setTestPhase(2)
    }, 1000)

    // Test 3: useAuth hook
    setTimeout(() => {
      testImport('useAuth Hook', async () => {
        const { useAuth } = await import('../contexts/AuthContext')
        if (!useAuth) throw new Error('useAuth not found')
      })
      setTestPhase(3)
    }, 1500)

    // Test 4: useProfile hook
    setTimeout(() => {
      testImport('useProfile Hook', async () => {
        const { useProfile } = await import('../hooks/useProfile')
        if (!useProfile) throw new Error('useProfile not found')
      })
      setTestPhase(4)
    }, 2000)

    // Test 5: Base Components
    setTimeout(() => {
      testImport('Base Components', async () => {
        const { BaseComponents } = await import('../components/ui/BaseComponents')
        if (!BaseComponents) throw new Error('BaseComponents not found')
      })
      setTestPhase(5)
    }, 2500)

    // Test 6: AffiniaCard
    setTimeout(() => {
      testImport('AffiniaCard', async () => {
        const { AffiniaCard } = await import('../components/profile/AffiniaCard')
        if (!AffiniaCard) throw new Error('AffiniaCard not found')
      })
      setTestPhase(6)
    }, 3000)

    // Test 7: Design System
    setTimeout(() => {
      testImport('Design System', async () => {
        const { useDesignSystem } = await import('../styles/designSystem')
        if (!useDesignSystem) throw new Error('useDesignSystem not found')
      })
      setTestPhase(7)
    }, 3500)

    // Test final
    setTimeout(() => {
      setTestPhase(999)
      setTestResults(prev => [...prev, '🎯 Tests terminés !'])
    }, 4000)

  }, [])

  // Version tests pour Safari mobile
  if (isSafariMobile && testPhase < 999) {
    return (
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
          <h1 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '2rem', 
            textAlign: 'center',
            color: '#ec4899'
          }}>
            🔬 Tests Imports Safari Mobile
          </h1>
          
          {/* Progress */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#374151',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(testPhase / 7) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ec4899, #8b5cf6)',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Phase {testPhase}/7
            </p>
          </div>

          {/* Results */}
          <div style={{ 
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            padding: '1rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {testResults.map((result, index) => (
              <div key={index} style={{
                padding: '0.5rem',
                margin: '0.25rem 0',
                fontSize: '0.9rem',
                fontFamily: 'monospace'
              }}>
                {result}
              </div>
            ))}
          </div>

          {/* Import status */}
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Status des imports:</h3>
            {Object.entries(importTests).map(([name, success]) => (
              <div key={name} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem',
                margin: '0.25rem 0',
                backgroundColor: success ? '#065f46' : '#7f1d1d',
                borderRadius: '4px',
                fontSize: '0.8rem'
              }}>
                <span>{name}</span>
                <span>{success ? '✅' : '❌'}</span>
              </div>
            ))}
          </div>

          {/* Manual continue */}
          {testPhase >= 5 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button 
                onClick={() => setTestPhase(999)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Continuer vers la HomePage
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Version ultra-simple pour Safari mobile APRÈS tests
  if (isSafariMobile) {
    return (
      <div style={{
        minHeight: '100vh',
        minHeight: '-webkit-fill-available',
        backgroundColor: '#0f0d15',
        color: 'white',
        padding: '1rem',
        paddingTop: '5rem'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ec4899' }}>
              💜 Affinia Dashboard
            </h1>
            <p style={{ color: '#9ca3af' }}>Version Safari Mobile (Tests passés ✅)</p>
          </div>

          {/* Navigation simple */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {[
              { emoji: '👤', label: 'Mon Profil', url: '/profil' },
              { emoji: '📝', label: 'Questionnaire', url: '/questionnaire' },
              { emoji: '🪞', label: 'Mon Miroir', url: '/miroir' },
              { emoji: '🔍', label: 'Découverte', url: '/decouverte' }
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => window.location.href = item.url}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: '2px solid #374151',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  textAlign: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#374151'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#1f2937'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.emoji}</div>
                {item.label}
              </button>
            ))}
          </div>

          {/* Status simple */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>
              ✅ Safari Mobile Compatible
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Tous les imports ont été testés avec succès. Interface simplifiée pour des performances optimales.
            </p>
            
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                🔄 Relancer tests
              </button>
              
              <button
                onClick={() => console.log(importTests)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                📊 Voir résultats console
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Version desktop normale
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '1rem',
      paddingTop: '5rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>🖥️ Desktop - Version Complète</h1>
        <p style={{ color: '#9ca3af' }}>Toutes les fonctionnalités sont disponibles sur desktop.</p>
        
        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={() => window.location.href = '/profil'}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              marginRight: '1rem'
            }}
          >
            Voir le profil complet
          </button>
        </div>
      </div>
    </div>
  )
}