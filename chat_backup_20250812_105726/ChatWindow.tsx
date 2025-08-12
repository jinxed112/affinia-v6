// =============================================
// FENÊTRE DE CHAT MOBILE - frontend/src/components/chat/ChatWindow.tsx
// =============================================

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Smile, Paperclip, Send, Loader2 } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Conversation, Message } from '../../../../shared/types/chat';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  isLoadingMessages: boolean;
  onSendMessage: (content: string, replyToId?: string) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onBackToList?: () => void; // Pour mobile
  isDarkMode: boolean;
  isMobile?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  isLoadingMessages,
  onSendMessage,
  onReactToMessage,
  onDeleteMessage,
  onBackToList,
  isDarkMode,
  isMobile = false
}) => {
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string, replyToId?: string) => {
    onSendMessage(content, replyToId);
  };

  return (
    <div className="flex flex-col h-full">
      
      {/* Header de la conversation (masqué sur mobile si header séparé) */}
      {!isMobile && (
        <div className={`px-4 sm:px-6 py-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              
              {/* Bouton retour (mobile) */}
              {onBackToList && (
                <button
                  onClick={onBackToList}
                  className={`p-2 rounded-lg transition-colors lg:hidden ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              {/* Avatar et info utilisateur */}
              <button
                onClick={() => setShowUserInfo(!showUserInfo)}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                {conversation.other_participant?.avatar_url ? (
                  <img
                    src={conversation.other_participant.avatar_url}
                    alt={conversation.other_participant.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-purple-500/20">
                    <span className="text-white font-bold">
                      {conversation.other_participant?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}

                <div className="text-left">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {conversation.other_participant?.name || 'Utilisateur'}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isTyping ? (
                      <span className="flex items-center">
                        <span className="animate-pulse">En train d'écrire</span>
                        <span className="flex space-x-1 ml-2">
                          <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </span>
                      </span>
                    ) : (
                      'En ligne' // Placeholder - à connecter avec le statut réel
                    )}
                  </p>
                </div>
              </button>
            </div>

            {/* Actions header */}
            <div className="flex items-center space-x-2">
              {/* Appel vocal (placeholder) */}
              <button
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Appel vocal"
              >
                <Phone className="w-5 h-5" />
              </button>

              {/* Appel vidéo (placeholder) */}
              <button
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Appel vidéo"
              >
                <Video className="w-5 h-5" />
              </button>

              {/* Menu options */}
              <button
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Plus d'options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Info panel utilisateur (collapsible) */}
          {showUserInfo && (
            <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="text-center">
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {conversation.other_participant?.name || 'Utilisateur'}
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Conversation créée le {new Date(conversation.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <div className="flex justify-center space-x-2 mt-4">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                    Voir le profil
                  </button>
                  <button className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                    isDarkMode 
                      ? 'bg-gray-600 text-white hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}>
                    Bloquer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zone des messages */}
      <div className={`flex-1 overflow-hidden ${isMobile ? 'pb-safe' : ''}`}>
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Chargement des messages...
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <MessageList
              messages={messages}
              isLoading={false}
              onReactToMessage={onReactToMessage}
              onDeleteMessage={onDeleteMessage}
              isDarkMode={isDarkMode}
              isMobile={isMobile}
            />
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Zone de saisie */}
      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${isMobile ? 'pb-safe' : ''}`}>
        <MessageInput
          onSendMessage={handleSendMessage}
          isDarkMode={isDarkMode}
          disabled={isLoadingMessages}
          placeholder="Tapez votre message..."
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};