// src/hooks/useOnboarding.ts
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from './useProfile'

interface OnboardingState {
  // Loading states
  isLoading: boolean
  
  // User states
  isAuthenticated: boolean
  hasCompletedQuestionnaire: boolean
  isNewUser: boolean
  
  // Computed states
  needsOnboarding: boolean
  canAccessDashboard: boolean
  shouldShowWelcome: boolean
  
  // Navigation helpers
  getRedirectPath: () => string
  clearNewUserFlag: () => void
  
  // Onboarding progress
  onboardingStep: 'welcome' | 'questionnaire' | 'completed'
  progressPercent: number
}

export const useOnboarding = (): OnboardingState => {
  const { user, loading: authLoading } = useAuth()
  const { hasCompletedQuestionnaire, loading: profileLoading } = useProfile()
  const [isNewUser, setIsNewUser] = useState(false)

  // Check if user is new from localStorage
  useEffect(() => {
    const newUserFlag = localStorage.getItem('affinia_new_user')
    setIsNewUser(newUserFlag === 'true')
  }, [])

  // Computed values
  const isLoading = authLoading || profileLoading
  const isAuthenticated = !!user
  const needsOnboarding = isAuthenticated && !hasCompletedQuestionnaire
  const canAccessDashboard = isAuthenticated && hasCompletedQuestionnaire
  const shouldShowWelcome = isNewUser && needsOnboarding

  // Determine onboarding step
  const getOnboardingStep = (): 'welcome' | 'questionnaire' | 'completed' => {
    if (!isAuthenticated) return 'welcome'
    if (needsOnboarding) {
      return isNewUser ? 'welcome' : 'questionnaire'
    }
    return 'completed'
  }

  // Calculate progress percentage
  const getProgressPercent = (): number => {
    if (!isAuthenticated) return 0
    if (needsOnboarding) return 25 // User created but questionnaire pending
    return 100 // Fully onboarded
  }

  // Get redirect path based on current state
  const getRedirectPath = (): string => {
    if (!isAuthenticated) return '/login'
    if (needsOnboarding) return '/questionnaire'
    return '/' // Dashboard
  }

  // Clear new user flag
  const clearNewUserFlag = () => {
    localStorage.removeItem('affinia_new_user')
    setIsNewUser(false)
  }

  // Debug logging
  useEffect(() => {
    if (!isLoading) {
      console.log('🎯 useOnboarding State:', {
        isAuthenticated,
        hasCompletedQuestionnaire,
        isNewUser,
        needsOnboarding,
        canAccessDashboard,
        shouldShowWelcome,
        onboardingStep: getOnboardingStep(),
        progressPercent: getProgressPercent()
      })
    }
  }, [isAuthenticated, hasCompletedQuestionnaire, isNewUser, isLoading])

  return {
    // Loading states
    isLoading,
    
    // User states
    isAuthenticated,
    hasCompletedQuestionnaire,
    isNewUser,
    
    // Computed states
    needsOnboarding,
    canAccessDashboard,
    shouldShowWelcome,
    
    // Navigation helpers
    getRedirectPath,
    clearNewUserFlag,
    
    // Onboarding progress
    onboardingStep: getOnboardingStep(),
    progressPercent: getProgressPercent()
  }
}

// Hook spécialisé pour la navigation conditionnelle
export const useOnboardingNavigation = () => {
  const { needsOnboarding, canAccessDashboard, getRedirectPath } = useOnboarding()

  // Check if a route is allowed without questionnaire
  const isRouteAllowed = (pathname: string): boolean => {
    const allowedRoutes = [
      '/questionnaire',
      '/auth/callback',
      '/login',
      '/logout'
    ]
    
    return allowedRoutes.some(route => pathname.startsWith(route))
  }

  // Check if user should be redirected from current path
  const shouldRedirect = (currentPath: string): boolean => {
    // If needs onboarding and not on allowed route
    if (needsOnboarding && !isRouteAllowed(currentPath)) {
      return true
    }
    
    // If can access dashboard and on questionnaire page
    if (canAccessDashboard && currentPath === '/questionnaire') {
      return true
    }
    
    return false
  }

  return {
    isRouteAllowed,
    shouldRedirect,
    getRedirectPath,
    needsOnboarding,
    canAccessDashboard
  }
}