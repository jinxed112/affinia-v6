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
  ArrowLeft, RotateCcw, Brain, Heart, User, Sparkles, 
  Target, Shield, Star, CheckCircle, Clock, Zap
} from 'lucide-react'

interface QuestionnairePageProps {
  isDarkMode: boolean
}

const QuestionnairePage: React.FC<QuestionnairePageProps> = ({ isDarkMode }) => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { currentStep, resetQuestionnaire, goToStep, isStepComplete, getProgress } = useQuestionnaireStore()
  const designSystem = useDesignSystem(isDarkMode)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // Configuration des étapes avec design unifié
  const steps = [
    {
      id: 0,
      title: "Identité",
      subtitle: "Qui êtes-vous ?",
      description: "Informations de base pour construire votre profil",
      icon: <User className="w-6 h-6" />,
      gradient: "from-blue-500 to-cyan-500",
      emoji: "👤",
      estimatedTime: "2 min"
    },
    {
      id: 1,
      title: "Psychologie",
      subtitle: "Comment fonctionnez-vous ?",
      description: "Découvrez vos patterns mentaux et émotionnels",
      icon: <Brain className="w-6 h-6" />,
      gradient: "from-purple-500 to-violet-500",
      emoji: "🧠",
      estimatedTime: "8 min"
    },
    {
      id: 2,
      title: "Amour",
      subtitle: "Comment aimez-vous ?",
      description: "Explorez votre style relationnel et vos attentes",
      icon: <Heart className="w-6 h-6" />,
      gradient: "from-pink-500 to-rose-500",
      emoji: "💝",
      estimatedTime: "5 min"
    },
    {
      id: 3,
      title: "Finalisation",
      subtitle: "Génération de votre profil",
      description: "Analyse et création de votre carte unique",
      icon: <Sparkles className="w-6 h-6" />,
      gradient: "from-orange-500 to-yellow-500",
      emoji: "✨",
      estimatedTime: "3 min"
    }
  ]

  // ✅ CORRECTION: Calcul dynamique des étapes complétées
  const stepsCompleted = [
    isStepComplete(0),
    isStepComplete(1), 
    isStepComplete(2),
    isStepComplete(3)
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
  const completedSteps = stepsCompleted.filter(Boolean).length
  const totalProgress = getProgress() // ✅ CORRECTION: Utilise la fonction du store

  return (
    <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
      {/* Background mystique unifié */}
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />

      {/* Container principal */}
      <div className="relative z-10 min-h-screen">
        {/* Header simplifié - seulement le contenu du questionnaire */}
        <header className="pt-8 pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Progress global et étapes */}
            <div className="space-y-8">
              {/* Barre de progression globale */}
              <BaseComponents.Card isDarkMode={isDarkMode} variant="highlighted" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${designSystem.getTextClasses('primary')}`}>
                      Progression générale
                    </h3>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Étape {currentStep + 1} sur {steps.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold gradient-text`}>
                      {Math.round(totalProgress)}%
                    </div>
                    <p className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                      {completedSteps}/{steps.length} complétées
                    </p>
                  </div>
                </div>
                
                {/* ✅ CORRECTION: Barre de progression fonctionnelle */}
                <div className={`w-full h-3 rounded-full overflow-hidden ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className="h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, totalProgress))}%` }}
                  >
                    {/* Effet de brillance */}
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer" />
                  </div>
                </div>
              </BaseComponents.Card>

              {/* Étapes visuelles - cartes uniformes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {steps.map((step, index) => {
                  const isActive = index === currentStep
                  const isCompleted = stepsCompleted[index]
                  const isPast = index < currentStep
                  const isClickable = index < currentStep || (index === currentStep && isStepComplete(index - 1)) || index === 0

                  return (
                    <BaseComponents.Card
                      key={step.id}
                      isDarkMode={isDarkMode}
                      variant={isActive ? "highlighted" : "default"}
                      className={`p-6 h-[320px] flex flex-col transition-all duration-300 ${
                        isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-60'
                      } ${
                        isActive ? 'scale-105 animate-pulse-glow' : 
                        isCompleted ? 'border-green-500/30 bg-green-500/5' :
                        isPast ? 'opacity-75' : ''
                      }`}
                      onClick={() => {
                        // ✅ CORRECTION: Navigation fonctionnelle vers les étapes précédentes
                        if (isClickable) {
                          goToStep(index)
                        }
                      }}
                    >
                      {/* Header de l'étape */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${step.gradient} text-white ${
                          isActive ? 'animate-float' : ''
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            step.icon
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className={`text-xs ${designSystem.getTextClasses('muted')}`}>
                            {step.estimatedTime}
                          </span>
                        </div>
                      </div>

                      {/* Contenu de l'étape - optimisé pour hauteur fixe */}
                      <div className="space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{step.emoji}</span>
                            <h4 className={`font-bold ${designSystem.getTextClasses('primary')}`}>
                              {step.title}
                            </h4>
                          </div>
                          <p className={`text-sm font-medium mb-3 ${
                            isActive ? 'gradient-text' : designSystem.getTextClasses('secondary')
                          }`}>
                            {step.subtitle}
                          </p>
                          <p className={`text-xs leading-relaxed ${designSystem.getTextClasses('muted')}`}>
                            {step.description}
                          </p>
                        </div>

                        {/* Status indicator - toujours en bas */}
                        <div className="mt-auto pt-4">
                          {isCompleted ? (
                            <BaseComponents.Badge variant="success" isDarkMode={isDarkMode}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Complété
                            </BaseComponents.Badge>
                          ) : isActive ? (
                            <BaseComponents.Badge variant="warning" isDarkMode={isDarkMode}>
                              <Zap className="w-3 h-3 mr-1" />
                              En cours
                            </BaseComponents.Badge>
                          ) : isClickable ? (
                            <BaseComponents.Badge variant="default" isDarkMode={isDarkMode}>
                              <Target className="w-3 h-3 mr-1" />
                              Disponible
                            </BaseComponents.Badge>
                          ) : (
                            <BaseComponents.Badge variant="default" isDarkMode={isDarkMode}>
                              <Clock className="w-3 h-3 mr-1" />
                              À venir
                            </BaseComponents.Badge>
                          )}
                        </div>
                      </div>
                    </BaseComponents.Card>
                  )
                })}
              </div>

              {/* Contexte de l'étape actuelle */}
              <BaseComponents.Card isDarkMode={isDarkMode} variant="highlighted" className="p-8 mystical-glow">
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r ${currentStepData.gradient} text-white animate-float`}>
                    {currentStepData.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{currentStepData.emoji}</span>
                      <h3 className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                        {currentStepData.title}
                      </h3>
                      <BaseComponents.Badge variant="default" isDarkMode={isDarkMode}>
                        Étape {currentStep + 1}/{steps.length}
                      </BaseComponents.Badge>
                    </div>
                    
                    <p className={`text-lg mb-3 gradient-text font-medium`}>
                      {currentStepData.subtitle}
                    </p>
                    
                    <p className={`${designSystem.getTextClasses('secondary')} mb-4`}>
                      {currentStepData.description}
                    </p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                          Temps estimé : {currentStepData.estimatedTime}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                          Données cryptées et sécurisées
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </BaseComponents.Card>
            </div>
          </div>
        </header>

        {/* Contenu principal - Étape actuelle */}
        <main className="pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            {renderCurrentStep()}
          </div>
        </main>

        {/* Footer avec conseils */}
        <footer className="pb-8 px-4">
          <div className="max-w-4xl mx-auto">
            <BaseComponents.Card isDarkMode={isDarkMode} variant="glass" className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-semibold mb-2 ${designSystem.getTextClasses('primary')}`}>
                    💡 Conseil de dresseur
                  </h4>
                  <p className={`text-sm ${designSystem.getTextClasses('secondary')}`}>
                    Plus vous êtes authentique dans vos réponses, plus votre profil sera précis et vos futurs matchs seront compatibles. 
                    Prenez votre temps et répondez instinctivement.
                  </p>
                </div>
              </div>
            </BaseComponents.Card>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default QuestionnairePage