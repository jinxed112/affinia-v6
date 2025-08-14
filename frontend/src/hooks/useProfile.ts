// src/hooks/useProfile.ts - VERSION ULTRA-OPTIMISÉE MOBILE
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { profileService, Profile, QuestionnaireResponse } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';

const DEBUG_PROFILE = false; // Désactivé pour production

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

// 🚀 OPTIMISATION 1: Cache intelligent global
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en ms
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MOBILE_TTL = 10 * 60 * 1000; // 10 minutes sur mobile (connexion plus lente)

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || (this.isMobile() ? this.MOBILE_TTL : this.DEFAULT_TTL);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Vérifier expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Préchargement intelligent
  preload<T>(key: string, loader: () => Promise<T>, priority: 'high' | 'low' = 'low'): void {
    if (this.get(key)) return; // Déjà en cache

    const load = async () => {
      try {
        const data = await loader();
        this.set(key, data);
      } catch (error) {
        console.error(`Erreur préchargement ${key}:`, error);
      }
    };

    if (priority === 'high') {
      load(); // Immédiat
    } else {
      // Différé pour éviter de surcharger
      setTimeout(load, 1000);
    }
  }
}

const profileCache = new SmartCache();

// 🚀 OPTIMISATION 2: Détection capacité réseau
const getNetworkCapability = (): 'slow' | 'medium' | 'fast' => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'medium';
  
  const effectiveType = connection.effectiveType;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
  if (effectiveType === '3g') return 'medium';
  return 'fast';
};

// 🚀 OPTIMISATION 3: Stratégie de chargement adaptative
const getLoadingStrategy = (): 'sequential' | 'parallel' => {
  const network = getNetworkCapability();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Sequential pour connexions lentes ou mobile
  if (network === 'slow' || isMobile) return 'sequential';
  return 'parallel';
};

