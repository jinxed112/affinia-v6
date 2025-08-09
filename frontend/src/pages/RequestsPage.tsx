// frontend/src/pages/RequestsPage.tsx - Page unifiée Mirror + Contact
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRequests } from '../hooks/useRequests'
import { useDesignSystem, UnifiedAnimations } from '../styles/designSystem'
import { BaseComponents } from '../components/ui/BaseComponents'
import { 
  Heart, Check, X, User, Calendar, Clock, MessageSquare, 
  ArrowLeft, RefreshCw, Loader, Mail, Send, Eye, Lock,
  BookOpen
} from 'lucide-react'

interface RequestsPageProps {
  isDarkMode: boolean
}

export const RequestsPage: React.FC<RequestsPageProps> = ({ isDarkMode }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const designSystem = useDesignSystem(isDarkMode)
  
  const {
    mirrorReceived,
    mirrorSent, 
    mirrorLoading,
    respondToMirrorRequest,
    contactReceived,
    contactSent,
    contactLoading,
    respondToContactRequest,
    isLoading,
    refreshAll
  } = useRequests()

  const [activeSection, setActiveSection] = useState<'mirror' | 'contact'>('mirror')
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const [responding, setResponding] = useState<string | null>(null)

  const handleMirrorRespond = async (requestId: string, response: 'accepted' | 'rejected') => {
    try {
      setResponding(requestId)
      await respondToMirrorRequest(requestId, response)
    } catch (error) {
      console.error('❌ Erreur réponse miroir:', error)
    } finally {
      setResponding(null)
    }
  }

  const handleContactRespond = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      setResponding(requestId)
      await respondToContactRequest(requestId, response)
    } catch (error) {
      console.error('❌ Erreur réponse contact:', error)
    } finally {
      setResponding(null)
    }
  }

  const handleViewMirror = (request: any) => {
    const targetUserId = activeTab === 'received' 
      ? request.sender_id 
      : request.receiver_id
    
    if (targetUserId) {
      navigate(`/miroir/${targetUserId}`)
    }
  }

  if (!user) {
    navigate('/login')
    return null
  }

  // Données actuelles selon la section
  const currentData = activeSection === 'mirror' 
    ? { received: mirrorReceived, sent: mirrorSent }
    : { received: contactReceived, sent: contactSent }

  const currentRequests = activeTab === 'received' 
    ? currentData.received 
    : currentData.sent

  return (
    <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
      <style>{`${UnifiedAnimations}`}</style>
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />

      <div className="pt-20 pb-8 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <BaseComponents.Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </BaseComponents.Button>
                
                <div>
                  <h1 className={`text-3xl font-bold flex items-center gap-3 ${designSystem.getTextClasses('primary')}`}>
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-float">
                      <Mail className="w-8 h-8" />
                    </div>
                    Mes Demandes
                  </h1>
                  <p className={`text-lg mt-2 ${designSystem.getTextClasses('secondary')}`}>
                    Gérez vos demandes de miroir et de contact
                  </p>
                </div>
              </div>
              
              <BaseComponents.Button
                variant="secondary"
                size="small"
                onClick={refreshAll}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </BaseComponents.Button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      {mirrorReceived.length}
                    </p>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Demandes miroir reçues
                    </p>
                  </div>
                </div>
              </BaseComponents.Card>

              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  <Send className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      {mirrorSent.length}
                    </p>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Demandes miroir envoyées
                    </p>
                  </div>
                </div>
              </BaseComponents.Card>

              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  <Heart className="w-8 h-8 text-pink-400" />
                  <div>
                    <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      {contactReceived.length}
                    </p>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Demandes contact reçues
                    </p>
                  </div>
                </div>
              </BaseComponents.Card>

              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-green-400" />
                  <div>
                    <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      {contactSent.length}
                    </p>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Demandes contact envoyées
                    </p>
                  </div>
                </div>
              </BaseComponents.Card>
            </div>
          </div>

          {/* Sélecteur Section (Mirror/Contact) */}
          <div className="flex space-x-1 mb-4">
            <BaseComponents.Button
              variant={activeSection === 'mirror' ? 'primary' : 'secondary'}
              size="medium"
              onClick={() => setActiveSection('mirror')}
              className="px-6 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Demandes Miroir
            </BaseComponents.Button>
            <BaseComponents.Button
              variant={activeSection === 'contact' ? 'primary' : 'secondary'}
              size="medium"
              onClick={() => setActiveSection('contact')}
              className="px-6 flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Demandes Contact
            </BaseComponents.Button>
          </div>

          {/* Onglets Reçu/Envoyé */}
          <div className="flex space-x-1 mb-6">
            <BaseComponents.Button
              variant={activeTab === 'received' ? 'primary' : 'secondary'}
              size="medium"
              onClick={() => setActiveTab('received')}
              className="px-6"
            >
              Reçues ({currentData.received.length})
            </BaseComponents.Button>
            <BaseComponents.Button
              variant={activeTab === 'sent' ? 'primary' : 'secondary'}
              size="medium"
              onClick={() => setActiveTab('sent')}
              className="px-6"
            >
              Envoyées ({currentData.sent.length})
            </BaseComponents.Button>
          </div>

          {/* Contenu */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                <p className={`text-lg ${designSystem.getTextClasses('secondary')}`}>
                  Chargement des demandes...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentRequests.map((request) => (
                <BaseComponents.Card
                  key={request.id}
                  isDarkMode={isDarkMode}
                  variant="default"
                  className="p-6 card-hover"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        {(activeTab === 'received' 
                          ? (activeSection === 'mirror' ? request.sender?.avatar_url : request.sender?.avatar_url)
                          : (activeSection === 'mirror' ? request.receiver?.avatar_url : request.receiver?.avatar_url)
                        ) ? (
                          <img 
                            src={activeTab === 'received' 
                              ? (activeSection === 'mirror' ? request.sender.avatar_url : request.sender.avatar_url)
                              : (activeSection === 'mirror' ? request.receiver.avatar_url : request.receiver.avatar_url)
                            }
                            alt="Avatar"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      
                      {/* Infos */}
                      <div className="flex-1">
                        <h3 className={`font-bold ${designSystem.getTextClasses('primary')}`}>
                          {activeTab === 'received' 
                            ? (activeSection === 'mirror' ? request.sender?.name : request.sender?.name) || 'Utilisateur'
                            : (activeSection === 'mirror' ? request.receiver?.name : request.receiver?.name) || 'Utilisateur'
                          }
                        </h3>
                        <p className={`text-sm ${designSystem.getTextClasses('muted')} mb-2`}>
                          {new Date(activeSection === 'mirror' ? request.created_at : request.requested_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        
                        {/* Message pour contact requests */}
                        {activeSection === 'contact' && request.sender_message && (
                          <div className={`mt-2 p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                            <p className={`text-sm ${designSystem.getTextClasses('secondary')} italic`}>
                              "{request.sender_message}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Badge statut */}
                      <BaseComponents.Badge 
                        variant={
                          request.status === 'pending' ? 'warning' :
                          request.status === 'accepted' ? 'success' : 'error'
                        }
                        isDarkMode={isDarkMode}
                      >
                        {request.status === 'pending' ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            En attente
                          </>
                        ) : request.status === 'accepted' ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Accepté
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            {activeSection === 'mirror' ? 'Refusé' : 'Refusé'}
                          </>
                        )}
                      </BaseComponents.Badge>
                      
                      {/* Actions pour les demandes reçues en attente */}
                      {activeTab === 'received' && request.status === 'pending' && (
                        <div className="flex gap-2">
                          <BaseComponents.Button
                            variant="success"
                            size="small"
                            onClick={() => activeSection === 'mirror' 
                              ? handleMirrorRespond(request.id, 'accepted')
                              : handleContactRespond(request.id, 'accepted')
                            }
                            disabled={responding === request.id}
                            className="flex items-center gap-1"
                          >
                            {responding === request.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Accepter
                          </BaseComponents.Button>
                          
                          <BaseComponents.Button
                            variant="error"
                            size="small"
                            onClick={() => activeSection === 'mirror'
                              ? handleMirrorRespond(request.id, 'rejected')
                              : handleContactRespond(request.id, 'declined')
                            }
                            disabled={responding === request.id}
                            className="flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            Refuser
                          </BaseComponents.Button>
                        </div>
                      )}

                      {/* Actions pour demandes acceptées */}
                      {request.status === 'accepted' && (
                        <div className="flex gap-2">
                          {activeSection === 'mirror' && (
                            <BaseComponents.Button
                              variant="primary"
                              size="small"
                              onClick={() => handleViewMirror(request)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Voir le miroir
                            </BaseComponents.Button>
                          )}
                          
                          {activeSection === 'contact' && request.conversation_id && (
                            <BaseComponents.Button
                              variant="primary"
                              size="small"
                              onClick={() => navigate(`/chat/${request.conversation_id}`)}
                              className="flex items-center gap-1"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Discuter
                            </BaseComponents.Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </BaseComponents.Card>
              ))}
              
              {/* Message si aucune demande */}
              {currentRequests.length === 0 && (
                <div className="text-center py-12">
                  {activeSection === 'mirror' ? (
                    <Lock className={`w-12 h-12 mx-auto mb-4 ${designSystem.getTextClasses('muted')}`} />
                  ) : (
                    <Heart className={`w-12 h-12 mx-auto mb-4 ${designSystem.getTextClasses('muted')}`} />
                  )}
                  <h3 className={`text-xl font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                    Aucune demande trouvée
                  </h3>
                  <p className={`text-sm mb-6 ${designSystem.getTextClasses('muted')}`}>
                    {activeTab === 'received' 
                      ? `Vous n'avez pas encore reçu de demandes de ${activeSection === 'mirror' ? 'miroir' : 'contact'}`
                      : `Vous n'avez pas encore envoyé de demandes de ${activeSection === 'mirror' ? 'miroir' : 'contact'}`
                    }
                  </p>
                  {activeTab === 'sent' && (
                    <BaseComponents.Button
                      variant="primary"
                      size="medium"
                      onClick={() => navigate('/decouverte')}
                      className="flex items-center gap-2 mx-auto"
                    >
                      {activeSection === 'mirror' ? <BookOpen className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                      Explorer des profils
                    </BaseComponents.Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}