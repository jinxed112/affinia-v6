import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useQuestionnaireStore } from '../stores/questionnaireStore'
import Step0Identity from '../components/questionnaire/Step0Identity'
import Step1Psychology from '../components/questionnaire/Step1Psychology'
import Step2Love from '../components/questionnaire/Step2Love'
import Step3Finalization from '../components/questionnaire/Step3Finalization'
import { useDesignSystem } from '../styles/designSystem'
import { BaseComponents } from '../components/ui/BaseComponents'
import { 
  ArrowLeft, ArrowRight, User, Brain, Heart, Sparkles, 
  CheckCircle, Shield
} from 'lucide-react'

interface QuestionnairePageProps {
  isDarkMode: boolean
}

const QuestionnairePage: React.FC<QuestionnairePageProps> = ({ isDarkMode }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { currentStep, nextStep, previousStep, goToStep, isStepComplete, getProgress } = useQuestionnaireStore()
  const designSystem = useDesignSystem(isDarkMode)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // Configuration des étapes
  const steps = [
    {
      id: 0,
      title: "Identité",
      subtitle: "Qui êtes-vous ?",
      icon: <User className="w-5 h-5" />,
      emoji: "👤",
      estimatedTime: "2 min"
    },
    {
      id: 1,
      title: "Psychologie",
      subtitle: "Comment fonctionnez-vous ?",
      icon: <Brain className="w-5 h-5" />,
      emoji: "🧠",
      estimatedTime: "8 min"
    },
    {
      id: 2,
      title: "Amour",
      subtitle: "Comment aimez-vous ?",
      icon: <Heart className="w-5 h-5" />,
      emoji: "💝",
      estimatedTime: "5 min"
    },
    {
      id: 3,
      title: "Finalisation",
      subtitle: "Génération de votre profil",
      icon: <Sparkles className="w-5 h-5" />,
      emoji: "✨",
      estimatedTime: "3 min"
    }
  ]

  // Fonction pour rendre le composant de l'étape actuelle
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <Step0Identity isDarkMode={isDarkMode} />
      case 1:
        return <Step1Psychology isDarkMode={isDarkMode} />
      case 2:
        return <Step2Love isDarkMode={isDarkMode} />
      case 3:
        return <Step3Finalization isDarkMode={isDarkMode} />
      default:
        return <Step0Identity isDarkMode={isDarkMode} />
    }
  }

  const currentStepData = steps[currentStep] || steps[0]
  const totalProgress = getProgress()
  const canGoBack = currentStep > 0
  const canGoNext = isStepComplete(currentStep)
  const isLastStep = currentStep === steps.length - 1

  // Scroll automatique vers le haut quand on change d'étape
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [currentStep])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')} pb-24`}>
      {/* Background mystique unifié */}
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />

      {/* Container principal */}
      <div className="relative z-10 min-h-screen">
        {/* Header épuré avec progression */}
        <header className="pt-6 pb-4 px-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-80">
          <div className="max-w-2xl mx-auto">
            {/* Barre de progression épurée */}
            <div className="space-y-4">
              {/* Étape actuelle avec icône */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white`}>
                    {currentStepData.icon}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${designSystem.getTextClasses('primary')}`}>
                      {currentStepData.title}
                    </h3>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Étape {currentStep + 1} sur {steps.length}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-xl font-bold gradient-text`}>
                    {Math.round(totalProgress)}%
                  </div>
                  <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                    {currentStepData.estimatedTime}
                  </p>
                </div>
              </div>
              
              {/* Barre de progression */}
              <div className={`w-full h-2 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div 
                  className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${Math.min(100, Math.max(0, totalProgress))}%` }}
                >
                  {/* Effet de brillance */}
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer" />
                </div>
              </div>

              {/* Mini indicateurs d'étapes */}
              <div className="flex justify-center gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      index === currentStep 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 scale-125' 
                        : index < currentStep
                        ? 'bg-green-500'
                        : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal - Étape actuelle */}
        <main className="px-4">
          <div className="max-w-2xl mx-auto">
            {/* Contexte de l'étape - Version mobile-friendly */}
            <BaseComponents.Card isDarkMode={isDarkMode} variant="glass" className="p-6 mb-6">
              <div className="text-center">
                <div className="text-4xl mb-2">{currentStepData.emoji}</div>
                <p className={`text-lg mb-2 gradient-text font-medium`}>
                  {currentStepData.subtitle}
                </p>
                
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-green-400" />
                    <span className={`${designSystem.getTextClasses('muted')}`}>
                      Sécurisé
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-purple-400" />
                    <span className={`${designSystem.getTextClasses('muted')}`}>
                      {currentStepData.estimatedTime}
                    </span>
                  </div>
                </div>
              </div>
            </BaseComponents.Card>

            {/* Contenu de l'étape */}
            {renderCurrentStep()}
          </div>
        </main>

        {/* Navigation fixe en bas */}
        <nav className={`fixed bottom-0 left-0 right-0 z-30 ${designSystem.getBgClasses('primary')} border-t ${designSystem.border} backdrop-blur-md bg-opacity-95`}>
          <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center gap-4">
              {/* Bouton Retour */}
              <BaseComponents.Button
                variant="secondary"
                size="medium"
                onClick={previousStep}
                disabled={!canGoBack}
                className={`flex items-center gap-2 ${!canGoBack ? 'opacity-50' : ''}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Retour</span>
              </BaseComponents.Button>

              {/* Info centrale */}
              <div className="flex-1 text-center">
                <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                  {currentStep + 1} / {steps.length}
                </p>
              </div>

              {/* Bouton Continuer */}
              <BaseComponents.Button
                variant="primary"
                size="medium"
                onClick={isLastStep ? () => navigate('/miroir') : nextStep}
                disabled={!canGoNext && !isLastStep}
                className={`flex items-center gap-2 ${
                  canGoNext || isLastStep ? 'animate-pulse-glow' : 'opacity-50'
                }`}
              >
                <span>
                  {isLastStep ? 'Terminer' : 'Continuer'}
                </span>
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
                {isLastStep && <Sparkles className="w-4 h-4" />}
              </BaseComponents.Button>
            </div>

            {/* Message d'encouragement */}
            {canGoNext && (
              <div className="mt-2 text-center">
                <p className={`text-xs ${designSystem.getTextClasses('muted')} animate-pulse`}>
                  {isLastStep 
                    ? '✨ Prêt à découvrir ton profil !' 
                    : '🎉 Parfait ! Tu peux continuer'
                  }
                </p>
              </div>
            )}
          </div>
        </nav>


      </div>
    </div>
  )
}

export default QuestionnairePage