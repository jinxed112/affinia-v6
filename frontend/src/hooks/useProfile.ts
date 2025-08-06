// src/hooks/useProfile.ts
import { useState, useEffect, useRef } from 'react';
import { profileService, Profile, QuestionnaireResponse } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';

interface UseProfileReturn {
  // States
  profile: Profile | null;
  questionnaire: QuestionnaireResponse | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshProfile: () => Promise<void>;
  refreshQuestionnaire: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  
  // Computed values
  hasCompletedQuestionnaire: boolean;
  canGenerateCard: boolean;
  progressToNextLevel: {
    current: number;
    needed: number;
    percent: number;
  };
}

export const useProfile = (): UseProfileReturn => {
  const { user, loading: authLoading, clearExpiredSession, refreshSession } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🆕 NOUVEAU - Ref pour éviter les appels multiples
  const loadingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Calculer la progression vers le niveau suivant
  const getProgressToNextLevel = (currentProfile: Profile | null) => {
    if (!currentProfile) {
      return { current: 0, needed: 100, percent: 0 };
    }

    const currentXP = currentProfile.xp;
    const currentLevel = currentProfile.level;
    const xpForNextLevel = currentLevel * 100; // 100 XP par niveau
    const currentLevelXP = currentXP % 100;
    const progressPercent = (currentLevelXP / 100) * 100;
    
    return {
      current: currentLevelXP,
      needed: xpForNextLevel,
      percent: Math.min(progressPercent, 100)
    };
  };

  /**
   * 🔧 AMÉLIORÉ - Gestion spécialisée des erreurs d'authentification
   */
  const handleAuthError = async (error: any): Promise<boolean> => {
    // Vérifier si c'est une erreur de session expirée
    if (error.message === 'Session expired - redirecting to login') {
      console.log('🔄 Session expirée détectée dans useProfile, nettoyage...')
      await clearExpiredSession()
      return true // Indique qu'on a géré l'erreur
    }
    
    // Vérifier si c'est une erreur de token
    if (error.message?.includes('Invalid') || error.message?.includes('expired') || error.message?.includes('token')) {
      console.log('🔄 Erreur de token détectée, tentative de rafraîchissement...')
      
      const refreshSuccess = await refreshSession()
      if (refreshSuccess) {
        console.log('✅ Session rafraîchie, nouveau tentative des appels')
        return false // Indique qu'on peut réessayer
      } else {
        console.log('❌ Rafraîchissement impossible, nettoyage session')
        await clearExpiredSession()
        return true // Indique qu'on a géré l'erreur
      }
    }
    
    return false // Indique que ce n'est pas une erreur d'auth
  }

  /**
   * 🔧 AMÉLIORÉ - Charger les données avec gestion d'erreur robuste
   */
  const loadInitialData = async (isRetry: boolean = false) => {
    // Prévenir les appels multiples
    if (loadingRef.current) {
      console.log('⏳ useProfile: Chargement déjà en cours, abandon')
      return
    }
    
    console.log('🔄 useProfile: Début loadInitialData', { 
      user: user?.email, 
      isRetry,
      hasInitialized: hasInitializedRef.current 
    });
    
    if (!user) {
      console.log('❌ useProfile: Pas d\'utilisateur, arrêt');
      setLoading(false);
      return;
    }

    try {
      loadingRef.current = true
      setLoading(true);
      setError(null);
      
      console.log('🌐 useProfile: Début des appels API...');

      // Charger le profil et le questionnaire en parallèle
      const [profileData, questionnaireData] = await Promise.allSettled([
        profileService.getMyProfile(),
        profileService.getLatestQuestionnaire()
      ]);

      console.log('📊 useProfile: Résultats des appels:', {
        profile: profileData.status,
        questionnaire: questionnaireData.status
      });

      // 🔧 NOUVEAU - Gestion spécifique des erreurs d'auth
      let hasAuthError = false
      
      // Gérer le profil
      if (profileData.status === 'fulfilled') {
        console.log('✅ useProfile: Profil chargé:', profileData.value);
        setProfile(profileData.value);
      } else {
        console.error('❌ useProfile: Erreur profil:', profileData.reason);
        
        const isAuthError = await handleAuthError(profileData.reason)
        if (isAuthError) {
          hasAuthError = true
        } else if (!isRetry) {
          // Réessayer une fois si ce n'était pas déjà un retry
          console.log('🔄 Retry de l\'appel profil après refresh')
          loadingRef.current = false
          setTimeout(() => loadInitialData(true), 1000)
          return
        } else {
          setError('Erreur lors du chargement du profil');
        }
      }

      // Gérer le questionnaire (peut être null)
      if (questionnaireData.status === 'fulfilled') {
        console.log('✅ useProfile: Questionnaire chargé:', questionnaireData.value);
        setQuestionnaire(questionnaireData.value);
      } else {
        console.error('❌ useProfile: Erreur questionnaire:', questionnaireData.reason);
        
        const isAuthError = await handleAuthError(questionnaireData.reason)
        if (isAuthError) {
          hasAuthError = true
        } else if (!isRetry) {
          // Réessayer une fois si ce n'était pas déjà un retry
          console.log('🔄 Retry de l\'appel questionnaire après refresh')
          loadingRef.current = false
          setTimeout(() => loadInitialData(true), 1000)
          return
        } else {
          // Ne pas considérer comme une erreur si pas de questionnaire
          console.log('ℹ️ Questionnaire non trouvé ou erreur non-critique')
          setQuestionnaire(null);
        }
      }
      
      // Si erreur d'auth, ne pas marquer comme initialisé
      if (!hasAuthError) {
        hasInitializedRef.current = true
      }

    } catch (err) {
      console.error('💥 useProfile: Erreur globale:', err);
      
      const isAuthError = await handleAuthError(err)
      if (!isAuthError) {
        setError('Erreur lors du chargement des données');
      }
    } finally {
      console.log('🏁 useProfile: Fin loadInitialData, setting loading to false');
      loadingRef.current = false
      setLoading(false);
    }
  };

  /**
   * 🔧 AMÉLIORÉ - Recharger le profil avec gestion d'erreur
   */
  const refreshProfile = async () => {
    try {
      setError(null);
      const profileData = await profileService.getMyProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Error refreshing profile:', err);
      
      const isAuthError = await handleAuthError(err)
      if (!isAuthError) {
        setError('Erreur lors du rechargement du profil');
      }
    }
  };

  /**
   * 🔧 AMÉLIORÉ - Recharger le questionnaire avec gestion d'erreur
   */
  const refreshQuestionnaire = async () => {
    try {
      setError(null);
      const questionnaireData = await profileService.getLatestQuestionnaire();
      setQuestionnaire(questionnaireData);
    } catch (err) {
      console.error('Error refreshing questionnaire:', err);
      
      const isAuthError = await handleAuthError(err)
      if (!isAuthError) {
        setError('Erreur lors du rechargement du questionnaire');
      }
    }
  };

  /**
   * 🔧 AMÉLIORÉ - Mettre à jour le profil avec gestion d'erreur
   */
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setError(null);
      const updatedProfile = await profileService.updateMyProfile(updates);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Error updating profile:', err);
      
      const isAuthError = await handleAuthError(err)
      if (!isAuthError) {
        setError('Erreur lors de la mise à jour du profil');
        throw err; // Re-throw pour que le composant puisse gérer l'erreur
      }
    }
  };

  /**
   * 🔧 AMÉLIORÉ - Effect principal avec protection contre les boucles
   */
  useEffect(() => {
    console.log('🎯 useProfile: useEffect déclenché', { 
      user: user?.email, 
      authLoading: authLoading,
      hasUser: !!user,
      hasInitialized: hasInitializedRef.current
    });
    
    // ✅ Conditions strictes pour éviter les boucles infinies
    if (user && !authLoading && !hasInitializedRef.current && !loadingRef.current) {
      console.log('✅ useProfile: Auth prêt, lancement loadInitialData');
      loadInitialData();
    } else if (!user && !authLoading) {
      console.log('❌ useProfile: Pas d\'utilisateur après auth, arrêt loading');
      setLoading(false);
      hasInitializedRef.current = false // Reset pour permettre un nouveau chargement si l'user revient
    } else {
      console.log('⏳ useProfile: En attente auth...', { 
        hasUser: !!user, 
        authLoading: authLoading,
        hasInitialized: hasInitializedRef.current,
        isLoading: loadingRef.current
      });
    }
  }, [user, authLoading]); // Dépendances : user ET authLoading

  /**
   * 🆕 NOUVEAU - Effect pour nettoyer lors de la déconnexion
   */
  useEffect(() => {
    if (!user) {
      console.log('🧹 Nettoyage des données profil (utilisateur déconnecté)')
      setProfile(null)
      setQuestionnaire(null)
      setError(null)
      hasInitializedRef.current = false
      loadingRef.current = false
    }
  }, [user])

  // Computed values
  const hasCompletedQuestionnaire = questionnaire !== null;
  const canGenerateCard = hasCompletedQuestionnaire && questionnaire?.profile_json !== null;
  const progressToNextLevel = getProgressToNextLevel(profile);

  return {
    // States
    profile,
    questionnaire,
    loading,
    error,
    
    // Actions
    refreshProfile,
    refreshQuestionnaire,
    updateProfile,
    
    // Computed values
    hasCompletedQuestionnaire,
    canGenerateCard,
    progressToNextLevel
  };
};

// Hook pour les stats détaillées (optionnel, pour une page de stats avancées)
export const useProfileStats = (userId?: string) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        const targetUserId = userId || user.id;
        const statsData = await profileService.getProfileStats(targetUserId);
        setStats(statsData);
      } catch (err) {
        console.error('Error loading stats:', err);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user, userId]);

  return { stats, loading, error };
};