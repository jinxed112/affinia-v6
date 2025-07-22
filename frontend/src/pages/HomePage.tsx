// src/pages/HomePage.tsx - VERSION ULTRA MINIMALE - JavaScript pur
import React from 'react'

export const HomePage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#8b5cf6', // Couleur mauve pour debug
      color: 'white',
      padding: '1rem',
      paddingTop: '5rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '2rem',
          border: '2px solid white',
          padding: '1rem'
        }}>
          🎯 HOMEPAGE TEST SAFARI MOBILE
        </h1>
        
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2>✅ SI TU VOIS CE MESSAGE</h2>
          <p>HomePage.tsx fonctionne sur Safari mobile !</p>
          <p>Le problème vient des imports complexes.</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,0,0,0.2)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3>🔍 Debug Info</h3>
          <p><strong>User Agent:</strong></p>
          <p style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
            {navigator.userAgent}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(0,255,0,0.2)',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <h4>Screen</h4>
            <p>{window.innerWidth} x {window.innerHeight}</p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(0,0,255,0.2)',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <h4>Device</h4>
            <p>{navigator.platform}</p>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,0,0.2)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3>🧪 Tests basiques</h3>
          <p>✅ React render</p>
          <p>✅ Style inline</p>
          <p>✅ JavaScript basique</p>
          <p>✅ Navigator API</p>
        </div>

        <button 
          onClick={() => {
            alert('HomePage fonctionne ! Le problème vient des imports complexes.')
          }}
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '1rem'
          }}
        >
          🎉 TESTER L'INTERACTION
        </button>

        <div style={{
          backgroundColor: 'rgba(0,0,0,0.3)',
          padding: '1rem',
          borderRadius: '8px'
        }}>
          <h3>📋 Prochaines étapes si tu vois ce message:</h3>
          <ol style={{ textAlign: 'left', paddingLeft: '1rem' }}>
            <li>HomePage.tsx de base fonctionne ✅</li>
            <li>Le problème = imports complexes ❌</li>
            <li>Solution = réintroduire les imports un par un</li>
            <li>Identifier le coupable exact</li>
          </ol>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.7 }}>
          <p>Version: Ultra-minimale JavaScript pur</p>
          <p>Date: {new Date().toLocaleString()}</p>
        </div>

      </div>
    </div>
  )
}