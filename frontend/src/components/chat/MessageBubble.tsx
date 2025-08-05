// =============================================
// BULLE DE MESSAGE - frontend/src/components/chat/MessageBubble.tsx
// =============================================

import React, { useState } from 'react';
import { MoreVertical, Reply, Copy, Trash2, Edit3, Clock, Check } from 'lucide-react';
import { chatService } from '../../services/chatService';
import type { Message } from '../../../../shared/types/chat';

interface MessageBubbleProps {
  message: Message;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isDarkMode: boolean;
  isGrouped?: boolean; // Si le message fait partie d'un groupe (même sender consécutif)
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReactToMessage,
  onDeleteMessage,
  isDarkMode,
  isGrouped = false
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isOwn = message.is_own_message;
  const isSystem = message.message_type === 'system';
  const isExpired = message.is_expired || chatService.isMessageExpired(message);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReaction = (emoji: string) => {
    onReactToMessage(message.id, emoji);
    setShowReactionPicker(false);
  };

  const handleCopyMessage = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      // TODO: Afficher une notification "Copié"
    }
    setShowActions(false);
  };

  const handleDeleteMessage = () => {
    onDeleteMessage(message.id);
    setShowActions(false);
  };

  const reactions = chatService.getMessageReactions(message);
  const commonEmojis = ['❤️', '😂', '👍', '😮', '😢', '😡', '🔥', '💯'];

  // Message système
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className={`px-4 py-2 rounded-full text-sm max-w-md text-center ${
          isDarkMode 
            ? 'bg-gray-800 text-gray-300 border border-gray-700' 
            : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-4'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`max-w-xs lg:max-w-md relative group ${isOwn ? 'order-2' : 'order-1'}`}>
        
        {/* Avatar (seulement si pas groupé et pas own) */}
        {!isGrouped && !isOwn && (
          <div className="flex items-end mb-2">
            {message.sender?.avatar_url ? (
              <img
                src={message.sender.avatar_url}
                alt={message.sender.name}
                className="w-6 h-6 rounded-full object-cover mr-2"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2">
                <span className="text-white text-xs font-bold">
                  {message.sender?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {message.sender?.name}
            </span>
          </div>
        )}

        <div className="flex items-end space-x-2 group">
          {!isOwn && isGrouped && <div className="w-6" />} {/* Espacement pour alignement */}
          
          {/* Bulle de message */}
          <div
            className={`
              relative px-4 py-2 rounded-2xl max-w-full break-words
              ${isOwn 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md' 
                : isDarkMode 
                  ? 'bg-gray-700 text-white rounded-bl-md' 
                  : 'bg-white text-gray-900 shadow-sm border border-gray-200 rounded-bl-md'
              }
              ${isExpired ? 'opacity-50' : ''}
              ${isGrouped ? (isOwn ? 'rounded-tr-2xl' : 'rounded-tl-2xl') : ''}
            `}
          >
            {/* Contenu du message */}
            <div className="space-y-1">
              {/* Message de réponse (si applicable) */}
              {message.reply_to && (
                <div className={`p-2 rounded-lg text-xs border-l-2 ${
                  isOwn 
                    ? 'bg-white/10 border-white/30 text-purple-100' 
                    : isDarkMode 
                      ? 'bg-gray-600 border-gray-500 text-gray-300' 
                      : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}>
                  <div className="font-medium mb-1">
                    En réponse à {message.reply_to.sender?.name}
                  </div>
                  <div className="truncate">
                    {message.reply_to.content?.substring(0, 50)}...
                  </div>
                </div>
              )}

              {/* Contenu principal */}
              {message.content && (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
              )}

              {/* Media (image/voice) */}
              {message.message_type === 'image' && message.media_url && (
                <div className="mt-2">
                  <img
                    src={message.media_url}
                    alt="Image partagée"
                    className="max-w-full h-auto rounded-lg"
                    loading="lazy"
                  />
                </div>
              )}

              {message.message_type === 'voice' && message.media_url && (
                <div className="mt-2 flex items-center space-x-2">
                  <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                    <div className="w-4 h-4 triangle-right"></div>
                  </button>
                  <div className="flex-1 h-2 bg-white/20 rounded-full">
                    <div className="h-full w-1/3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-xs opacity-75">
                    {message.media_metadata?.duration || '0:00'}
                  </span>
                </div>
              )}
            </div>

            {/* Métadonnées du message */}
            <div className={`flex items-center justify-between mt-2 text-xs ${
              isOwn ? 'text-purple-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="flex items-center space-x-2">
                <span>{formatTime(message.created_at)}</span>
                {message.edited_at && (
                  <span className="italic">modifié</span>
                )}
                {isExpired && (
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>expiré</span>
                  </span>
                )}
              </div>
              
              {isOwn && !isSystem && (
                <div className="flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  {/* <CheckCheck className="w-3 h-3" /> pour "lu" */}
                </div>
              )}
            </div>
          </div>

          {/* Actions du message (visibles au hover) */}
          {!isSystem && (isHovered || showActions) && (
            <div className={`
              flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity
              ${isOwn ? 'order-1 mr-2' : 'order-3 ml-2'}
            `}>
              {/* Réaction rapide */}
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className={`p-1 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Réagir"
              >
                <span className="text-sm">😊</span>
              </button>

              {/* Menu actions */}
              <button
                onClick={() => setShowActions(!showActions)}
                className={`p-1 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Réactions existantes */}
        {reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'} ${!isOwn && isGrouped ? 'ml-8' : ''}`}>
            {reactions.map(({ emoji, count }) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`
                  px-2 py-1 rounded-full text-xs flex items-center space-x-1 transition-colors
                  ${isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }
                `}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Picker de réactions */}
        {showReactionPicker && (
          <div className={`
            absolute ${isOwn ? 'right-0' : 'left-0'} bottom-full mb-2 p-2 rounded-lg shadow-lg border z-10
            ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
          `}>
            <div className="flex space-x-1">
              {commonEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-lg hover:scale-125 transition-transform p-1 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu d'actions */}
        {showActions && (
          <div className={`
            absolute ${isOwn ? 'right-0' : 'left-0'} bottom-full mb-2 py-1 rounded-lg shadow-lg border z-10
            ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
          `}>
            <button
              onClick={() => {/* TODO: Répondre */}}
              className={`flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              <Reply className="w-4 h-4" />
              <span>Répondre</span>
            </button>
            
            <button
              onClick={handleCopyMessage}
              className={`flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span>Copier</span>
            </button>

            {isOwn && (
              <>
                <button
                  onClick={() => {/* TODO: Éditer */}}
                  className={`flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                
                <button
                  onClick={handleDeleteMessage}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};