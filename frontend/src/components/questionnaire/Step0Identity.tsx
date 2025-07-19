// src/components/questionnaire/Step0Identity.tsx
import React, { useState, useEffect } from 'react'
import { useQuestionnaireStore } from '../../stores/questionnaireStore'
import { useDesignSystem } from '../../styles/designSystem'
import { BaseComponents } from '../ui/BaseComponents'

interface Step0IdentityProps {
  isDarkMode: boolean
}

const Step0Identity: React.FC<Step0IdentityProps> = ({ isDarkMode }) => {
  const { answers, setAnswer, nextStep, isStepComplete } = useQuestionnaireStore()
  const designSystem = useDesignSystem(isDarkMode)
  
  const [localData, setLocalData] = useState({
    firstName: answers.firstName || '',
    age: answers.age || '',
    gender: answers.gender || '',
    orientation: answers.orientation || ''
  })

  const [errors, setErrors] = useState({
    firstName: '',
    age: ''
  })

  // Validation
  const validateForm = () => {
    const newErrors = { firstName: '', age: '' }
    let isValid = true

    if (!localData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis'
      isValid = false
    } else if (localData.firstName.trim().length < 2) {
      newErrors.firstName = 'Le prénom doit faire au moins 2 caractères'
      isValid = false
    }

    const ageNum = Number(localData.age)
    if (!localData.age || ageNum < 18 || ageNum > 100) {
      newErrors.age = 'L\'âge doit être entre 18 et 100 ans'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm() && localData.gender && localData.orientation) {
      // Sauvegarder toutes les réponses
      setAnswer('firstName', localData.firstName.trim())
      setAnswer('age', Number(localData.age))
      setAnswer('gender', localData.gender as any)
      setAnswer('orientation', localData.orientation as any)
      
      // Passage direct à l'étape suivante
      nextStep()
    }
  }

  const genderOptions = [
    { value: 'homme', label: 'Homme', icon: '👨', color: 'from-blue-500 to-cyan-500' },
    { value: 'femme', label: 'Femme', icon: '👩', color: 'from-pink-500 to-rose-500' },
    { value: 'non-binaire', label: 'Non-binaire', icon: '🌈', color: 'from-purple-500 to-indigo-500' },
    { value: 'autre', label: 'Autre', icon: '✨', color: 'from-yellow-400 to-orange-500' }
  ]

  const orientationOptions = [
    { value: 'hétéro', label: 'Hétérosexuel(le)', icon: '💑', color: 'from-red-500 to-pink-500' },
    { value: 'homo', label: 'Homosexuel(le)', icon: '🏳️‍🌈', color: 'from-purple-600 to-blue-600' },
    { value: 'bi', label: 'Bisexuel(le)', icon: '💕', color: 'from-purple-500 to-pink-500' },
    { value: 'autre', label: 'Autre', icon: '💫', color: 'from-indigo-500 to-purple-500' }
  ]

  const isFormValid = localData.firstName && localData.age && localData.gender && localData.orientation

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Card principale */}
        <BaseComponents.Card 
          isDarkMode={isDarkMode} 
          variant="highlighted"
          className="p-8 relative overflow-hidden"
        >
          {/* Particules d'arrière-plan */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-2 h-2 bg-purple-400/30 rounded-full animate-float" />
            <div className="absolute top-20 right-20 w-1 h-1 bg-pink-400/30 rounded-full animate-float delay-100" />
            <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-float delay-200" />
          </div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="text-6xl mb-4 animate-bounce-gentle">👋</div>
            <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Faisons connaissance !
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Quelques infos de base pour personnaliser ton expérience Affinia
            </p>
            <div className="mt-4 flex justify-center">
              <div className="w-20 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Prénom et Âge - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
            {/* Prénom */}
            <div className="space-y-3">
              <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <span className="text-xl">✨</span>
                Comment tu t'appelles ?
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={localData.firstName}
                  onChange={(e) => setLocalData({ ...localData, firstName: e.target.value })}
                  placeholder="Ton prénom"
                  className={`
                    w-full px-4 py-3 rounded-lg backdrop-blur-sm border-2 transition-all duration-300
                    focus:outline-none focus:ring-4 focus:ring-purple-500/20
                    ${errors.firstName ? 
                      'border-red-500 focus:border-red-500' : 
                      `${designSystem.border} focus:border-purple-500 hover:border-purple-400`
                    }
                    ${isDarkMode 
                      ? 'bg-gray-800/50 text-white placeholder-gray-400' 
                      : 'bg-white/80 text-gray-900 placeholder-gray-500'
                    }
                  `}
                />
                {localData.firstName && !errors.firstName && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 animate-bounce-gentle">
                    ✓
                  </div>
                )}
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-500 animate-shake flex items-center gap-1">
                  <span>⚠️</span> {errors.firstName}
                </p>
              )}
            </div>

            {/* Âge */}
            <div className="space-y-3">
              <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <span className="text-xl">🎂</span>
                Quel âge as-tu ?
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={localData.age}
                  onChange={(e) => setLocalData({ ...localData, age: e.target.value })}
                  placeholder="Ton âge"
                  min="18"
                  max="100"
                  className={`
                    w-full px-4 py-3 rounded-lg backdrop-blur-sm border-2 transition-all duration-300
                    focus:outline-none focus:ring-4 focus:ring-purple-500/20
                    ${errors.age ? 
                      'border-red-500 focus:border-red-500' : 
                      `${designSystem.border} focus:border-purple-500 hover:border-purple-400`
                    }
                    ${isDarkMode 
                      ? 'bg-gray-800/50 text-white placeholder-gray-400' 
                      : 'bg-white/80 text-gray-900 placeholder-gray-500'
                    }
                  `}
                />
                {localData.age && !errors.age && Number(localData.age) >= 18 && Number(localData.age) <= 100 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 animate-bounce-gentle">
                    ✓
                  </div>
                )}
              </div>
              {errors.age && (
                <p className="text-sm text-red-500 animate-shake flex items-center gap-1">
                  <span>⚠️</span> {errors.age}
                </p>
              )}
            </div>
          </div>

          {/* Genre */}
          <div className="mb-8 relative z-10">
            <label className={`block font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <span className="text-xl">🆔</span>
              Tu t'identifies comme...
            </label>
            <div className="grid grid-cols-2 gap-4">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLocalData({ ...localData, gender: option.value })}
                  className={`
                    group relative p-4 rounded-xl backdrop-blur-sm border-2 transition-all duration-300 transform hover:scale-105
                    ${localData.gender === option.value
                      ? `bg-gradient-to-r ${option.color} border-white/30 shadow-lg shadow-purple-500/30 scale-105`
                      : `${designSystem.cardBackground} ${designSystem.border} hover:border-purple-400`
                    }
                  `}
                >
                  <div className="text-center">
                    <span className={`text-3xl mb-2 block transition-all duration-300 ${
                      localData.gender === option.value ? 'animate-bounce-gentle' : 'group-hover:scale-110'
                    }`}>
                      {option.icon}
                    </span>
                    <p className={`text-sm font-medium ${
                      localData.gender === option.value 
                        ? 'text-white' 
                        : isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {option.label}
                    </p>
                  </div>
                  {localData.gender === option.value && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce-gentle">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div className="mb-8 relative z-10">
            <label className={`block font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <span className="text-xl">💝</span>
              Ton orientation ?
            </label>
            <div className="grid grid-cols-2 gap-4">
              {orientationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLocalData({ ...localData, orientation: option.value })}
                  className={`
                    group relative p-4 rounded-xl backdrop-blur-sm border-2 transition-all duration-300 transform hover:scale-105
                    ${localData.orientation === option.value
                      ? `bg-gradient-to-r ${option.color} border-white/30 shadow-lg shadow-purple-500/30 scale-105`
                      : `${designSystem.cardBackground} ${designSystem.border} hover:border-purple-400`
                    }
                  `}
                >
                  <div className="text-center">
                    <span className={`text-3xl mb-2 block transition-all duration-300 ${
                      localData.orientation === option.value ? 'animate-bounce-gentle' : 'group-hover:scale-110'
                    }`}>
                      {option.icon}
                    </span>
                    <p className={`text-sm font-medium ${
                      localData.orientation === option.value 
                        ? 'text-white' 
                        : isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {option.label}
                    </p>
                  </div>
                  {localData.orientation === option.value && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce-gentle">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bouton continuer */}
          <BaseComponents.Button
            type="submit"
            variant="primary"
            size="large"
            disabled={!isFormValid}
            className={`w-full transition-all duration-500 ${
              isFormValid ? 'animate-pulse-glow' : ''
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {isFormValid ? (
                <>
                  <span className="animate-bounce-gentle">🧠</span>
                  Continuer vers la psychologie
                  <span className="text-yellow-300">+25 XP</span>
                </>
              ) : (
                <>
                  <span>⏳</span>
                  Complète tes informations
                </>
              )}
            </span>
          </BaseComponents.Button>

          {/* Indicateur de progression */}
          <div className="mt-6 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${designSystem.cardBackground} ${designSystem.border}`}>
              <span className="text-purple-400">⚡</span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Étape 1/4 - Identité
              </span>
            </div>
          </div>
        </BaseComponents.Card>
      </form>
    </div>
  )
}

export default Step0Identity