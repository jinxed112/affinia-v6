// src/hooks/useProfile.ts
import { useState, useEffect, useRef } from 'react';
import { profileService, Profile, QuestionnaireResponse } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';

const DEBUG_PROFILE = false; // ← DÉSACTIVÉ POUR PRODUCTION

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

  // 🔧 CORRIGÉ - Refs pour éviter les race conditions
  const loadingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const mountedRef = useRef(true);

  // Calculer la progression vers le niveau suivant
  const getProgressToNextLevel = (currentProfile: Profile | null) => {
    if (!currentProfile) {
      return { current: 0, needed: 100, percent: 0 };
    }

    const currentXP = currentProfile.xp;
    const currentLevel = currentProfile.level;
    const xpForNextLevel = currentLevel * 100;
    const currentLevelXP = currentXP % 100;
    const progressPercent = (currentLevelXP / 100) * 100;

    return {
      current: currentLevelXP,
      needed: xpForNextLevel,
      percent: Math.min(progressPercent, 100)
    };
  };

  const handleAuthError = async (error: any): Promise<boolean> => {
    if (error.message === 'Session expired - redirecting to login') {
      if (DEBUG_PROFILE) console.log('🔄 Session expirée détectée dans useProfile, nettoyage...')
      await clearExpiredSession()
      return true
    }

    if (error.message?.includes('Invalid') || error.message?.includes('expired') || error.message?.includes('token')) {
      if (DEBUG_PROFILE) console.log('🔄 Erreur de token détectée, tentative de rafraîchissement...')

      const refreshSuccess = await refreshSession()
      if (refreshSuccess) {
        if (DEBUG_PROFILE) console.log('✅ Session rafraîchie, nouveau tentative des appels')
        return false
      } else {
        if (DEBUG_PROFILE) console.log('❌ Rafraîchissement impossible, nettoyage session')
        await clearExpiredSession()
        return true
      }
    }

    return false
  }

  const loadInitialData = async (isRetry: boolean = false) => {
    if (DEBUG_PROFILE) {
      console.log('🔄 useProfile: Début loadInitialData', {
        user: user?.email,
        isRetry,
        hasInitialized: hasInitializedRef.current,
        loadingRefCurrent: loadingRef.current,
        mounted: mountedRef.current
      });
    }

    if (loadingRef.current && !isRetry) {
      if (DEBUG_PROFILE) console.log('⏳ useProfile: Chargement déjà en cours, abandon (sauf si retry)')
      return
    }

    if (!user) {
      if (DEBUG_PROFILE) console.log('❌ useProfile: Pas d\'utilisateur, arrêt');
      if (mountedRef.current) {
        setLoading(false);
      }
      return;
    }

    if (!mountedRef.current) {
      if (DEBUG_PROFILE) console.log('❌ useProfile: Composant démonté, arrêt');
      return;
    }

    try {
      loadingRef.current = true
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      if (DEBUG_PROFILE) console.log('🌐 useProfile: Début des appels API...');

      const [profileData, questionnaireData] = await Promise.allSettled([
        profileService.getMyProfile(),
        profileService.getLatestQuestionnaire()
      ]);

      if (DEBUG_PROFILE) {
        console.log('📊 useProfile: Résultats des appels:', {
          profile: profileData.status,
          questionnaire: questionnaireData.status
        });
      }

      if (!mountedRef.current) {
        if (DEBUG_PROFILE) console.log('❌ useProfile: Composant démonté pendant les appels API');
        return;
      }

      let hasAuthError = false

      if (profileData.status === 'fulfilled') {
        if (DEBUG_PROFILE) console.log('✅ useProfile: Profil chargé:', profileData.value);
        setProfile(profileData.value);
      } else {

        const isAuthError = await handleAuthError(profileData.reason)
        if (isAuthError) {
          hasAuthError = true
        } else if (!isRetry) {
          if (DEBUG_PROFILE) console.log('🔄 Retry de l\'appel profil après refresh')
          loadingRef.current = false
          setTimeout(() => loadInitialData(true), 1000)
          return
        } else {
          if (mountedRef.current) {
            setError('Erreur lors du chargement du profil');
          }
        }
      }

      if (questionnaireData.status === 'fulfilled') {
        if (DEBUG_PROFILE) console.log('✅ useProfile: Questionnaire chargé:', questionnaireData.value);
        if (mountedRef.current) {
          setQuestionnaire(questionnaireData.value);
        }
      } else {

        const isAuthError = await handleAuthError(questionnaireData.reason)
        if (isAuthError) {
          hasAuthError = true
        } else if (!isRetry) {
          if (DEBUG_PROFILE) console.log('🔄 Retry de l\'appel questionnaire après refresh')
          loadingRef.current = false
          setTimeout(() => loadInitialData(true), 1000)
          return
        } else {
          if (DEBUG_PROFILE) console.log('ℹ️ Questionnaire non trouvé ou erreur non-critique, maintien de l\'état actuel')
        }
      }

      if (!hasAuthError && mountedRef.current) {
        hasInitializedRef.current = true
      }

    } catch (err) {

      const isAuthError = await handleAuthError(err)
      if (!isAuthError && mountedRef.current) {
        setError('Erreur lors du chargement des données');
      }
    } finally {
      if (DEBUG_PROFILE) console.log('🏁 useProfile: Fin loadInitialData, setting loading to false');
      loadingRef.current = false
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refreshProfile = async () => {
    if (!mountedRef.current) return;

    try {
      setError(null);
      const profileData = await profileService.getMyProfile();
      if (mountedRef.current) {
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);

      const isAuthError = await handleAuthError(err)
      if (!isAuthError && mountedRef.current) {
        setError('Erreur lors du rechargement du profil');
      }
    }
  };

  const refreshQuestionnaire = async () => {
    if (!mountedRef.current) return;

    try {
      setError(null);
      const questionnaireData = await profileService.getLatestQuestionnaire();
      if (mountedRef.current) {
        setQuestionnaire(questionnaireData);
      }
    } catch (err) {
      console.error('Error refreshing questionnaire:', err);

      const isAuthError = await handleAuthError(err)
      if (!isAuthError && mountedRef.current) {
        setError('Erreur lors du rechargement du questionnaire');
      }
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!mountedRef.current) return;

    try {
      setError(null);
      const updatedProfile = await profileService.updateMyProfile(updates);
      if (mountedRef.current) {
        setProfile(updatedProfile);
      }
    } catch (err) {
      console.error('Error updating profile:', err);

      const isAuthError = await handleAuthError(err)
      if (!isAuthError && mountedRef.current) {
        setError('Erreur lors de la mise à jour du profil');
        throw err;
      }
    }
  };

  // 🔧 CORRIGÉ - Effect principal avec dépendances fixes
  useEffect(() => {
    if (DEBUG_PROFILE) {
      console.log('🎯 useProfile: useEffect déclenché', {
        user: user?.email,
        authLoading: authLoading,
        hasUser: !!user,
        hasInitialized: hasInitializedRef.current,
        loadingRefCurrent: loadingRef.current
      });
    }

    if (user && !authLoading && !hasInitializedRef.current) {
      if (DEBUG_PROFILE) console.log('✅ useProfile: Auth prêt, lancement loadInitialData');
      loadInitialData();
    } else if (!user && !authLoading) {
      if (DEBUG_PROFILE) console.log('❌ useProfile: Pas d\'utilisateur après auth, arrêt loading');
      if (mountedRef.current) {
        setLoading(false);
      }
      hasInitializedRef.current = false
    } else {
      if (DEBUG_PROFILE) {
        console.log('⏳ useProfile: En attente auth...', {
          hasUser: !!user,
          authLoading: authLoading,
          hasInitialized: hasInitializedRef.current,
          isLoading: loadingRef.current
        });
      }
    }
  }, [user?.id, authLoading]); // 🔧 FIX: Dépendances user.id au lieu de user

  useEffect(() => {
    if (!user) {
      if (DEBUG_PROFILE) console.log('🧹 Nettoyage des données profil (utilisateur déconnecté)')
      if (mountedRef.current) {
        setProfile(null)
        setQuestionnaire(null)
        setError(null)
      }
      hasInitializedRef.current = false
      loadingRef.current = false
    }
  }, [user])

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      if (DEBUG_PROFILE) console.log('🧹 useProfile: Cleanup - composant démonté');
      mountedRef.current = false;
      loadingRef.current = false;
    };
  }, []);

  const hasCompletedQuestionnaire = questionnaire !== null && (
    questionnaire.completed_at ||
    questionnaire.profile_json ||
    (questionnaire.generated_profile && questionnaire.generated_profile.length > 100) ||
    (questionnaire.answers && typeof questionnaire.answers === 'object' && Object.keys(questionnaire.answers).length > 2)
  );

  const canGenerateCard = hasCompletedQuestionnaire && questionnaire?.profile_json !== null;
  const progressToNextLevel = getProgressToNextLevel(profile);

  // 🔧 DEBUG DÉSACTIVÉ - Plus de logs computed values
  if (DEBUG_PROFILE) {
    console.log('🧠 useProfile computed values:', {
      questionnaire: !!questionnaire,
      completed_at: questionnaire?.completed_at,
      profile_json: !!questionnaire?.profile_json,
      generated_profile_length: questionnaire?.generated_profile?.length || 0,
      answers_count: questionnaire?.answers ? Object.keys(questionnaire.answers).length : 0,
      hasCompletedQuestionnaire,
      mounted: mountedRef.current,
      loading: loading,
      hasInitialized: hasInitializedRef.current
    });
  }

  return {
    profile,
    questionnaire,
    loading,
    error,
    refreshProfile,
    refreshQuestionnaire,
    updateProfile,
    hasCompletedQuestionnaire,
    canGenerateCard,
    progressToNextLevel
  };
};

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
