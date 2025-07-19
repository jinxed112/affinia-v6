import { useState, useEffect } from 'react';
import { gamificationService, UserQuest, Quest } from '../services/gamificationService';

export interface GamificationData {
  quests: UserQuest[];
  questProgress: {
    total_quests: number;
    completed_quests: number;
    completion_percentage: number;
    next_quest?: Quest;
  } | null;
  xpHistory: any[];
  loading: boolean;
  error: string | null;
}

export const useGamification = () => {
  const [data, setData] = useState<GamificationData>({
    quests: [],
    questProgress: null,
    xpHistory: [],
    loading: true,
    error: null
  });

  const loadGamificationData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [quests, progress, history] = await Promise.all([
        gamificationService.getUserQuests(),
        gamificationService.getQuestProgress(),
        gamificationService.getXpHistory(5)
      ]);

      setData({
        quests,
        questProgress: progress,
        xpHistory: history,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Load gamification data error:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Impossible de charger les données de progression'
      }));
    }
  };

  const completeQuest = async (questType: string) => {
    try {
      const result = await gamificationService.completeQuest(questType);
      
      if (result.success) {
        // Recharger les données après completion
        await loadGamificationData();
        
        // Déclencher un événement pour mettre à jour d'autres composants
        window.dispatchEvent(new CustomEvent('questCompleted', { detail: result }));
      }
      
      return result;
    } catch (error) {
      console.error('Complete quest error:', error);
      throw error;
    }
  };

  const validateAction = async (action: 'profile_updated' | 'photo_uploaded' | 'questionnaire_completed') => {
    try {
      await gamificationService.validateQuestCompletion(action);
      // Recharger les données après validation
      await loadGamificationData();
    } catch (error) {
      console.error('Validate action error:', error);
    }
  };

  const getQuestByType = (type: string): UserQuest | undefined => {
    return data.quests.find(q => q.quest?.type === type);
  };

  const isQuestCompleted = (type: string): boolean => {
    const quest = getQuestByType(type);
    return quest?.completed || false;
  };

  const getCompletedQuests = (): UserQuest[] => {
    return data.quests.filter(q => q.completed);
  };

  const getPendingQuests = (): UserQuest[] => {
    return data.quests.filter(q => !q.completed);
  };

  const getQuestCompletionCount = (): number => {
    return getCompletedQuests().length;
  };

  const areMainQuestsCompleted = (): boolean => {
    return isQuestCompleted('profile') && 
           isQuestCompleted('photo') && 
           isQuestCompleted('questionnaire');
  };

  useEffect(() => {
    loadGamificationData();

    // Écouter les événements de completion de quête
    const handleQuestCompleted = () => {
      loadGamificationData();
    };

    window.addEventListener('questCompleted', handleQuestCompleted);
    return () => window.removeEventListener('questCompleted', handleQuestCompleted);
  }, []);

  return {
    ...data,
    completeQuest,
    validateAction,
    getQuestByType,
    isQuestCompleted,
    getCompletedQuests,
    getPendingQuests,
    getQuestCompletionCount,
    areMainQuestsCompleted,
    refreshData: loadGamificationData
  };
};