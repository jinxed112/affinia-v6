// src/components/questionnaire/ProgressBar.tsx
import React from 'react'
import { useQuestionnaireStore } from '../../stores/questionnaireStore'
import { useDesignSystem } from '../../styles/designSystem'

interface ProgressBarProps {
  isDarkMode: boolean
}

const ProgressBar: React.FC<ProgressBarProps> = ({ isDarkMode }) => {
  const { currentStep, totalSteps, isStepComplete, goToStep, getProgress } = useQuestionnaireStore()
  const designSystem = useDesignSystem(isDarkMode)
  
  const steps = [
    { icon: '👤', label: 'Identité', color: 'from-blue-500 to-purple-500' },
    { icon: '🧠', label: 'Psychologie', color: 'from-purple-500 to-pink-500' },
    { icon: '💖', label: 'En amour', color: 'from-pink-500 to-red-500' },
    { icon: '✨', label: 'Finalisation', color: 'from-yellow-400 to-orange-500' }
  ]

  return (
    <div className="w-full mb-8">
      {/* Barre de progression principale */}
      <div className="relative mb-8">
        <div className={`h-3 rounded-full overflow-hidden ${designSystem.cardBackground} ${designSystem.border}`}>
          <div 
            className={`h-full ${designSystem.gradientPrimary} transition-all duration-1000 ease-out rounded-full relative`}
            style={{ width: `${getProgress()}%` }}
          >
            {/* Effet de brillance animé */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                          transform -skew-x-12 animate-shimmer" />
          </div>
        </div>
        
        {/* Pourcentage avec animation */}
        <div className={`absolute -top-10 right-0 ${designSystem.textSecondary} transition-all duration-500`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse-glow">⚡</span>
            <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {Math.round(getProgress())}% complété
            </span>
          </div>
        </div>
      </div>

      {/* Étapes gamifiées */}
      <div className="grid grid-cols-4 gap-3">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep || (index === currentStep && isStepComplete(index))
          const isClickable = index < currentStep || isStepComplete(index - 1)

          return (
            <button
              key={index}
              onClick={() => isClickable && goToStep(index)}
              disabled={!isClickable}
              className={`
                group relative flex flex-col items-center space-y-2 p-4 rounded-xl 
                transition-all duration-500 transform hover:scale-105
                ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                ${isActive ? `${designSystem.cardBackground} ${designSystem.borderHighlight} scale-105` : designSystem.cardBackground}
                ${designSystem.shadow}
              `}
            >
              {/* Particules d'énergie pour l'étape active */}
              {isActive && (
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-ping delay-75" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-150" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping delay-300" />
                </div>
              )}

              {/* Cercle avec icône */}
              <div className="relative">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                  transition-all duration-500 backdrop-blur-sm border-2 relative overflow-hidden
                  ${isActive 
                    ? `bg-gradient-to-r ${step.color} ${designSystem.borderHighlight} shadow-lg shadow-purple-500/50 animate-pulse-glow` 
                    : isCompleted
                    ? `bg-gradient-to-r ${step.color} opacity-80 ${designSystem.borderHighlight}`
                    : `${designSystem.cardBackground} ${designSystem.border}`
                  }
                `}>
                  {/* Effet de brillance */}
                  {(isActive || isCompleted) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                                  transform -skew-x-12 animate-shimmer" />
                  )}
                  
                  <span className={`relative z-10 transition-all duration-300
                    ${isCompleted || isActive 
                      ? 'text-white drop-shadow-sm' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }
                  `}>
                    {step.icon}
                  </span>
                </div>

                {/* Badge de complétion avec XP */}
                {isCompleted && !isActive && (
                  <div className={`absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 
                                 ${isDarkMode ? 'border-gray-900' : 'border-white'} 
                                 flex items-center justify-center animate-bounce-gentle z-20`}>
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}

                {/* Indicateur XP flottant */}
                {isActive && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 animate-float">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold 
                                  px-2 py-1 rounded-full shadow-lg">
                      +{25 * (index + 1)} XP
                    </div>
                  </div>
                )}
              </div>

              {/* Label avec effet de survol */}
              <div className="text-center">
                <span className={`
                  text-sm font-medium transition-all duration-300 block
                  ${isActive 
                    ? 'text-purple-400 font-bold' 
                    : isCompleted
                    ? isDarkMode ? 'text-white' : 'text-gray-900'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }
                  group-hover:text-purple-400
                `}>
                  {step.label}
                </span>

                {/* Indicateur de progression pour l'étape active */}
                {isActive && (
                  <div className="mt-1 flex justify-center">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Encouragement basé sur le progrès */}
      <div className="mt-6 text-center">
        {getProgress() < 25 && (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-pulse`}>
            🌟 Commence ton voyage Affinia...
          </p>
        )}
        {getProgress() >= 25 && getProgress() < 50 && (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-pulse`}>
            🔥 Tu progresses bien ! Continue...
          </p>
        )}
        {getProgress() >= 50 && getProgress() < 75 && (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-pulse`}>
            ⚡ Plus que quelques étapes !
          </p>
        )}
        {getProgress() >= 75 && getProgress() < 100 && (
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-pulse`}>
            🚀 Presque terminé ! Tu y es presque...
          </p>
        )}
        {getProgress() === 100 && (
          <p className="text-sm bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-bold animate-pulse-glow">
            ✨ Questionnaire complété ! Bravo !
          </p>
        )}
      </div>
    </div>
  )
}

export default ProgressBar