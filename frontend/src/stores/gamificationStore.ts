import { create } from 'zustand';
import { gamificationService } from '../services/gamificationService';

interface GamificationStore {
  // État
  hasUnlockedCard: boolean;
  hasCompletedProfile: boolean;
  hasUploadedPhoto: boolean;
  hasCompletedQuestionnaire: boolean;
  
  // Actions
  setCardUnlocked: (unlocked: boolean) => void;
  setProfileCompleted: (completed: boolean) => void;
  setPhotoUploaded: (uploaded: boolean) => void;
  setQuestionnaireCompleted: (completed: boolean) => void;
  
  // Fonctions utilitaires
  shouldShowGrayCard: () => boolean;
  getCompletionCount: () => number;
  
  // Actions asynchrones
  validateProfileCompletion: () => Promise<void>;
  validatePhotoUpload: () => Promise<void>;
  validateQuestionnaireCompletion: () => Promise<void>;
}

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  // État initial
  hasUnlockedCard: false,
  hasCompletedProfile: false,
  hasUploadedPhoto: false,
  hasCompletedQuestionnaire: false,

  // Actions simples
  setCardUnlocked: (unlocked) => set({ hasUnlockedCard: unlocked }),
  setProfileCompleted: (completed) => set({ hasCompletedProfile: completed }),
  setPhotoUploaded: (uploaded) => set({ hasUploadedPhoto: uploaded }),
  setQuestionnaireCompleted: (completed) => set({ hasCompletedQuestionnaire: completed }),

  // Fonctions utilitaires
  shouldShowGrayCard: () => {
    const state = get();
    return !(state.hasCompletedProfile && state.hasUploadedPhoto && state.hasCompletedQuestionnaire);
  },

  getCompletionCount: () => {
    const state = get();
    let count = 0;
    if (state.hasCompletedProfile) count++;
    if (state.hasUploadedPhoto) count++;
    if (state.hasCompletedQuestionnaire) count++;
    return count;
  },

  // Actions asynchrones pour valider et compléter les quêtes
  validateProfileCompletion: async () => {
    try {
      await gamificationService.validateQuestCompletion('profile_updated');
      set({ hasCompletedProfile: true });
    } catch (error) {
      console.error('Validate profile completion error:', error);
    }
  },

  validatePhotoUpload: async () => {
    try {
      await gamificationService.validateQuestCompletion('photo_uploaded');
      set({ hasUploadedPhoto: true });
    } catch (error) {
      console.error('Validate photo upload error:', error);
    }
  },

  validateQuestionnaireCompletion: async () => {
    try {
      await gamificationService.validateQuestCompletion('questionnaire_completed');
      set({ hasCompletedQuestionnaire: true });
    } catch (error) {
      console.error('Validate questionnaire completion error:', error);
    }
  }
}));