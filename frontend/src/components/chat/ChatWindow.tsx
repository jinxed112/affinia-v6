// =============================================
// CHATWINDOW OPTIMISÉ - TEMPS RÉEL
// =============================================

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import type { Conversation } from '../../../../shared/types/chat';

interface ChatWindowProps {
  conversation: Conversation;
  isDarkMode: boolean;
  isMobile?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  isDarkMode,
  isMobile = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const {
    messages,
    loading,
    sending,
    error,
    isConnected,
    sendMessage,
    sendTypingIndicator,
    clearError
  } = useChat({ conversationId: conversation.id });

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (typing: boolean) => {
    setIsTyping(typing);
    sendTypingIndicator(typing);
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Chargement des messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Header avec status connexion */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {conversation.other_participant?.avatar_url ? (
              <img
                src={conversation.other_participant.avatar_url}
                alt={conversation.other_participant.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold">
                  {conversation.other_participant?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {conversation.other_participant?.name || 'Utilisateur'}
              </h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isConnected ? 'Connecté' : 'Hors ligne'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={clearError}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              ×
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Début de votre conversation
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onReactToMessage={() => {}}
              onDeleteMessage={() => {}}
              isDarkMode={isDarkMode}
              isMobile={isMobile}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={sending || !isConnected}
        isDarkMode={isDarkMode}
        isMobile={isMobile}
      />
    </div>
  );
};
