// =============================================
// PAGE CHAT MOBILE-OPTIMISÉE - frontend/src/components/chat/ChatPage.tsx
// =============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { MessageCircle, Users, ArrowLeft } from 'lucide-react';

interface ChatPageProps {
  isDarkMode: boolean;
}

export const ChatPage: React.FC<ChatPageProps> = ({ isDarkMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  const {
    conversations,
    currentConversation,
    messages,
    chatStats,
    isLoading,
    isLoadingMessages,
    selectConversation,
    sendMessage,
    reactToMessage,
    deleteMessage,
    refreshConversations
  } = useChat();

  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);

  // Détection mobile améliorée
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      setIsMobileView(isMobile);
      
      // Sur mobile : afficher la liste si pas de conversation active
      if (isMobile) {
        setShowConversationList(!currentConversation);
      } else {
        // Sur desktop : toujours afficher la liste
        setShowConversationList(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [currentConversation]);

  // Navigation par URL
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv && conv.id !== currentConversation?.id) {
        selectConversation(conv);
        // Sur mobile, masquer la liste quand on sélectionne une conversation
        if (isMobileView) {
          setShowConversationList(false);
        }
      }
    }
  }, [conversationId, conversations, currentConversation, selectConversation, isMobileView]);

  // Gestion des actions
  const handleSelectConversation = (conversation: any) => {
    selectConversation(conversation);
    navigate(`/chat/${conversation.id}`);
    
    // Sur mobile, masquer la liste des conversations
    if (isMobileView) {
      setShowConversationList(false);
    }
  };

  const handleSendMessage = async (content: string, replyToId?: string) => {
    if (!currentConversation || !content.trim()) return;

    try {
      await sendMessage(currentConversation.id, {
        content: content.trim(),
        reply_to_id: replyToId
      });
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      // TODO: Afficher une notification d'erreur
    }
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    navigate('/chat');
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Chargement de vos conversations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header mobile pour le chat */}
      {isMobileView && !showConversationList && currentConversation && (
        <div className={`sticky top-16 z-40 px-4 py-3 border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } shadow-sm`}>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* Info conversation */}
            <div className="flex items-center gap-3 flex-1">
              {currentConversation.other_participant?.avatar_url ? (
                <img
                  src={currentConversation.other_participant.avatar_url}
                  alt={currentConversation.other_participant.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {currentConversation.other_participant?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentConversation.other_participant?.name || 'Utilisateur'}
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  En ligne
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`${isMobileView ? 'h-screen' : 'max-w-7xl mx-auto h-screen'} flex`}>
        
        {/* Liste des conversations */}
        <div className={`
          ${isMobileView 
            ? showConversationList ? 'w-full' : 'hidden'
            : 'w-1/3 min-w-[350px]'
          } 
          ${!isMobileView ? 'border-r' : ''} 
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
          ${isMobileView ? (showConversationList ? 'pt-0' : 'pt-16') : ''}
        `}>
          <ConversationList
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={handleSelectConversation}
            isDarkMode={isDarkMode}
            chatStats={chatStats}
            isLoading={isLoading}
            onRefresh={refreshConversations}
            isMobile={isMobileView}
          />
        </div>

        {/* Zone de chat */}
        <div className={`
          ${isMobileView 
            ? showConversationList ? 'hidden' : 'w-full'
            : 'flex-1'
          } 
          flex flex-col
          ${isMobileView && !showConversationList ? 'pt-0' : ''}
        `}>
          {currentConversation ? (
            <ChatWindow
              conversation={currentConversation}
              messages={messages}
              isLoadingMessages={isLoadingMessages}
              onSendMessage={handleSendMessage}
              onReactToMessage={reactToMessage}
              onDeleteMessage={deleteMessage}
              onBackToList={isMobileView ? handleBackToList : undefined}
              isDarkMode={isDarkMode}
              isMobile={isMobileView}
            />
          ) : (
            // État vide - Pas de conversation sélectionnée (desktop seulement)
            !isMobileView && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Sélectionnez une conversation
                  </h3>
                  
                  <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Choisissez une conversation pour commencer à discuter
                  </p>

                  {conversations.length === 0 && (
                    <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <Users className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Aucune conversation
                      </h4>
                      <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Les conversations se créent automatiquement quand quelqu'un accepte votre demande de miroir !
                      </p>
                      <button
                        onClick={() => navigate('/decouverte')}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                      >
                        🔍 Découvrir des profils
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};