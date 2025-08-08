// =============================================
// PAGE DEMANDES DE MIROIR - Version Debug Enhanced
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMirrorRequests } from '../hooks/useMirrorRequests';
import { useDesignSystem, UnifiedAnimations } from '../styles/designSystem';
import { BaseComponents } from '../components/ui/BaseComponents';
import { 
  Lock, Check, X, User, Calendar, Clock, Eye, 
  ArrowLeft, RefreshCw, AlertCircle, Loader, 
  Heart, Search, Filter, Mail, MessageSquare
} from 'lucide-react';

interface MirrorRequestsPageProps {
  isDarkMode: boolean;
}

export const MirrorRequestsPage: React.FC<MirrorRequestsPageProps> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const designSystem = useDesignSystem(isDarkMode);
  
  const {
    receivedRequests,
    sentRequests,
    loading,
    respondToRequest,
    refreshRequests
  } = useMirrorRequests();

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [responding, setResponding] = useState<string | null>(null);

  // ✅ DEBUG: Vérifier que le composant est bien la bonne version
  useEffect(() => {
    console.log('🟦 MirrorRequestsPage LOADED - Version Debug Enhanced:', {
      timestamp: new Date().toISOString(),
      version: 'debug-enhanced-v2',
      receivedRequests: receivedRequests.length,
      sentRequests: sentRequests.length
    });
  }, [receivedRequests.length, sentRequests.length]);

  // ✅ DEBUG: Test fonction disponible dans window
  useEffect(() => {
    (window as any).testMirrorNavigation = (userId: string) => {
      console.log('🧪 TEST NAVIGATION:', userId);
      navigate(`/miroir/${userId}`);
    };
    
    console.log('🧪 Test function added to window.testMirrorNavigation');
  }, [navigate]);

  const handleRespond = async (requestId: string, response: 'accepted' | 'rejected') => {
    try {
      setResponding(requestId);
      await respondToRequest(requestId, response);
    } catch (error) {
      console.error('❌ Erreur réponse:', error);
    } finally {
      setResponding(null);
    }
  };

  // ✅ FIX: Fonction de navigation avec DEBUG COMPLET
  const handleViewMirror = (request: any) => {
    console.log('🟦 CLICK DÉTECTÉ - handleViewMirror appelée !', {
      timestamp: new Date().toISOString(),
      request_id: request?.id,
      request_status: request?.status,
      activeTab
    });

    // ✅ DEBUG: Vérifier structure complète de request
    console.log('🟦 REQUEST OBJECT COMPLET:', {
      request: JSON.stringify(request, null, 2)
    });

    const targetUserId = activeTab === 'received' 
      ? request.sender_id 
      : request.receiver_id;
    
    console.log('🟦 TARGET USER CALCULATION:', {
      activeTab,
      sender_id: request?.sender_id,
      receiver_id: request?.receiver_id,
      targetUserId,
      calculation: `activeTab=${activeTab} ? sender_id=${request?.sender_id} : receiver_id=${request?.receiver_id}`
    });
    
    console.log('🔍 DEBUG Navigation MirrorPage:', {
      activeTab,
      targetUserId,
      request: {
        id: request.id,
        sender_id: request.sender_id,
        receiver_id: request.receiver_id,
        sender: request.sender,
        receiver: request.receiver,
        status: request.status
      }
    });
    
    if (!targetUserId) {
      console.error('❌ Target User ID manquant!', {
        request,
        activeTab,
        sender_id: request?.sender_id,
        receiver_id: request?.receiver_id
      });
      
      // ✅ FALLBACK: Essayer de trouver un ID alternatif
      const fallbackId = request?.sender?.id || request?.receiver?.id || request?.sender_id || request?.receiver_id;
      console.log('🔄 TENTATIVE FALLBACK ID:', fallbackId);
      
      if (fallbackId) {
        console.log('✅ USING FALLBACK ID pour navigation:', fallbackId);
        navigate(`/miroir/${fallbackId}`);
        return;
      }
      
      alert('Erreur: Impossible de déterminer l\'utilisateur cible');
      return;
    }
    
    // ✅ NAVIGATION AVEC LOGS DÉTAILLÉS
    console.log('🚀 NAVIGATION EN COURS vers:', `/miroir/${targetUserId}`);
    
    try {
      navigate(`/miroir/${targetUserId}`);
      console.log('✅ NAVIGATION LANCÉE avec succès');
    } catch (error) {
      console.error('❌ ERREUR NAVIGATION:', error);
      alert(`Erreur navigation: ${error}`);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
      {/* Styles CSS unifiés */}
      <style>{`
        ${UnifiedAnimations}
      `}</style>

      {/* Background mystique unifié */}
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
                      <Lock className="w-8 h-8" />
                    </div>
                    Demandes de Miroir
                  </h1>
                  <p className={`text-lg mt-2 ${designSystem.getTextClasses('secondary')}`}>
                    Gérez l'accès à votre miroir et vos demandes
                  </p>
                </div>
              </div>
              
              <BaseComponents.Button
                variant="secondary"
                size="small"
                onClick={refreshRequests}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </BaseComponents.Button>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      {receivedRequests.length}
                    </p>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Demandes reçues
                    </p>
                  </div>
                </div>
              </BaseComponents.Card>

              <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-green-400" />
                  <div>
                    <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>
                      {sentRequests.length}
                    </p>
                    <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                      Demandes envoyées
                    </p>
                  </div>
                </div>
              </BaseComponents.Card>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex space-x-1 mb-6">
            <BaseComponents.Button
              variant={activeTab === 'received' ? 'primary' : 'secondary'}
              size="medium"
              onClick={() => setActiveTab('received')}
              className="px-6"
            >
              Demandes reçues ({receivedRequests.length})
            </BaseComponents.Button>
            <BaseComponents.Button
              variant={activeTab === 'sent' ? 'primary' : 'secondary'}
              size="medium"
              onClick={() => setActiveTab('sent')}
              className="px-6"
            >
              Demandes envoyées ({sentRequests.length})
            </BaseComponents.Button>
          </div>

          {/* Contenu */}
          {loading ? (
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
              {(activeTab === 'received' ? receivedRequests : sentRequests).map((request) => (
                <BaseComponents.Card
                  key={request.id}
                  isDarkMode={isDarkMode}
                  variant="default"
                  className="p-6 card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        {(activeTab === 'received' ? request.sender?.avatar_url : request.receiver?.avatar_url) ? (
                          <img 
                            src={activeTab === 'received' ? request.sender.avatar_url : request.receiver.avatar_url}
                            alt="Avatar"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      
                      {/* Infos */}
                      <div>
                        <h3 className={`font-bold ${designSystem.getTextClasses('primary')}`}>
                          {activeTab === 'received' 
                            ? request.sender?.name || 'Utilisateur' 
                            : request.receiver?.name || 'Utilisateur'}
                        </h3>
                        <p className={`text-sm ${designSystem.getTextClasses('muted')}`}>
                          {new Date(request.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                            Refusé
                          </>
                        )}
                      </BaseComponents.Badge>
                      
                      {/* Actions pour les demandes reçues en attente */}
                      {activeTab === 'received' && request.status === 'pending' && (
                        <div className="flex gap-2">
                          <BaseComponents.Button
                            variant="success"
                            size="small"
                            onClick={() => handleRespond(request.id, 'accepted')}
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
                            onClick={() => handleRespond(request.id, 'rejected')}
                            disabled={responding === request.id}
                            className="flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            Refuser
                          </BaseComponents.Button>
                        </div>
                      )}

                      {/* ✅ BOUTON VOIR MIROIR avec logs DEBUG */}
                      {request.status === 'accepted' && (
                        <BaseComponents.Button
                          variant="primary"
                          size="small"
                          onClick={() => {
                            console.log('🟦 BOUTON CLIQUÉ - Avant handleViewMirror', {
                              timestamp: new Date().toISOString(),
                              request_id: request.id,
                              activeTab
                            });
                            handleViewMirror(request);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Voir le miroir
                        </BaseComponents.Button>
                      )}
                    </div>
                  </div>
                </BaseComponents.Card>
              ))}
              
              {/* Message si aucune demande */}
              {(activeTab === 'received' ? receivedRequests : sentRequests).length === 0 && (
                <div className="text-center py-12">
                  <Lock className={`w-12 h-12 mx-auto mb-4 ${designSystem.getTextClasses('muted')}`} />
                  <h3 className={`text-xl font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
                    Aucune demande trouvée
                  </h3>
                  <p className={`text-sm mb-6 ${designSystem.getTextClasses('muted')}`}>
                    {activeTab === 'received' 
                      ? 'Vous n\'avez pas encore reçu de demandes d\'accès à votre miroir' 
                      : 'Vous n\'avez pas encore envoyé de demandes d\'accès'}
                  </p>
                  {activeTab === 'sent' && (
                    <BaseComponents.Button
                      variant="primary"
                      size="medium"
                      onClick={() => navigate('/decouverte')}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Search className="w-4 h-4" />
                      Découvrir des profils
                    </BaseComponents.Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};