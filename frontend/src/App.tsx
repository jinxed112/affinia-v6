// App.tsx - Version ABSOLUMENT MINIMALE pour debug Safari mobile
import React, { useState, useEffect } from 'react'

// Global error handlers CRITIQUES
window.onerror = function(message, source, lineno, colno, error) {
  console.error('🚨 APP CRASH:', message, source, lineno)
  
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
  errorDiv.innerHTML = `🚨 CRASH: ${message}<br>File: ${source}<br>Line: ${lineno}`
  document.body.appendChild(errorDiv)
  
  return false
}

window.addEventListener('unhandledrejection', function(event) {
  console.error('🔥 PROMISE REJECTION:', event.reason)
  
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

console.log('🔍 App.tsx: Version minimale started')

// Détection Safari mobile
const isSafariMobile = (() => {
  const ua = navigator.userAgent.toLowerCase()
  return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
})()

const TestApp: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [currentTest, setCurrentTest] = useState(0)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  
  const addDebug = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const newDebug = `${timestamp}: ${message}`
    setDebugInfo(prev => [...prev, newDebug])
    console.log('🔍 Debug:', newDebug)
  }
  
  useEffect(() => {
    addDebug('App.tsx minimal started')
    addDebug(`Safari mobile: ${isSafariMobile}`)
    addDebug(`User Agent: ${navigator.userAgent}`)
  }, [])
  
  // Test 1: React Router
  const testReactRouter = async () => {
    addDebug('🧪 Test 1: React Router...')
    try {
      const { BrowserRouter } = await import('react-router-dom')
      addDebug('✅ React Router imported OK')
      setTestResults(prev => ({ ...prev, router: true }))
    } catch (err: any) {
      addDebug(`❌ React Router FAILED: ${err.message}`)
      setTestResults(prev => ({ ...prev, router: false }))
    }
  }
  
  // Test 2: AuthContext
  const testAuthContext = async () => {
    addDebug('🧪 Test 2: AuthContext...')
    try {
      const { AuthProvider } = await import('./contexts/AuthContext')
      addDebug('✅ AuthContext imported OK')
      setTestResults(prev => ({ ...prev, auth: true }))
    } catch (err: any) {
      addDebug(`❌ AuthContext FAILED: ${err.message}`)
      setTestResults(prev => ({ ...prev, auth: false }))
    }
  }
  
  // Test 3: NotificationContext
  const testNotificationContext = async () => {
    addDebug('🧪 Test 3: NotificationContext...')
    try {
      const { NotificationProvider } = await import('./contexts/NotificationContext')
      addDebug('✅ NotificationContext imported OK')
      setTestResults(prev => ({ ...prev, notification: true }))
    } catch (err: any) {
      addDebug(`❌ NotificationContext FAILED: ${err.message}`)
      setTestResults(prev => ({ ...prev, notification: false }))
    }
  }
  
  // Test 4: Header Component
  const testHeader = async () => {
    addDebug('🧪 Test 4: Header...')
    try {
      const { Header } = await import('./components/Header')
      addDebug('✅ Header imported OK')
      setTestResults(prev => ({ ...prev, header: true }))
    } catch (err: any) {
      addDebug(`❌ Header FAILED: ${err.message}`)
      setTestResults(prev => ({ ...prev, header: false }))
    }
  }
  
  // Test 5: HomePage
  const testHomePage = async () => {
    addDebug('🧪 Test 5: HomePage...')
    try {
      const { HomePage } = await import('./pages/HomePage')
      addDebug('✅ HomePage imported OK')
      setTestResults(prev => ({ ...prev, homepage: true }))
    } catch (err: any) {
      addDebug(`❌ HomePage FAILED: ${err.message}`)
      setTestResults(prev => ({ ...prev, homepage: false }))
    }
  }
  
  // Test 6: Login Page
  const testLogin = async () => {
    addDebug('🧪 Test 6: Login...')
    try {
      const Login = await import('./pages/Login')
      addDebug('✅ Login imported OK')
      setTestResults(prev => ({ ...prev, login: true }))
    } catch (err: any) {
      addDebug(`❌ Login FAILED: ${err.message}`)
      setTestResults(prev => ({ ...prev, login: false }))
    }
  }
  
  // Test 7: Supabase
  const testSupabase = async () => {
    addDebug('🧪 Test 7: Supabase...')
    try {
      const { supabase } = await import('./lib/supabase')
      addDebug('✅ Supabase imported OK')
      
      // Test simple call
      const { error } = await supabase.auth.getSession()
      if (error) {
        addDebug(`⚠️ Supabase auth error: ${error.message}`)
      } else {
        addDebug('✅ Supabase auth call OK')
      }
      setTestResults(prev => ({ ...prev, supabase: true }))
    } catch (err: any) {
      addDebug(`❌ Supabase FAILED: ${err.message}`)
      setTestResults(prev => ({ ...prev, supabase: false }))
    }
  }
  
  const tests = [
    { name: 'React Router', fn: testReactRouter, key: 'router' },
    { name: 'AuthContext', fn: testAuthContext, key: 'auth' },
    { name: 'NotificationContext', fn: testNotificationContext, key: 'notification' },
    { name: 'Header', fn: testHeader, key: 'header' },
    { name: 'HomePage', fn: testHomePage, key: 'homepage' },
    { name: 'Login', fn: testLogin, key: 'login' },
    { name: 'Supabase', fn: testSupabase, key: 'supabase' },
  ]
  
  const runCurrentTest = () => {
    if (currentTest < tests.length) {
      tests[currentTest].fn()
      setCurrentTest(prev => prev + 1)
    }
  }
  
  const runAllTests = async () => {
    for (let i = 0; i < tests.length; i++) {
      setCurrentTest(i)
      await tests[i].fn()
      await new Promise(resolve => setTimeout(resolve, 1000)) // Pause entre tests
    }
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      minHeight: isSafariMobile ? '-webkit-fill-available' : '100vh',
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
        ✅ React minimal OK | Safari: {isSafariMobile ? 'OUI' : 'NON'} | Tests: {currentTest}/{tests.length}
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
          Debug Safari Mobile - Tests Progressifs
        </p>
        
        {/* Résultats des tests */}
        <div style={{
          backgroundColor: '#1f2937',
          padding: '2rem',
          borderRadius: '1rem',
          margin: '2rem 0',
          border: '1px solid #374151'
        }}>
          <h2>🧪 Résultats des Tests</h2>
          <div style={{ margin: '1rem 0', textAlign: 'left' }}>
            {tests.map((test, index) => {
              const result = testResults[test.key]
              const status = result === true ? '✅' : result === false ? '❌' : '⏳'
              const bg = result === true ? '#065f46' : result === false ? '#7f1d1d' : '#374151'
              
              return (
                <div key={test.key} style={{
                  padding: '0.5rem',
                  margin: '0.5rem 0',
                  backgroundColor: bg,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{status} {test.name}</span>
                  <span>{index === currentTest ? '🔄' : ''}</span>
                </div>
              )
            })}
          </div>
          
          <div style={{ margin: '2rem 0', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={runCurrentTest}
              disabled={currentTest >= tests.length}
              style={{
                padding: '15px 30px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                opacity: currentTest >= tests.length ? 0.5 : 1
              }}
            >
              Test Suivant ({currentTest + 1}/{tests.length})
            </button>
            
            <button
              onClick={runAllTests}
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
              🔥 Tout Tester
            </button>
            
            <button
              onClick={() => {
                setCurrentTest(0)
                setTestResults({})
                setDebugInfo([])
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
              🔄 Reset
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
          <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>🔍 Debug Log</h3>
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
          On va tester chaque import un par un pour identifier qui fait crasher Safari mobile !
        </div>
      </div>
    </div>
  )
}

export default TestApp