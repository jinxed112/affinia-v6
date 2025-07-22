// src/pages/HomePage-Debug.tsx
import React, { useState, useEffect } from 'react'
import { Heart, Trophy, Star, User, AlertTriangle } from 'lucide-react'

interface HomePageProps {
  isDarkMode?: boolean
}

export const HomePage: React.FC<HomePageProps> = ({ isDarkMode = true }) => {
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [jsErrors, setJsErrors] = useState<string[]>([])
  
  // Function to safely add debug info
  const addDebug = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log('🔍 HomePage Debug:', message)
  }
  
  // Global error handler pour voir les erreurs sur iPad
  useEffect(() => {
    // Handler pour les erreurs JS
    window.onerror = function(message, source, lineno, colno, error) {
      const errorMsg = `⚠️ JS Error: ${message} | File: ${source} | Line: ${lineno}:${colno}`
      setJsErrors(prev => [...prev, errorMsg])
      addDebug(errorMsg)
      
      // Affichage direct dans le DOM pour iPad
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText = `
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        background: red; 
        color: white; 
        padding: 10px; 
        font-size: 14px; 
        z-index: 9999; 
        word-wrap: break-word;
      `
      errorDiv.innerHTML = `🚨 ${errorMsg}`
      document.body.appendChild(errorDiv)
      
      return false // Empêche le comportement par défaut
    }
    
    // Handler pour les promesses rejetées
    window.addEventListener('unhandledrejection', function(event) {
      const errorMsg = `⚠️ Promise Rejected: ${event.reason}`
      setJsErrors(prev => [...prev, errorMsg])
      addDebug(errorMsg)
      
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText = `
        position: fixed; 
        top: 50px; 
        left: 0; 
        right: 0; 
        background: orange; 
        color: white; 
        padding: 10px; 
        font-size: 14px; 
        z-index: 9998;
      `
      errorDiv.innerHTML = `🔥 ${errorMsg}`
      document.body.appendChild(errorDiv)
    })
    
    addDebug('Error handlers installed')
    
    return () => {
      window.onerror = null
      // Cleanup si nécessaire
    }
  }, [])

  useEffect(() => {
    try {
      addDebug('HomePage useEffect started')
      
      // Test Safari detection
      const userAgent = navigator.userAgent.toLowerCase()
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
      addDebug(`Safari detected: ${isSafari}`)
      addDebug(`User Agent: ${userAgent}`)
      addDebug(`Screen size: ${window.innerWidth}x${window.innerHeight}`)
      
      // Test viewport
      addDebug(`Viewport: ${window.visualViewport?.width || 'unknown'}x${window.visualViewport?.height || 'unknown'}`)
      
    } catch (err: any) {
      setError(`useEffect error: ${err.message}`)
      addDebug(`Error in useEffect: ${err.message}`)
    }
  }, [])

  // Test basic hooks
  const [testState, setTestState] = useState(0)

  // Test setTimeout
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        setTestState(1)
        addDebug('setTimeout worked')
      }, 1000)
      return () => clearTimeout(timer)
    } catch (err: any) {
      addDebug(`setTimeout error: ${err.message}`)
    }
  }, [])

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '2rem',
        fontFamily: 'monospace'
      }}>
        <h1>🚨 ERREUR DÉTECTÉE</h1>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '10px 20px',
            marginTop: '1rem',
            backgroundColor: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Recharger
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '-webkit-fill-available',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* Header simple */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        paddingTop: '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <Heart style={{ width: '2rem', height: '2rem', color: '#ec4899' }} />
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Affinia</h1>
        </div>
        <p style={{ color: '#9ca3af' }}>Debug Mode Safari Mobile</p>
      </div>

      {/* Test Cards simples */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#1f2937',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #374151'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy style={{ width: '1.5rem', height: '1.5rem', color: '#fbbf24' }} />
            <span>Niveau 1</span>
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#1f2937',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #374151'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star style={{ width: '1.5rem', height: '1.5rem', color: '#8b5cf6' }} />
            <span>XP: 0</span>
          </div>
        </div>
      </div>

      {/* Test State */}
      <div style={{
        backgroundColor: '#1f2937',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #374151',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Tests React</h3>
        <p>State test: {testState}</p>
        <p>Renders: {debugInfo.length}</p>
      </div>

      {/* Button test */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => {
            addDebug('Button clicked!')
            setTestState(prev => prev + 1)
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Button (clique: {testState})
        </button>
      </div>

      {/* Erreurs JS si détectées */}
      {jsErrors.length > 0 && (
        <div style={{
          backgroundColor: '#dc2626',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #ef4444',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '1rem', color: 'white' }}>🚨 ERREURS JAVASCRIPT</h3>
          {jsErrors.map((error, index) => (
            <div key={index} style={{ 
              fontSize: '0.75rem', 
              color: 'white',
              marginBottom: '0.5rem',
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Debug Info */}
      <div style={{
        backgroundColor: '#111827',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #374151',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>🔍 Debug Log</h3>
        {debugInfo.map((info, index) => (
          <div key={index} style={{ 
            fontSize: '0.75rem', 
            color: '#9ca3af',
            marginBottom: '0.25rem',
            fontFamily: 'monospace'
          }}>
            {info}
          </div>
        ))}
      </div>

      {/* Navigation test */}
      <div style={{
        marginTop: '2rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => window.location.href = '/questionnaire'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Test Navigation
        </button>
        
        <button
          onClick={() => {
            addDebug('Local storage test')
            try {
              localStorage.setItem('test', 'safari-mobile')
              addDebug('LocalStorage OK')
            } catch (err: any) {
              addDebug(`LocalStorage error: ${err.message}`)
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Test LocalStorage
        </button>
        
        <button
          onClick={() => {
            // Test volontaire d'erreur pour vérifier le handler
            addDebug('Testing error handler...')
            throw new Error('Test error pour iPad debug!')
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#7c2d12',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          🧪 Test Error
        </button>
      </div>
    </div>
  )
}