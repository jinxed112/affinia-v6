// src/components/questionnaire/Step1Psychology.tsx
import React, { useState, useEffect } from 'react'
import { useQuestionnaireStore } from '../../stores/questionnaireStore'
import { useDesignSystem } from '../../styles/designSystem'
import { BaseComponents } from '../ui/BaseComponents'

interface Step1PsychologyProps {
  isDarkMode: boolean
  onAutoNext?: () => void // Callback pour auto-passage
  isTransitioning?: boolean
}

const Step1Psychology: React.FC<Step1PsychologyProps> = ({ 
  isDarkMode, 
  onAutoNext, 
  isTransitioning = false 
}) => {
  const { answers, setAnswer } = useQuestionnaireStore()
  const designSystem = useDesignSystem(isDarkMode)
  
  const [localData, setLocalData] = useState({
    energySource: answers.energySource || '',
    communicationStyle: answers.communicationStyle || ''
  })

  const [currentQuestion, setCurrentQuestion] = useState(0)

  // Auto-save des réponses
  useEffect(() => {
    if (localData.energySource) {
      setAnswer('energySource', localData.energySource as any)
    }
  }, [localData.energySource])

  useEffect(() => {
    if (localData.communicationStyle) {
      setAnswer('communicationStyle', localData.communicationStyle as any)
    }
  }, [localData.communicationStyle])

  // 🆕 Auto-passage quand toutes les réponses sont complètes
  useEffect(() => {
    const isComplete = localData.energySource && localData.communicationStyle

    if (isComplete && onAutoNext && !isTransitioning) {
      setTimeout(() => {
        onAutoNext()
      }, 1000) // Délai pour voir le message de complétion
    }
  }, [localData, onAutoNext, isTransitioning])

  const energyOptions = [
    { 
      value: 'solo_time', 
      label: 'Plutôt seul(e)', 
      icon: '🧘', 
      color: 'from-blue-500 to-indigo-600',
      description: 'Tu recharges tes batteries dans le calme'
    },
    { 
      value: 'social_energy', 
      label: 'Avec les autres', 
      icon: '🎉', 
      color: 'from-orange-500 to-red-500',
      description: 'L\'énergie des autres te booste'
    },
    { 
      value: 'balanced_mix', 
      label: 'Les deux selon le moment', 
      icon: '⚖️', 
      color: 'from-purple-500 to-pink-500',
      description: 'Tu navigues entre les deux'
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
      description: 'Tu observes avant de parler'
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
  const hasAnsweredCurrent = localData[currentQ.field as keyof typeof localData]
  const canNavigateToNext = hasAnsweredCurrent && !isLastQuestion

  // Auto-avancement vers la question suivante après réponse (logique interne conservée)
  useEffect(() => {
    if (hasAnsweredCurrent && !isLastQuestion) {
      const timer = setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 800) // Délai pour montrer la validation
      
      return () => clearTimeout(timer)
    }
  }, [hasAnsweredCurrent, isLastQuestion, currentQuestion])

  const isComplete = localData.energySource && localData.communicationStyle

  return (
    <div className={`space-y-6 transition-all duration-200 ${
      isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
    }`}>
      {/* Progress indicator pour les sous-questions */}
      <div className="flex justify-center gap-2 mb-6">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`
              h-2 w-8 rounded-full transition-all duration-500
              ${index === currentQuestion 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                : index < currentQuestion
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : `${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`
              }
            `}
          />
        ))}
      </div>

      {/* Question actuelle */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-3 animate-bounce-gentle">{currentQ.emoji}</div>
        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {currentQ.title}
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {currentQ.subtitle}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {currentQ.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocalData({ ...localData, [currentQ.field]: option.value })}
            className={`
              w-full group p-4 rounded-xl backdrop-blur-sm text-left border-2 transition-all duration-300 transform hover:scale-105
              ${localData[currentQ.field as keyof typeof localData] === option.value
                ? `bg-gradient-to-r ${option.color} border-white/30 shadow-lg shadow-purple-500/30 scale-105`
                : `${designSystem.cardBackground} ${designSystem.border} hover:border-purple-400`
              }
            `}
          >
            <div className="flex items-center gap-4">
              <span className={`text-3xl flex-shrink-0 transition-all duration-300 ${
                localData[currentQ.field as keyof typeof localData] === option.value 
                  ? 'animate-bounce-gentle' 
                  : 'group-hover:scale-110'
              }`}>
                {option.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold mb-1 ${
                  localData[currentQ.field as keyof typeof localData] === option.value 
                    ? 'text-white' 
                    : isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {option.label}
                </h4>
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

      {/* Navigation manuelle entre questions (optionnelle) */}
      {questions.length > 1 && (
        <div className="flex justify-center gap-4 pt-4">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              disabled={index > currentQuestion && !localData[questions[index - 1]?.field as keyof typeof localData]}
              className={`
                w-8 h-8 rounded-full text-sm font-bold transition-all duration-300
                ${index === currentQuestion
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white scale-110'
                  : index < currentQuestion 
                  ? 'bg-green-500 text-white hover:scale-105'
                  : localData[questions[index - 1]?.field as keyof typeof localData]
                  ? `${designSystem.cardBackground} ${designSystem.border} hover:scale-105`
                  : 'opacity-50 cursor-not-allowed'
                }
              `}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Message d'encouragement */}
      {hasAnsweredCurrent && (
        <BaseComponents.Card isDarkMode={isDarkMode} variant="glass" className="p-4">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <span className="animate-bounce-gentle">✨</span>
            <span className="text-sm font-medium">
              {isLastQuestion 
                ? 'Parfait ! Prêt pour l\'étape suivante' 
                : canNavigateToNext 
                ? 'Excellente réponse ! Question suivante...'
                : 'Super choix !'
              }
            </span>
          </div>
        </BaseComponents.Card>
      )}

      {/* Indicateur de completion global */}
      {isComplete && (
        <BaseComponents.Card isDarkMode={isDarkMode} variant="highlighted" className="p-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl animate-bounce-gentle">🧠</span>
            <div className="text-center">
              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Psychologie complète !
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {onAutoNext && !isTransitioning 
                  ? 'Passage automatique à l\'amour ❤️'
                  : 'Passons à l\'amour ❤️'
                }
              </p>
            </div>
          </div>
        </BaseComponents.Card>
      )}
    </div>
  )
}

export default Step1Psychology