// src/stores/questionnaireStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types pour les réponses du questionnaire
export interface QuestionnaireAnswers {
  // Step 0 - Identité
  firstName?: string
  age?: number
  gender?: 'homme' | 'femme' | 'non-binaire' | 'autre'
  orientation?: 'hétéro' | 'homo' | 'bi' | 'autre'
  
  // Step 1 - Psychologie
  energySource?: 'solo_time' | 'social_energy' | 'balanced_mix'
  communicationStyle?: 'direct_honest' | 'diplomatic_careful' | 'emotional_expressive' | 'reserved_thoughtful'
  
  // Step 2 - En amour
  lovePriority?: 'emotional_connection' | 'mutual_respect' | 'shared_growth' | 'fun_complicity'
  conflictApproach?: 'address_immediately' | 'cool_down_first' | 'avoid_when_possible' | 'seek_compromise'
  
  // Step 3 - Finalisation
  relationship_learning?: string
  ideal_partner?: string
  free_expression?: string
}

interface QuestionnaireStore {
  answers: QuestionnaireAnswers
  currentStep: number
  totalSteps: number
  
  // Actions
  setAnswer: <K extends keyof QuestionnaireAnswers>(field: K, value: QuestionnaireAnswers[K]) => void
  setMultipleAnswers: (data: Partial<QuestionnaireAnswers>) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  resetQuestionnaire: () => void
  isStepComplete: (step: number) => boolean
  getProgress: () => number
}

export const useQuestionnaireStore = create<QuestionnaireStore>()(
  persist(
    (set, get) => ({
      answers: {},
      currentStep: 0,
      totalSteps: 4,
      
      setAnswer: (field, value) => 
        set((state) => ({
          answers: {
            ...state.answers,
            [field]: value
          }
        })),
      
      setMultipleAnswers: (data) =>
        set((state) => ({
          answers: {
            ...state.answers,
            ...data
          }
        })),
      
      nextStep: () => 
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1)
        })),
      
      previousStep: () => 
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0)
        })),
      
      goToStep: (step) => 
        set(() => ({
          currentStep: Math.max(0, Math.min(step, get().totalSteps - 1))
        })),
      
      resetQuestionnaire: () => 
        set(() => ({
          answers: {},
          currentStep: 0
        })),
      
      isStepComplete: (step) => {
        const { answers } = get()
        switch (step) {
          case 0:
            return !!(answers.firstName && answers.age && answers.gender && answers.orientation)
          case 1:
            return !!(answers.energySource && answers.communicationStyle)
          case 2:
            return !!(answers.lovePriority && answers.conflictApproach)
          case 3:
            // Step 3 est facultatif
            return true
          default:
            return false
        }
      },
      
      getProgress: () => {
        const { currentStep, totalSteps } = get()
        return ((currentStep + 1) / totalSteps) * 100
      }
    }),
    {
      name: 'affinia-questionnaire',
      partialize: (state) => ({ answers: state.answers, currentStep: state.currentStep })
    }
  )
)