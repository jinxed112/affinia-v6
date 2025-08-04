// src/components/questionnaire/Step0Identity.tsx
import React, { useState, useEffect } from 'react'
import { useQuestionnaireStore } from '../../stores/questionnaireStore'
import { useDesignSystem } from '../../styles/designSystem'
import { BaseComponents } from '../ui/BaseComponents'

interface Step0IdentityProps {
  isDarkMode: boolean
}

const Step0Identity: React.FC<Step0IdentityProps> = ({ isDarkMode }) => {
  const { answers, setAnswer } = useQuestionnaireStore()
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

  // Auto-save des réponses quand les données changent
  useEffect(() => {
    if (localData.firstName && validateField('firstName')) {
      setAnswer('firstName', localData.firstName.trim())
    }
  }, [localData.firstName])

  useEffect(() => {
    if (localData.age && validateField('age')) {
      setAnswer('age', Number(localData.age))
    }
  }, [localData.age])

  useEffect(() => {
    if (localData.gender) {
      setAnswer('gender', localData.gender as any)
    }
  }, [localData.gender])

  useEffect(() => {
    if (localData.orientation) {
      setAnswer('orientation', localData.orientation as any)
    }
  }, [localData.orientation])

  // Validation des champs individuels
  const validateField = (field: 'firstName' | 'age'): boolean => {
    if (field === 'firstName') {
      const isValid = localData.firstName.trim().length >= 2
      setErrors(prev => ({ ...prev, firstName: isValid ? '' : 'Au moins 2 caractères' }))
      return isValid
    }
    
    if (field === 'age') {
      const ageNum = Number(localData.age)
      const isValid = ageNum >= 18 && ageNum <= 100
      setErrors(prev => ({ ...prev, age: isValid ? '' : 'Entre 18 et 100 ans' }))
      return isValid
    }
    
    return false
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

  return (
    <div className="space-y-6">
      {/* Prénom et Âge - Stack sur mobile, Grid sur desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prénom */}
        <div className="space-y-2">
          <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <span className="text-lg">✨</span>
            Ton prénom
          </label>
          <div className="relative">
            <input
              type="text"
              value={localData.firstName}
              onChange={(e) => setLocalData({ ...localData, firstName: e.target.value })}
              onBlur={() => validateField('firstName')}
              placeholder="Prénom"
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
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                ✓
              </div>
            )}
          </div>
          {errors.firstName && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <span>⚠️</span> {errors.firstName}
            </p>
          )}
        </div>

        {/* Âge */}
        <div className="space-y-2">
          <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <span className="text-lg">🎂</span>
            Ton âge
          </label>
          <div className="relative">
            <input
              type="number"
              value={localData.age}
              onChange={(e) => setLocalData({ ...localData, age: e.target.value })}
              onBlur={() => validateField('age')}
              placeholder="Âge"
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
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                ✓
              </div>
            )}
          </div>
          {errors.age && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <span>⚠️</span> {errors.age}
            </p>
          )}
        </div>
      </div>

      {/* Genre */}
      <div>
        <label className={`block font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
          <span className="text-lg">🆔</span>
          Tu t'identifies comme...
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="flex items-center gap-3">
                <span className={`text-2xl transition-all duration-300 ${
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
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orientation */}
      <div>
        <label className={`block font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
          <span className="text-lg">💝</span>
          Ton orientation ?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="flex items-center gap-3">
                <span className={`text-2xl transition-all duration-300 ${
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
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Indicateur de completion */}
      {localData.firstName && localData.age && localData.gender && localData.orientation && (
        <BaseComponents.Card isDarkMode={isDarkMode} variant="glass" className="p-4">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <span className="animate-bounce-gentle">🎉</span>
            <span className="text-sm font-medium">
              Parfait ! Tu peux passer à l'étape suivante
            </span>
          </div>
        </BaseComponents.Card>
      )}
    </div>
  )
}

export default Step0Identity