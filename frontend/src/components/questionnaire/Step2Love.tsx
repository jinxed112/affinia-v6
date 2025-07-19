// src/components/questionnaire/Step2Love.tsx
import React, { useState } from 'react'
import { useQuestionnaireStore } from '../../stores/questionnaireStore'
import { useDesignSystem } from '../../styles/designSystem'
import { BaseComponents } from '../ui/BaseComponents'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface Step2LoveProps {
  isDarkMode: boolean
}

const Step2Love: React.FC<Step2LoveProps> = ({ isDarkMode }) => {
  const { answers, setAnswer, nextStep, previousStep } = useQuestionnaireStore()
  const designSystem = useDesignSystem(isDarkMode)
  
  const [localData, setLocalData] = useState({
    lovePriority: answers.lovePriority || '',
    conflictApproach: answers.conflictApproach || ''
  })

  const [currentQuestion, setCurrentQuestion] = useState(0)

  const handleSubmit = () => {
    if (localData.lovePriority && localData.conflictApproach) {
      setAnswer('lovePriority', localData.lovePriority as any)
      setAnswer('conflictApproach', localData.conflictApproach as any)
      
      nextStep()
    }
  }

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
      description: 'Rire ensemble, c\'est la meilleure des thérapies',
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
      label: 'Je préfère me calmer d\'abord', 
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
      title: "Qu'est-ce qui compte le plus pour toi ?",
      subtitle: "Dans une relation, ton ingrédient secret c'est...",
      emoji: "💕",
      field: 'lovePriority',
      options: lovePriorityOptions
    },
    {
      title: "Face aux conflits, tu fais quoi ?",
      subtitle: "Parce que oui, même les plus beaux couples se disputent parfois",
      emoji: "🌪️",
      field: 'conflictApproach',
      options: conflictOptions
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
        {/* Particules d'amour flottantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-pink-400/40 rounded-full animate-float" />
          <div className="absolute top-20 right-20 w-1 h-1 bg-red-400/40 rounded-full animate-float delay-100" />
          <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-float delay-200" />
          <div className="absolute bottom-10 right-10 w-1 h-1 bg-pink-400/40 rounded-full animate-float delay-300" />
          <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-red-300/30 rounded-full animate-float delay-400" />
        </div>
        
        {/* Progress indicator pour les questions */}
        <div className="flex justify-center gap-3 mb-8">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`
                h-2 rounded-full transition-all duration-500
                ${index === currentQuestion 
                  ? 'w-16 bg-gradient-to-r from-pink-600 to-red-600 animate-pulse' 
                  : index < currentQuestion
                  ? 'w-16 bg-gradient-to-r from-pink-500 to-red-500'
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
            <div className="w-20 h-0.5 bg-gradient-to-r from-pink-400 to-red-400 rounded-full animate-pulse" />
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
                  ? `bg-gradient-to-r ${option.color} border-white/30 shadow-lg shadow-pink-500/30 scale-105`
                  : `${designSystem.cardBackground} ${designSystem.border} hover:border-pink-400`
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
                      : 'text-purple-400'
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

        {/* Citation inspirante */}
        <div className="text-center mb-6 relative z-10">
          {canContinue && (
            <div className={`${designSystem.cardBackground} ${designSystem.border} rounded-lg p-4 mx-auto max-w-md`}>
              <p className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center justify-center gap-2`}>
                <span className="text-pink-400">💝</span>
                {isLastQuestion 
                  ? 'Ton profil amoureux prend forme...' 
                  : 'Excellent choix ! Continue...'
                }
              </p>
            </div>
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
                  <span className="animate-bounce-gentle">✨</span>
                  Finaliser le questionnaire
                  <span className="text-yellow-300">+75 XP</span>
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
            <span className="text-pink-400">💖</span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Étape 3/4 - En amour ({currentQuestion + 1}/{questions.length})
            </span>
          </div>
        </div>
      </BaseComponents.Card>
    </div>
  )
}

export default Step2Love