export const useProfile = (): UseProfileReturn => {
  const { user, loading: authLoading, clearExpiredSession, refreshSession } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs pour éviter les race conditions
  const loadingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  // 🚀 OPTIMISATION 4: Progression calculée MEMOIZED
  const progressToNextLevel = useMemo(() => {
    if (!profile) {
      return { current: 0, needed: 100, percent: 0 };
    }

    const currentXP = profile.xp || 0;
    const currentLevel = profile.level || 1;
    const xpForNextLevel = currentLevel * 100;
    const currentLevelXP = currentXP % 100;
    const progressPercent = Math.min((currentLevelXP / 100) * 100, 100);

    return {
      current: currentLevelXP,
      needed: xpForNextLevel,
      percent: progressPercent
    };
  }, [profile?.xp, profile?.level]);

  // 🚀 OPTIMISATION 5: Questionnaire complété MEMOIZED
  const hasCompletedQuestionnaire = useMemo(() => {
    return questionnaire !== null && (
      questionnaire.completed_at ||
      questionnaire.profile_json ||
      (questionnaire.generated_profile && questionnaire.generated_profile.length > 100) ||
      (questionnaire.answers && typeof questionnaire.answers === 'object' && Object.keys(questionnaire.answers).length > 2)
    );
  }, [questionnaire]);

  const canGenerateCard = useMemo(() => {
    return hasCompletedQuestionnaire && questionnaire?.profile_json !== null;
  }, [hasCompletedQuestionnaire, questionnaire?.profile_json]);

  // 🚀 OPTIMISATION 6: Gestion d'erreur auth optimisée
  const handleAuthError = useCallback(async (error: any): Promise<boolean> => {
    if (error.message === 'Session expired - redirecting to login') {
      if (DEBUG_PROFILE) console.log('🔄 Session expirée détectée, nettoyage...');
      await clearExpiredSession();
      return true;
    }

    if (error.message?.includes('Invalid') || error.message?.includes('expired') || error.message?.includes('token')) {
      if (DEBUG_PROFILE) console.log('🔄 Erreur de token, tentative de rafraîchissement...');

      const refreshSuccess = await refreshSession();
      if (refreshSuccess) {
        if (DEBUG_PROFILE) console.log('✅ Session rafraîchie');
        return false;
      } else {
        if (DEBUG_PROFILE) console.log('❌ Rafraîchissement impossible');
        await clearExpiredSession();
        return true;
      }
    }

    return false;
  }, [clearExpiredSession, refreshSession]);

  // 🚀 OPTIMISATION 7: Chargement de profil avec cache
  const loadProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user) return null;

    const cacheKey = `profile_${user.id}`;
    
    // Vérifier cache d'abord
    const cached = profileCache.get<Profile>(cacheKey);
    if (cached) {
      if (DEBUG_PROFILE) console.log('💾 Profil depuis cache');
      return cached;
    }

    try {
      const profileData = await profileService.getMyProfile();
      profileCache.set(cacheKey, profileData);
      return profileData;
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (isAuthError) throw new Error('AUTH_ERROR');
      throw error;
    }
  }, [user, handleAuthError]);

  // 🚀 OPTIMISATION 8: Chargement questionnaire avec cache
  const loadQuestionnaire = useCallback(async (): Promise<QuestionnaireResponse | null> => {
    if (!user) return null;

    const cacheKey = `questionnaire_${user.id}`;
    
    // Vérifier cache
    const cached = profileCache.get<QuestionnaireResponse>(cacheKey);
    if (cached) {
      if (DEBUG_PROFILE) console.log('💾 Questionnaire depuis cache');
      return cached;
    }

    try {
      const questionnaireData = await profileService.getLatestQuestionnaire();
      profileCache.set(cacheKey, questionnaireData);
      return questionnaireData;
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (isAuthError) throw new Error('AUTH_ERROR');
      
      // Pour le questionnaire, on accepte qu'il n'existe pas
      if (error.message?.includes('not found') || error.status === 404) {
        return null;
      }
      throw error;
    }
  }, [user, handleAuthError]);

  // 🚀 OPTIMISATION 9: Chargement adaptatif (séquentiel vs parallèle)
  const loadInitialData = useCallback(async (isRetry: boolean = false) => {
    if (DEBUG_PROFILE) {
      console.log('🔄 useProfile: Début loadInitialData', {
        user: user?.email,
        isRetry,
        retryCount: retryCountRef.current,
        strategy: getLoadingStrategy()
      });
    }

    if (loadingRef.current && !isRetry) {
      if (DEBUG_PROFILE) console.log('⏳ Chargement déjà en cours');
      return;
    }

    if (!user) {
      if (mountedRef.current) {
        setLoading(false);
      }
      return;
    }

    if (!mountedRef.current) return;

    try {
      loadingRef.current = true;
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const strategy = getLoadingStrategy();
      let profileData: Profile | null = null;
      let questionnaireData: QuestionnaireResponse | null = null;

      if (strategy === 'parallel') {
        // Chargement parallèle pour connexions rapides
        const [profileResult, questionnaireResult] = await Promise.allSettled([
          loadProfile(),
          loadQuestionnaire()
        ]);

        if (profileResult.status === 'fulfilled') {
          profileData = profileResult.value;
        } else if (profileResult.reason?.message !== 'AUTH_ERROR') {
          throw profileResult.reason;
        }

        if (questionnaireResult.status === 'fulfilled') {
          questionnaireData = questionnaireResult.value;
        } else if (questionnaireResult.reason?.message !== 'AUTH_ERROR') {
          // Pour questionnaire, on continue même en cas d'erreur
          if (DEBUG_PROFILE) console.log('ℹ️ Questionnaire non trouvé (normal)');
        }
      } else {
        // Chargement séquentiel pour connexions lentes/mobile
        try {
          profileData = await loadProfile();
        } catch (error) {
          if (error.message === 'AUTH_ERROR') throw error;
          throw new Error('Erreur profil');
        }

        // Délai entre les appels pour ne pas surcharger
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
          questionnaireData = await loadQuestionnaire();
        } catch (error) {
          if (error.message !== 'AUTH_ERROR') {
            if (DEBUG_PROFILE) console.log('ℹ️ Questionnaire non trouvé (normal)');
          }
        }
      }

      if (!mountedRef.current) return;

      // Appliquer les résultats
      if (profileData) {
        setProfile(profileData);
      }
      setQuestionnaire(questionnaireData);
      
      hasInitializedRef.current = true;
      retryCountRef.current = 0;

    } catch (err: any) {
      if (!mountedRef.current) return;

      if (err.message === 'AUTH_ERROR') {
        // Erreur d'auth gérée, ne pas afficher d'erreur
        return;
      }

      // Logique de retry pour erreurs réseau
      if (!isRetry && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        if (DEBUG_PROFILE) console.log(`🔄 Retry ${retryCountRef.current}/${maxRetries} dans 2s`);
        
        setTimeout(() => {
          if (mountedRef.current) {
            loadInitialData(true);
          }
        }, 2000);
        return;
      }

      setError('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, loadProfile, loadQuestionnaire]);

  // 🚀 OPTIMISATION 10: Refresh profile optimisé
  const refreshProfile = useCallback(async () => {
    if (!mountedRef.current || !user) return;

    try {
      setError(null);
      
      // Invalider le cache
      profileCache.invalidate(`profile_${user.id}`);
      
      const profileData = await loadProfile();
      if (mountedRef.current && profileData) {
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
      if (mountedRef.current) {
        setError('Erreur lors du rechargement du profil');
      }
    }
  }, [user, loadProfile]);

  // 🚀 OPTIMISATION 11: Refresh questionnaire optimisé
  const refreshQuestionnaire = useCallback(async () => {
    if (!mountedRef.current || !user) return;

    try {
      setError(null);
      
      // Invalider le cache
      profileCache.invalidate(`questionnaire_${user.id}`);
      
      const questionnaireData = await loadQuestionnaire();
      if (mountedRef.current) {
        setQuestionnaire(questionnaireData);
      }
    } catch (err) {
      console.error('Error refreshing questionnaire:', err);
      if (mountedRef.current) {
        setError('Erreur lors du rechargement du questionnaire');
      }
    }
  }, [user, loadQuestionnaire]);

  // 🚀 OPTIMISATION 12: Update profile optimisé
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!mountedRef.current || !user) return;

    try {
      setError(null);
      const updatedProfile = await profileService.updateMyProfile(updates);
      
      // Mettre à jour le cache
      profileCache.set(`profile_${user.id}`, updatedProfile);
      
      if (mountedRef.current) {
        setProfile(updatedProfile);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      
      const isAuthError = await handleAuthError(err);
      if (!isAuthError && mountedRef.current) {
        setError('Erreur lors de la mise à jour du profil');
        throw err;
      }
    }
  }, [user, handleAuthError]);

  // 🚀 OPTIMISATION 13: Effect principal optimisé
  useEffect(() => {
    if (DEBUG_PROFILE) {
      console.log('🎯 useProfile: useEffect déclenché', {
        user: user?.email,
        authLoading,
        hasInitialized: hasInitializedRef.current
      });
    }

    if (user && !authLoading && !hasInitializedRef.current) {
      if (DEBUG_PROFILE) console.log('✅ Auth prêt, lancement loadInitialData');
      loadInitialData();
    } else if (!user && !authLoading) {
      if (DEBUG_PROFILE) console.log('❌ Pas d\'utilisateur, arrêt loading');
      if (mountedRef.current) {
        setLoading(false);
      }
      hasInitializedRef.current = false;
      retryCountRef.current = 0;
    }
  }, [user?.id, authLoading, loadInitialData]);

  // Nettoyage à la déconnexion
  useEffect(() => {
    if (!user) {
      if (mountedRef.current) {
        setProfile(null);
        setQuestionnaire(null);
        setError(null);
      }
      hasInitializedRef.current = false;
      loadingRef.current = false;
      retryCountRef.current = 0;
      
      // Nettoyer le cache de l'ancien utilisateur
      profileCache.clear();
    }
  }, [user]);

  // Cleanup au démontage
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      if (DEBUG_PROFILE) console.log('🧹 useProfile: Cleanup');
      mountedRef.current = false;
      loadingRef.current = false;
    };
  }, []);

  // 🚀 OPTIMISATION 14: Préchargement intelligent
  useEffect(() => {
    if (hasCompletedQuestionnaire && user) {
      // Précharger les données qui pourraient être demandées
      profileCache.preload(`profile_stats_${user.id}`, 
        () => profileService.getProfileStats?.(user.id),
        'low'
      );
    }
  }, [hasCompletedQuestionnaire, user]);

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

// 🚀 OPTIMISATION 15: Hook stats optimisé
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
        const cacheKey = `profile_stats_${targetUserId}`;
        
        // Vérifier cache d'abord
        const cached = profileCache.get(cacheKey);
        if (cached) {
          setStats(cached);
          setLoading(false);
          return;
        }

        const statsData = await profileService.getProfileStats?.(targetUserId);
        profileCache.set(cacheKey, statsData, 2 * 60 * 1000); // Cache 2 minutes pour stats
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