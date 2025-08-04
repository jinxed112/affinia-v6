// src/components/questionnaire/Step2Love.tsx
import React, { useState, useEffect } from 'react'
import { useQuestionnaireStore } from '../../stores/questionnaireStore'
import { useDesignSystem } from '../../styles/designSystem'
import { BaseComponents } from '../ui/BaseComponents'

interface Step2LoveProps {
  isDarkMode: boolean
}

const Step2Love: React.FC<Step2LoveProps> = ({ isDarkMode }) => {
  const { answers, setAnswer } = useQuestionnaireStore()
  const designSystem = useDesignSystem(isDarkMode)
  
  const [localData, setLocalData] = useState({
    lovePriority: answers.lovePriority || '',
    conflictApproach: answers.conflictApproach || ''
  })

  const [currentQuestion, setCurrentQuestion] = useState(0)

  // Auto-save des réponses
  useEffect(() => {
    if (localData.lovePriority) {
      setAnswer('lovePriority', localData.lovePriority as any)
    }
  }, [localData.lovePriority])

  useEffect(() => {
    if (localData.conflictApproach) {
      setAnswer('conflictApproach', localData.conflictApproach as any)
    }
  }, [localData.conflictApproach])

  const lovePriorityOptions = [
    { 
      value: 'emotional_connection', 
      label: 'Connexion émotionnelle', 
      icon: '🌊', 
      color: 'from-blue-500 to-cyan-500',
      description: 'Cette bulle où on se comprend sans mots',
      quote: 'L\'âme qui parle à l\'âme'
    },
    { 
      value: 'mutual_respect', 
      label: 'Respect mutuel', 
      icon: '🤲', 
      color: 'from-green-500 to-emerald-500',
      description: 'La base solide pour construire ensemble',
      quote: 'Le fondement de tout amour durable'
    },
    { 
      value: 'shared_growth', 
      label: 'Évolution ensemble', 
      icon: '🌱', 
      color: 'from-purple-500 to-indigo-500',
      description: 'Grandir côte à côte, se pousser vers le haut',
      quote: 'Devenir meilleur grâce à l\'autre'
    },
    { 
      value: 'fun_complicity', 
      label: 'Complicité et fun', 
      icon: '✨', 
      color: 'from-yellow-400 to-orange-500',
      description: 'Rire ensemble, c\'est la meilleure thérapie',
      quote: 'La joie partagée est un bonheur double'
    }
  ]

  const conflictOptions = [
    { 
      value: 'address_immediately', 
      label: 'Je dis tout directement', 
      icon: '💥', 
      color: 'from-red-500 to-pink-500',
      description: 'Mieux vaut crever l\'abcès tout de suite',
      quote: 'La vérité libère, même si elle fait mal'
    },
    { 
      value: 'cool_down_first', 
      label: 'Je me calme d\'abord', 
      icon: '🌬️', 
      color: 'from-blue-500 to-indigo-500',
      description: 'Un peu de recul pour mieux se comprendre',
      quote: 'La tempête passe, la sagesse reste'
    },
    { 
      value: 'avoid_when_possible', 
      label: 'J\'évite si c\'est pas grave', 
      icon: '🕊️', 
      color: 'from-green-500 to-teal-500',
      description: 'Certaines batailles ne valent pas la peine',
      quote: 'Choisir ses combats, c\'est choisir sa paix'
    },
    { 
      value: 'seek_compromise', 
      label: 'Je cherche un compromis', 
      icon: '🤝', 
      color: 'from-purple-500 to-violet-500',
      description: 'On peut toujours trouver un terrain d\'entente',
      quote: 'L\'amour, c\'est l\'art du compromis'
    }
  ]

  const questions = [
    {
      title: "Qu'est-ce qui compte le plus ?",
      subtitle: "Dans une relation, ton ingrédient secret c'est...",
      emoji: "💕",
      field: 'lovePriority',
      options: lovePriorityOptions
    },
    {
      title: "Face aux conflits, tu fais quoi ?",
      subtitle: "Même les plus beaux couples se disputent parfois",
      emoji: "🌪️",
      field: 'conflictApproach',
      options: conflictOptions
    }
  ]

  const currentQ = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1
  const hasAnsweredCurrent = localData[currentQ.field as keyof typeof localData]

  // Auto-avancement vers la question suivante
  useEffect(() => {
    if (hasAnsweredCurrent && !isLastQuestion) {
      const timer = setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 1000) // Un peu plus long pour laisser lire la citation
      
      return () => clearTimeout(timer)
    }
  }, [hasAnsweredCurrent, isLastQuestion, currentQuestion])

  return (
    <div className="space-y-6">
      {/* Progress indicator pour les sous-questions */}
      <div className="flex justify-center gap-2 mb-6">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`
              h-2 w-8 rounded-full transition-all duration-500
              ${index === currentQuestion 
                ? 'bg-gradient-to-r from-pink-600 to-red-600' 
                : index < currentQuestion
                ? 'bg-gradient-to-r from-pink-500 to-red-500'
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
                ? `bg-gradient-to-r ${option.color} border-white/30 shadow-lg shadow-pink-500/30 scale-105`
                : `${designSystem.cardBackground} ${designSystem.border} hover:border-pink-400`
              }
            `}
          >
            <div className="flex items-start gap-4">
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
                <p className={`text-sm mb-2 ${
                  localData[currentQ.field as keyof typeof localData] === option.value 
                    ? 'text-white/90' 
                    : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {option.description}
                </p>
                <p className={`text-xs italic ${
                  localData[currentQ.field as keyof typeof localData] === option.value 
                    ? 'text-white/80' 
                    : 'text-pink-400'
                }`}>
                  "{option.quote}"
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

      {/* Navigation manuelle entre questions */}
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
                  ? 'bg-gradient-to-r from-pink-600 to-red-600 text-white scale-110'
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

      {/* Citation d'amour inspirante */}
      {hasAnsweredCurrent && (
        <BaseComponents.Card isDarkMode={isDarkMode} variant="glass" className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-pink-400 mb-2">
              <span className="animate-bounce-gentle">💝</span>
              <span className="text-sm font-medium">
                {isLastQuestion 
                  ? 'Ton profil amoureux prend forme...' 
                  : 'Excellent choix ! Continue...'
                }
              </span>
            </div>
            {/* Citation de l'option sélectionnée */}
            {localData[currentQ.field as keyof typeof localData] && (
              <p className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                "{currentQ.options.find(opt => opt.value === localData[currentQ.field as keyof typeof localData])?.quote}"
              </p>
            )}
          </div>
        </BaseComponents.Card>
      )}

      {/* Indicateur de completion global */}
      {localData.lovePriority && localData.conflictApproach && (
        <BaseComponents.Card isDarkMode={isDarkMode} variant="highlighted" className="p-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl animate-bounce-gentle">💖</span>
            <div className="text-center">
              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Profil amoureux complété !
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Finalisons ton questionnaire ✨
              </p>
            </div>
          </div>
        </BaseComponents.Card>
      )}
    </div>
  )
}

export default Step2Love