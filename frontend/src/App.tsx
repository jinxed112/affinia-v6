import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header } from './components/Header'
import { AuthCallback } from './components/AuthCallback'
import { OnboardingGuard } from './components/OnboardingGuard'
import AuthConfirm from './components/AuthConfirm'
import Login from './pages/Login'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { MirrorPage } from './pages/MirrorPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { RequestsPage } from './pages/RequestsPage'
import SimpleQuestionnairePage from './pages/SimpleQuestionnairePage'
import { AdminPage } from './pages/AdminPage'
import { ResetPasswordPage } from './pages'
import { ChatPage } from './components/chat/ChatPage'
import { ChatPageOptimized } from './components/chat/ChatPageOptimized';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

function AppContent() {
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = React.useState(true)

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode)
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light')
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {user && <Header isDarkMode={isDarkMode} onThemeToggle={handleThemeToggle} />}
      
      <div className={user ? 'pt-16' : ''}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />
          <Route path="/reset-password" element={<ResetPasswordPage isDarkMode={isDarkMode} />} />

          <Route path="/" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <HomePage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/profil" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <ProfilePage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/miroir" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <MirrorPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/miroir/:id" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <MirrorPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/decouverte" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <DiscoveryPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/demandes" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <RequestsPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/questionnaire" element={
            <PrivateRoute>
              <SimpleQuestionnairePage isDarkMode={isDarkMode} />
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute>
              <AdminPage isDarkMode={isDarkMode} />
            </PrivateRoute>
          } />

          <Route path="/chat" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <ChatPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="/chat/:conversationId" element={
            <PrivateRoute>
              <OnboardingGuard isDarkMode={isDarkMode}>
                <ChatPage isDarkMode={isDarkMode} />
              </OnboardingGuard>
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}