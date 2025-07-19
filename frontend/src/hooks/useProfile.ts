// src/hooks/useProfile.ts
import { useState, useEffect } from 'react';
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
  const { user, loading: authLoading } = useAuth(); // ← Récupérer aussi le loading de l'AuthContext
  const [profile, setProfile] = useState<Profile | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Charger les données initiales
  const loadInitialData = async () => {
    console.log('🔄 useProfile: Début loadInitialData', { user: user?.email });
    
    if (!user) {
      console.log('❌ useProfile: Pas d\'utilisateur, arrêt');
      setLoading(false);
      return;
    }

    try {
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

      // Gérer le profil
      if (profileData.status === 'fulfilled') {
        console.log('✅ useProfile: Profil chargé:', profileData.value);
        setProfile(profileData.value);
      } else {
        console.error('❌ useProfile: Erreur profil:', profileData.reason);
        setError('Erreur lors du chargement du profil');
      }

      // Gérer le questionnaire (peut être null)
      if (questionnaireData.status === 'fulfilled') {
        console.log('✅ useProfile: Questionnaire chargé:', questionnaireData.value);
        setQuestionnaire(questionnaireData.value);
      } else {
        console.error('❌ useProfile: Erreur questionnaire:', questionnaireData.reason);
        // Ne pas considérer comme une erreur si pas de questionnaire
        setQuestionnaire(null);
      }

    } catch (err) {
      console.error('💥 useProfile: Erreur globale:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      console.log('🏁 useProfile: Fin loadInitialData, setting loading to false');
      setLoading(false);
    }
  };

  // Recharger le profil
  const refreshProfile = async () => {
    try {
      setError(null);
      const profileData = await profileService.getMyProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError('Erreur lors du rechargement du profil');
    }
  };

  // Recharger le questionnaire
  const refreshQuestionnaire = async () => {
    try {
      setError(null);
      const questionnaireData = await profileService.getLatestQuestionnaire();
      setQuestionnaire(questionnaireData);
    } catch (err) {
      console.error('Error refreshing questionnaire:', err);
      setError('Erreur lors du rechargement du questionnaire');
    }
  };

  // Mettre à jour le profil
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setError(null);
      const updatedProfile = await profileService.updateMyProfile(updates);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Erreur lors de la mise à jour du profil');
      throw err; // Re-throw pour que le composant puisse gérer l'erreur
    }
  };

  // Effect pour charger les données initiales
  useEffect(() => {
    console.log('🎯 useProfile: useEffect déclenché', { 
      user: user?.email, 
      authLoading: authLoading,
      hasUser: !!user 
    });
    
    // ✅ Attendre que l'AuthContext soit prêt ET qu'on ait un utilisateur
    if (user && !authLoading) {
      console.log('✅ useProfile: Auth prêt, lancement loadInitialData');
      loadInitialData();
    } else {
      console.log('⏳ useProfile: En attente auth...', { 
        hasUser: !!user, 
        authLoading: authLoading 
      });
      
      // Si pas d'utilisateur et auth terminé, on arrête le loading
      if (!user && !authLoading) {
        console.log('❌ useProfile: Pas d\'utilisateur après auth, arrêt loading');
        setLoading(false);
      }
    }
  }, [user, authLoading]); // ← Dépendances : user ET authLoading

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