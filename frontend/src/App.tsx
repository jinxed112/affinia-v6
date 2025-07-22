// App.tsx - Version debug ultra-simple pour Safari mobile
import React, { useState, useEffect } from 'react'

// Global error handlers AVANT tout
window.onerror = function(message, source, lineno, colno, error) {
  console.error('🚨 APP.TSX ERROR:', message, source, lineno)
  
  // Affichage direct dans le DOM pour iPad
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = `
    position: fixed; 
    top: 0; 
    left: 0; 
    right: 0; 
    background: red; 
    color: white; 
    padding: 20px; 
    font-size: 16px; 
    z-index: 9999; 
    word-wrap: break-word;
    font-family: monospace;
  `
  errorDiv.innerHTML = `
    🚨 CRASH DETECTED IN APP.TSX<br>
    Message: ${message}<br>
    File: ${source}<br>
    Line: ${lineno}:${colno}<br>
    Stack: ${error?.stack || 'No stack'}
  `
  document.body.appendChild(errorDiv)
  
  return false
}

// Promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
  console.error('🔥 PROMISE REJECTION IN APP:', event.reason)
  
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = `
    position: fixed; 
    top: 120px; 
    left: 0; 
    right: 0; 
    background: orange; 
    color: white; 
    padding: 20px; 
    font-size: 16px; 
    z-index: 9998;
    font-family: monospace;
  `
  errorDiv.innerHTML = `🔥 PROMISE REJECTED: ${event.reason}`
  document.body.appendChild(errorDiv)
})

console.log('🔍 App.tsx: Error handlers installed')

// Test component ultra-simple SANS AUCUN import complexe
const TestApp: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [testPhase, setTestPhase] = useState(0)
  
  const addDebug = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const newDebug = `${timestamp}: ${message}`
    setDebugInfo(prev => [...prev, newDebug])
    console.log('🔍 App.tsx Debug:', newDebug)
  }
  
  useEffect(() => {
    addDebug('App.tsx useEffect started')
    
    try {
      // Test 1: Detection environnement
      const userAgent = navigator.userAgent.toLowerCase()
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
      const isMobile = /mobile|iphone|ipad|android/.test(userAgent)
      
      addDebug(`Safari: ${isSafari}, Mobile: ${isMobile}`)
      addDebug(`User Agent: ${userAgent}`)
      addDebug(`Screen: ${window.innerWidth}x${window.innerHeight}`)
      
      // Test 2: localStorage (suspect #1)
      try {
        localStorage.setItem('safari-test', 'ok')
        localStorage.removeItem('safari-test')
        addDebug('✅ localStorage works')
      } catch (err: any) {
        addDebug(`❌ localStorage ERROR: ${err.message}`)
      }
      
      // Test 3: APIs modernes
      try {
        if ('matchMedia' in window) {
          const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
          addDebug(`✅ matchMedia works: ${darkMode}`)
        } else {
          addDebug('❌ matchMedia not supported')
        }
      } catch (err: any) {
        addDebug(`❌ matchMedia ERROR: ${err.message}`)
      }
      
      // Test 4: Promises et async
      Promise.resolve('test').then(() => {
        addDebug('✅ Promises work')
      }).catch((err) => {
        addDebug(`❌ Promise ERROR: ${err.message}`)
      })
      
      // Test 5: setTimeout
      setTimeout(() => {
        addDebug('✅ setTimeout works')
        setTestPhase(1)
      }, 1000)
      
    } catch (err: any) {
      addDebug(`❌ GENERAL ERROR in useEffect: ${err.message}`)
    }
  }, [])
  
  // Test des imports suspects un par un
  const testImports = async () => {
    addDebug('Testing imports...')
    
    try {
      addDebug('Testing React Router...')
      const { BrowserRouter } = await import('react-router-dom')
      addDebug('✅ React Router imported')
    } catch (err: any) {
      addDebug(`❌ React Router ERROR: ${err.message}`)
    }
    
    try {
      addDebug('Testing Supabase lib...')
      const { supabase } = await import('./lib/supabase')
      addDebug('✅ Supabase lib imported')
      
      // Test simple Supabase call
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        addDebug(`❌ Supabase auth ERROR: ${error.message}`)
      } else {
        addDebug(`✅ Supabase auth works: ${data?.session ? 'session exists' : 'no session'}`)
      }
    } catch (err: any) {
      addDebug(`❌ Supabase ERROR: ${err.message}`)
    }
    
    try {
      addDebug('Testing AuthContext...')
      const { AuthProvider } = await import('./contexts/AuthContext')
      addDebug('✅ AuthContext imported')
    } catch (err: any) {
      addDebug(`❌ AuthContext ERROR: ${err.message}`)
    }
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '-webkit-fill-available',
      backgroundColor: '#0f0d15',
      color: 'white',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      {/* Status en haut */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'green',
        color: 'white',
        padding: '10px',
        fontSize: '14px',
        zIndex: 9997
      }}>
        ✅ React + App.tsx OK | Phase: {testPhase} | Logs: {debugInfo.length}
      </div>
      
      <div style={{
        textAlign: 'center',
        paddingTop: '2rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>
          💜 AFFINIA
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          Debug Safari Mobile - App.tsx Simplifié
        </p>
        
        {/* Tests */}
        <div style={{
          backgroundColor: '#1f2937',
          padding: '2rem',
          borderRadius: '1rem',
          margin: '2rem 0',
          border: '1px solid #374151'
        }}>
          <h2>🧪 Tests App.tsx</h2>
          <p>Phase de test: {testPhase}</p>
          
          <div style={{ margin: '2rem 0', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                addDebug('Manual button test')
                setTestPhase(prev => prev + 1)
              }}
              style={{
                padding: '15px 30px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Test Manual
            </button>
            
            <button
              onClick={testImports}
              style={{
                padding: '15px 30px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              🔥 Test Imports (Dangereux)
            </button>
            
            <button
              onClick={() => {
                // Test CSS injection comme dans le vrai App.tsx
                addDebug('Testing CSS injection...')
                try {
                  const style = document.createElement('style')
                  style.textContent = `
                    .test-css { color: red; }
                    @keyframes test-anim { 0% { opacity: 1; } 100% { opacity: 0; } }
                  `
                  document.head.appendChild(style)
                  addDebug('✅ CSS injection works')
                } catch (err: any) {
                  addDebug(`❌ CSS injection ERROR: ${err.message}`)
                }
              }}
              style={{
                padding: '15px 30px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Test CSS
            </button>
          </div>
        </div>
        
        {/* Debug Log */}
        <div style={{
          backgroundColor: '#111827',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #374151',
          maxHeight: '300px',
          overflowY: 'auto',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>🔍 Debug Log (Temps réel)</h3>
          {debugInfo.map((info, index) => (
            <div key={index} style={{ 
              fontSize: '0.75rem', 
              color: '#9ca3af',
              marginBottom: '0.25rem',
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>
              {info}
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#6b7280' }}>
          Si cette page s'affiche, React fonctionne. Les boutons vont tester les suspects un par un.
        </div>
      </div>
    </div>
  )
}

export default TestApp