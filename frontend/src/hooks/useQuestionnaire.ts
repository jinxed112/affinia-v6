// src/hooks/useQuestionnaire.ts
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { questionnaireService } from '../services/questionnaireService' // ✅ CORRECTION: utiliser questionnaireServiceAlt
import { useQuestionnaireStore } from '../stores/questionnaireStore'
import ProfileExtendedService from '../services/profileExtendedService'

interface SyncResult {
  success: boolean;
  syncedFields: string[];
  error?: string;
}

interface SyncState {
  isLoading: boolean;
  lastSyncResult: SyncResult | null;
}

export const useQuestionnaire = () => {
  const { user } = useAuth()
  const questionnaireStore = useQuestionnaireStore()
  const [hasCompleted, setHasCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [latestResponse, setLatestResponse] = useState(null)
  
  // 🆕 États pour la synchronisation profil
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: false,
    lastSyncResult: null
  });

  useEffect(() => {
    const checkCompletion = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        // Vérifier si l'utilisateur a complété le questionnaire
        const completed = await questionnaireService.hasCompletedQuestionnaire(user.id)
        setHasCompleted(completed)

        // Si complété, récupérer la dernière réponse
        if (completed) {
          const { data } = await questionnaireService.getLatestResponse(user.id)
          setLatestResponse(data)
        }
      } catch (error) {
        console.error('Error checking questionnaire completion:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkCompletion()
  }, [user?.id])

  const startQuestionnaire = () => {
    questionnaireStore.resetQuestionnaire()
    // Navigation gérée par le composant appelant
  }

  const canAccessMatching = () => {
    return hasCompleted && latestResponse?.generated_prompt
  }

  // 🆕 FONCTIONS DE SYNCHRONISATION QUESTIONNAIRE ↔ PROFIL
  
  /**
   * 🔄 Synchronise automatiquement les données du questionnaire vers le profil
   */
  const syncToProfile = useCallback(async (answers: any): Promise<SyncResult> => {
    if (!user?.id) {
      console.warn('⚠️ Pas d\'utilisateur pour la synchronisation');
      const result: SyncResult = {
        success: false,
        syncedFields: [],
        error: 'Utilisateur non connecté'
      };
      setSyncState({ isLoading: false, lastSyncResult: result });
      return result;
    }

    setSyncState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('🔄 Hook: Début synchronisation questionnaire → profil');
      console.log('📋 Données questionnaire à synchroniser:', answers);
      
      const syncResult = await ProfileExtendedService.syncQuestionnaireToProfile(user.id, answers);
      
      const result: SyncResult = {
        success: syncResult.success,
        syncedFields: syncResult.syncedFields
      };
      
      setSyncState({ isLoading: false, lastSyncResult: result });
      
      if (syncResult.success && syncResult.syncedFields.length > 0) {
        console.log(`✅ Hook: Synchronisation réussie (${syncResult.syncedFields.join(', ')})`);
      } else if (syncResult.success) {
        console.log('ℹ️ Hook: Synchronisation réussie (aucune donnée à synchroniser)');
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Hook: Erreur synchronisation:', error);
      
      const result: SyncResult = {
        success: false,
        syncedFields: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      
      setSyncState({ isLoading: false, lastSyncResult: result });
      return result;
    }
  }, [user?.id]);

  /**
   * 🔍 Vérifie si une synchronisation est recommandée
   */
  const checkSyncRecommendation = useCallback(async (profile: any, questionnaire: any) => {
    if (!questionnaire?.answers) {
      return { shouldSync: false, reasons: [], suggestedUpdates: {} };
    }

    return ProfileExtendedService.shouldSyncFromQuestionnaire(profile, questionnaire);
  }, []);

  /**
   * 🤖 Synchronise automatiquement si recommandé
   */
  const autoSyncIfRecommended = useCallback(async (
    profile: any, 
    questionnaire: any
  ): Promise<SyncResult | null> => {
    const recommendation = await checkSyncRecommendation(profile, questionnaire);
    
    if (recommendation.shouldSync && recommendation.suggestedUpdates) {
      console.log('🤖 Auto-sync recommandé:', recommendation.reasons);
      return await syncToProfile(questionnaire.answers);
    }
    
    return null;
  }, [checkSyncRecommendation, syncToProfile]);

  /**
   * 🔄 Force une synchronisation complète
   */
  const forceSyncToProfile = useCallback(async (answers: any): Promise<SyncResult> => {
    console.log('🔄 Force sync déclenché');
    return await syncToProfile(answers);
  }, [syncToProfile]);

  /**
   * 🎯 Synchronise seulement certains champs
   */
  const syncSpecificFields = useCallback(async (
    answers: any,
    fieldsToSync: Array<'firstName' | 'age' | 'gender'>
  ): Promise<SyncResult> => {
    if (!user?.id) {
      return {
        success: false,
        syncedFields: [],
        error: 'Utilisateur non connecté'
      };
    }

    setSyncState(prev => ({ ...prev, isLoading: true }));

    try {
      const filteredAnswers: any = {};
      
      fieldsToSync.forEach(field => {
        if (answers[field] !== undefined) {
          filteredAnswers[field] = answers[field];
        }
      });

      console.log('🎯 Synchronisation champs spécifiques:', fieldsToSync, filteredAnswers);
      
      const syncResult = await ProfileExtendedService.syncQuestionnaireToProfile(
        user.id, 
        filteredAnswers
      );
      
      const result: SyncResult = {
        success: syncResult.success,
        syncedFields: syncResult.syncedFields
      };
      
      setSyncState({ isLoading: false, lastSyncResult: result });
      return result;
      
    } catch (error) {
      console.error('❌ Hook: Erreur synchronisation champs spécifiques:', error);
      
      const result: SyncResult = {
        success: false,
        syncedFields: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      
      setSyncState({ isLoading: false, lastSyncResult: result });
      return result;
    }
  }, [user?.id]);

  /**
   * 🧹 Reset l'état de synchronisation
   */
  const resetSyncState = useCallback(() => {
    setSyncState({
      isLoading: false,
      lastSyncResult: null
    });
  }, []);

  /**
   * 🔄 Fonction complète pour finaliser le questionnaire avec synchronisation
   */
  const completeQuestionnaireWithSync = useCallback(async (answers: any): Promise<{
    questionnaireSuccess: boolean;
    syncResult: SyncResult;
    error?: string;
  }> => {
    if (!user?.id) {
      return {
        questionnaireSuccess: false,
        syncResult: { success: false, syncedFields: [], error: 'Utilisateur non connecté' }
      };
    }

    try {
      console.log('🎯 Finalisation complète du questionnaire avec synchronisation');
      
      // 1. Sauvegarder le questionnaire
      const questionnaireResult = await questionnaireService.saveResponses(user.id, answers);
      
      if (!questionnaireResult.success) {
        return {
          questionnaireSuccess: false,
          syncResult: { success: false, syncedFields: [], error: 'Erreur sauvegarde questionnaire' }
        };
      }

      // 2. Synchroniser vers le profil
      const syncResult = await syncToProfile(answers);

      // 3. Mettre à jour l'état local
      setHasCompleted(true);
      setLatestResponse(questionnaireResult.data);

      return {
        questionnaireSuccess: true,
        syncResult
      };

    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:', error);
      return {
        questionnaireSuccess: false,
        syncResult: { 
          success: false, 
          syncedFields: [], 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        }
      };
    }
  }, [user?.id, syncToProfile]);

  /**
   * 📊 Obtient les statistiques de synchronisation
   */
  const getSyncStats = useCallback(() => {
    return {
      hasLatestResponse: !!latestResponse,
      lastSyncResult: syncState.lastSyncResult,
      isSyncing: syncState.isLoading,
      canSync: !!user?.id && !!latestResponse?.answers
    };
  }, [latestResponse, syncState, user?.id]);

  return {
    // 🔄 États existants
    hasCompleted,
    isLoading,
    latestResponse,
    
    // 🔄 Fonctions existantes
    startQuestionnaire,
    canAccessMatching,
    
    // 🆕 Nouveaux états de synchronisation
    isSyncing: syncState.isLoading,
    lastSyncResult: syncState.lastSyncResult,
    
    // 🆕 Nouvelles fonctions de synchronisation
    syncToProfile,
    forceSyncToProfile,
    syncSpecificFields,
    checkSyncRecommendation,
    autoSyncIfRecommended,
    resetSyncState,
    completeQuestionnaireWithSync,
    getSyncStats,
    
    // 🔄 Store du questionnaire (spread)
    ...questionnaireStore
  }
}