// App.tsx - COURT-CIRCUIT tout pour afficher HomePage direct
import React, { useState, useEffect } from 'react'

// HomePage ultra-minimale DIRECTEMENT dans App.tsx
const HomePageDirect = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ff6b6b', // Rouge pour debug - différent du mauve
      color: 'white',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '2rem' }}>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '2rem',
          border: '3px solid white',
          padding: '1rem',
          backgroundColor: 'rgba(0,0,0,0.3)'
        }}>
          🎯 APP.TSX → HOMEPAGE DIRECT
        </h1>
        
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '2px solid white'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>🚨 TEST DÉCISIF</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            Si tu vois ce message ROUGE sur Safari mobile :
          </p>
          <p style={{ fontSize: '1.1rem' }}>
            ✅ HomePage fonctionne<br/>
            ❌ Le problème = ROUTING ou WRAPPERS
          </p>
        </div>

        <div style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3>🔍 Diagnostic complet</h3>
          <p><strong>Fond rouge</strong> = App.tsx → HomePage direct</p>
          <p><strong>Fond mauve</strong> = Routing vers HomePage</p>
          <p><strong>Page vide</strong> = Crash avant HomePage</p>
        </div>

        <button 
          onClick={() => {
            alert('🎉 APP.TSX DIRECT FONCTIONNE !\n\nLe problème vient du routing, OnboardingGuard, PrivateRoute, ou des hooks useAuth/useProfile.')
          }}
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: '2px solid white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            marginBottom: '2rem'
          }}
        >
          🧪 CONFIRMER QUE ÇA MARCHE
        </button>

        <div style={{
          backgroundColor: 'rgba(255,255,0,0.3)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3>📋 Si tu vois ce message :</h3>
          <ol style={{ textAlign: 'left', paddingLeft: '1rem' }}>
            <li><strong>HomePage fonctionne ✅</strong></li>
            <li><strong>Problème = routing/wrappers ❌</strong></li>
            <li><strong>Suspects : OnboardingGuard, PrivateRoute, useAuth, useProfile</strong></li>
            <li><strong>Solution = simplifier le routing Safari mobile</strong></li>
          </ol>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <h4>📱 Device Info</h4>
            <p>{window.innerWidth} x {window.innerHeight}</p>
            <p>{navigator.platform}</p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <h4>🕒 Test Time</h4>
            <p>{new Date().toLocaleTimeString()}</p>
            <p>Direct render</p>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          <p><strong>User Agent:</strong></p>
          <p style={{ wordBreak: 'break-all', fontSize: '0.7rem' }}>
            {navigator.userAgent}
          </p>
        </div>

      </div>
    </div>
  )
}

// Détection Safari mobile
const isSafariMobile = (() => {
  try {
    const ua = navigator.userAgent.toLowerCase()
    return /safari/.test(ua) && !/chrome/.test(ua) && (/mobile|iphone|ipad/.test(ua) || window.innerWidth <= 768)
  } catch (e) {
    return true
  }
})()

// App principal - COURT-CIRCUIT tout pour test
export default function App() {
  const [showDirect, setShowDirect] = useState(false)

  useEffect(() => {
    // Afficher direct après 2 secondes
    const timer = setTimeout(() => {
      setShowDirect(true)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  // Loader initial
  if (!showDirect) {
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
          <p style={{ color: '#9ca3af' }}>Test court-circuit routing...</p>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '1rem' }}>
            {isSafariMobile ? 'Safari mobile détecté' : 'Desktop détecté'}
          </p>
        </div>
      </div>
    )
  }

  // Affichage direct de HomePage
  return <HomePageDirect />
}