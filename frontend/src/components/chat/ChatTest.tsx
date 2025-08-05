// =============================================
// COMPOSANT TEST CHAT - frontend/src/components/chat/ChatTest.tsx
// =============================================

import React from 'react';
import { useChat } from '../../hooks/useChat';

interface ChatTestProps {
  isDarkMode: boolean;
}

export const ChatTest: React.FC<ChatTestProps> = ({ isDarkMode }) => {
  const {
    conversations,
    currentConversation,
    messages,
    chatStats,
    isLoading,
    isLoadingMessages,
    selectConversation,
    sendMessage,
    refreshConversations
  } = useChat();

  const handleSendTestMessage = async () => {
    if (!currentConversation) return;
    
    try {
      await sendMessage(currentConversation.id, {
        content: 'Message de test depuis l\'interface ! 🚀'
      });
    } catch (error) {
      console.error('Erreur envoi message test:', error);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🧪 Test Chat System</h1>
          <p className="text-sm opacity-75">
            Test des services backend et frontend
          </p>
        </div>

        {/* Stats */}
        <div className={`rounded-lg p-4 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-lg font-semibold mb-2">📊 Statistiques</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-500">{conversations.length}</div>
              <div className="text-sm">Conversations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">{chatStats.total_unread_conversations}</div>
              <div className="text-sm">Non lues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{messages.length}</div>
              <div className="text-sm">Messages</div>
            </div>
          </div>
          
          <button
            onClick={refreshConversations}
            disabled={isLoading}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Chargement...' : '🔄 Actualiser'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Liste des conversations */}
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-semibold mb-4">💬 Conversations</h2>
            
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm">Chargement...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">💭</div>
                <p className="text-sm opacity-75">Aucune conversation</p>
                <p className="text-xs mt-1 opacity-50">
                  Les conversations se créent automatiquement quand un miroir est accepté !
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentConversation?.id === conv.id
                        ? 'bg-purple-600 text-white'
                        : isDarkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {conv.other_participant?.avatar_url ? (
                          <img
                            src={conv.other_participant.avatar_url}
                            alt={conv.other_participant.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                            {conv.other_participant?.name?.charAt(0) || '?'}
                          </div>
                        )}
                        
                        {/* Info */}
                        <div>
                          <div className="font-medium">
                            {conv.other_participant?.name || 'Utilisateur'}
                          </div>
                          <div className="text-xs opacity-75">
                            {conv.last_message ? 
                              (conv.last_message.content?.substring(0, 30) + '...' || 'Message') : 
                              'Nouvelle conversation'
                            }
                          </div>
                        </div>
                      </div>
                      
                      {/* Badge non lu */}
                      {(conv.unread_count || 0) > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-semibold mb-4">
              📨 Messages
              {currentConversation && (
                <span className="text-sm font-normal ml-2">
                  avec {currentConversation.other_participant?.name}
                </span>
              )}
            </h2>

            {!currentConversation ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">👆</div>
                <p className="text-sm opacity-75">
                  Sélectionnez une conversation
                </p>
              </div>
            ) : isLoadingMessages ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm">Chargement des messages...</p>
              </div>
            ) : (
              <div>
                {/* Liste des messages */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm opacity-75">Aucun message</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_own_message ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.is_own_message
                              ? 'bg-purple-600 text-white'
                              : isDarkMode
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          {message.message_type === 'system' ? (
                            <div className="text-center text-sm opacity-75">
                              {message.content}
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm">{message.content}</div>
                              <div className="text-xs opacity-75 mt-1">
                                {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bouton test */}
                <button
                  onClick={handleSendTestMessage}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  🚀 Envoyer message test
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Debug info */}
        <div className={`mt-6 p-4 rounded-lg text-xs ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h3 className="font-semibold mb-2">🔍 Debug Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div>Conversations: {conversations.length}</div>
              <div>Messages: {messages.length}</div>
              <div>Loading: {isLoading ? 'Oui' : 'Non'}</div>
            </div>
            <div>
              <div>Conversation actuelle: {currentConversation?.id || 'Aucune'}</div>
              <div>Unread total: {chatStats.total_unread_conversations}</div>
              <div>Messages loading: {isLoadingMessages ? 'Oui' : 'Non'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};