// src/components/questionnaire/Step1Psychology.tsx
import React, { useState } from 'react'
import { useQuestionnaireStore } from '../../stores/questionnaireStore'
import { useDesignSystem } from '../../styles/designSystem'
import { BaseComponents } from '../ui/BaseComponents'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface Step1PsychologyProps {
  isDarkMode: boolean
}

const Step1Psychology: React.FC<Step1PsychologyProps> = ({ isDarkMode }) => {
  const { answers, setAnswer, nextStep, previousStep } = useQuestionnaireStore()
  const designSystem = useDesignSystem(isDarkMode)
  
  const [localData, setLocalData] = useState({
    energySource: answers.energySource || '',
    communicationStyle: answers.communicationStyle || ''
  })

  const [currentQuestion, setCurrentQuestion] = useState(0)

  const handleSubmit = () => {
    if (localData.energySource && localData.communicationStyle) {
      setAnswer('energySource', localData.energySource as any)
      setAnswer('communicationStyle', localData.communicationStyle as any)
      
      nextStep()
    }
  }

  const energyOptions = [
    { 
      value: 'solo_time', 
      label: 'Plutôt seul(e)', 
      icon: '🧘', 
      color: 'from-blue-500 to-indigo-600',
      description: 'Tu recharges tes batteries dans le calme et la solitude'
    },
    { 
      value: 'social_energy', 
      label: 'Avec les autres', 
      icon: '🎉', 
      color: 'from-orange-500 to-red-500',
      description: 'L\'énergie des autres te booste et te ressource'
    },
    { 
      value: 'balanced_mix', 
      label: 'Les deux selon le moment', 
      icon: '⚖️', 
      color: 'from-purple-500 to-pink-500',
      description: 'Tu navigues entre moments sociaux et temps pour toi'
    }
  ]

  const communicationOptions = [
    { 
      value: 'direct_honest', 
      label: 'Direct et franc(he)', 
      icon: '🎯', 
      color: 'from-red-500 to-orange-500',
      description: 'Tu dis ce que tu penses sans détour'
    },
    { 
      value: 'diplomatic_careful', 
      label: 'Diplomate et prudent(e)', 
      icon: '🤝', 
      color: 'from-green-500 to-emerald-500',
      description: 'Tu choisis tes mots avec soin'
    },
    { 
      value: 'emotional_expressive', 
      label: 'Expressif(ve) et émotionnel(le)', 
      icon: '💫', 
      color: 'from-pink-500 to-purple-500',
      description: 'Tes émotions guident ta communication'
    },
    { 
      value: 'reserved_thoughtful', 
      label: 'Réservé(e) mais réfléchi(e)', 
      icon: '🤔', 
      color: 'from-indigo-500 to-blue-500',
      description: 'Tu observes et réfléchis avant de parler'
    }
  ]

  const questions = [
    {
      title: "Comment tu te ressources ?",
      subtitle: "Après une longue journée, qu'est-ce qui te fait du bien ?",
      emoji: "🔋",
      field: 'energySource',
      options: energyOptions
    },
    {
      title: "Comment tu t'exprimes ?",
      subtitle: "Quel est ton style de communication naturel ?",
      emoji: "💬",
      field: 'communicationStyle',
      options: communicationOptions
    }
  ]

  const currentQ = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const canContinue = localData[currentQ.field as keyof typeof localData]

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Card principale */}
      <BaseComponents.Card 
        isDarkMode={isDarkMode} 
        variant="highlighted"
        className="p-8 relative overflow-hidden"
      >
        {/* Particules thématiques */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-float" />
          <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400/30 rounded-full animate-float delay-100" />
          <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-pink-400/30 rounded-full animate-float delay-200" />
          <div className="absolute bottom-10 right-10 w-1 h-1 bg-green-400/30 rounded-full animate-float delay-300" />
        </div>
        
        {/* Progress indicator pour les questions */}
        <div className="flex justify-center gap-3 mb-8">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`
                h-2 rounded-full transition-all duration-500
                ${index === currentQuestion 
                  ? 'w-16 bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse' 
                  : index < currentQuestion
                  ? 'w-16 bg-gradient-to-r from-purple-500 to-pink-500'
                  : `w-16 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`
                }
              `}
            />
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="text-6xl mb-4 animate-bounce-gentle">{currentQ.emoji}</div>
          <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentQ.title}
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {currentQ.subtitle}
          </p>
          <div className="mt-4 flex justify-center">
            <div className="w-20 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Options */}
        <div className={`grid gap-4 mb-8 relative z-10 ${
          currentQ.options.length > 3 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}>
          {currentQ.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocalData({ ...localData, [currentQ.field]: option.value })}
              className={`
                group p-6 rounded-xl backdrop-blur-sm text-left border-2 transition-all duration-300 transform hover:scale-105
                ${localData[currentQ.field as keyof typeof localData] === option.value
                  ? `bg-gradient-to-r ${option.color} border-white/30 shadow-lg shadow-purple-500/30 scale-105`
                  : `${designSystem.cardBackground} ${designSystem.border} hover:border-purple-400`
                }
              `}
            >
              <div className="flex items-start gap-4">
                <span className={`text-4xl flex-shrink-0 transition-all duration-300 ${
                  localData[currentQ.field as keyof typeof localData] === option.value 
                    ? 'animate-bounce-gentle' 
                    : 'group-hover:scale-110'
                }`}>
                  {option.icon}
                </span>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    localData[currentQ.field as keyof typeof localData] === option.value 
                      ? 'text-white' 
                      : isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </h3>
                  <p className={`text-sm ${
                    localData[currentQ.field as keyof typeof localData] === option.value 
                      ? 'text-white/90' 
                      : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {option.description}
                  </p>
                </div>
                {/* Indicateur de sélection */}
                {localData[currentQ.field as keyof typeof localData] === option.value && (
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce-gentle">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Encouragement */}
        <div className="text-center mb-6">
          {canContinue && (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-pulse flex items-center justify-center gap-2`}>
              <span className="text-green-400">✨</span>
              {isLastQuestion ? 'Prêt pour l\'amour !' : 'Parfait ! Question suivante...'}
            </p>
          )}
        </div>

        {/* Boutons de navigation */}
        <div className="flex gap-4 relative z-10">
          <BaseComponents.Button
            variant="secondary"
            size="medium"
            onClick={() => currentQuestion > 0 ? setCurrentQuestion(currentQuestion - 1) : previousStep()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </BaseComponents.Button>
          
          <BaseComponents.Button
            variant="primary"
            size="large"
            onClick={handleNext}
            disabled={!canContinue}
            className={`flex-1 transition-all duration-500 ${
              canContinue ? 'animate-pulse-glow' : ''
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {isLastQuestion ? (
                <>
                  <span className="animate-bounce-gentle">💖</span>
                  Continuer vers l'amour
                  <span className="text-yellow-300">+50 XP</span>
                </>
              ) : (
                <>
                  <span>Question suivante</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </span>
          </BaseComponents.Button>
        </div>

        {/* Indicateur d'étape */}
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${designSystem.cardBackground} ${designSystem.border}`}>
            <span className="text-purple-400">🧠</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Étape 2/4 - Psychologie ({currentQuestion + 1}/{questions.length})
            </span>
          </div>
        </div>
      </BaseComponents.Card>
    </div>
  )
}

export default Step1Psychology