// =============================================
// COMPOSANTS UI TEMPS RÉEL - frontend/src/components/chat/TypingIndicator.tsx
// =============================================

import React from 'react';

interface TypingUser {
  userId: string;
  userName: string;
  conversationId: string;
  timestamp: number;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  isDarkMode: boolean;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  typingUsers, 
  isDarkMode, 
  className = '' 
}) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} est en train d'écrire...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} et ${typingUsers[1].userName} sont en train d'écrire...`;
    } else {
      return `${typingUsers.length} personnes sont en train d'écrire...`;
    }
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 ${className}`}>
      {/* Animation de points qui bougent */}
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full animate-bounce ${
          isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
        }`} style={{ animationDelay: '0ms' }}></div>
        <div className={`w-2 h-2 rounded-full animate-bounce ${
          isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
        }`} style={{ animationDelay: '150ms' }}></div>
        <div className={`w-2 h-2 rounded-full animate-bounce ${
          isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
        }`} style={{ animationDelay: '300ms' }}></div>
      </div>

      {/* Texte */}
      <span className={`text-sm italic ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {getTypingText()}
      </span>
    </div>
  );
};

// =============================================
// COMPOSANT STATUT EN LIGNE - frontend/src/components/chat/OnlineStatus.tsx
// =============================================

interface OnlineStatusProps {
  isOnline: boolean;
  lastSeen?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OnlineStatus: React.FC<OnlineStatusProps> = ({
  isOnline,
  lastSeen,
  showText = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const formatLastSeen = (lastSeenDate: string) => {
    const date = new Date(lastSeenDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Indicateur visuel */}
      <div className="relative">
        <div className={`
          rounded-full border-2 border-white dark:border-gray-800
          ${sizeClasses[size]}
          ${isOnline 
            ? 'bg-green-500 shadow-lg shadow-green-500/50' 
            : 'bg-gray-400'
          }
        `}></div>
        
        {/* Animation de pulsation si en ligne */}
        {isOnline && (
          <div className={`
            absolute inset-0 rounded-full 
            bg-green-500 animate-ping opacity-75
            ${sizeClasses[size]}
          `}></div>
        )}
      </div>

      {/* Texte du statut */}
      {showText && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {isOnline ? 'En ligne' : lastSeen ? formatLastSeen(lastSeen) : 'Hors ligne'}
        </span>
      )}
    </div>
  );
};

// =============================================
// COMPOSANT INTÉGRÉ POUR MESSAGESINPUT - frontend/src/components/chat/MessageInputWithTyping.tsx
// =============================================

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Image, Smile } from 'lucide-react';

interface MessageInputWithTypingProps {
  onSendMessage: (content: string, replyToId?: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  isDarkMode: boolean;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: any;
  onCancelReply?: () => void;
}

export const MessageInputWithTyping: React.FC<MessageInputWithTypingProps> = ({
  onSendMessage,
  onTypingChange,
  isDarkMode,
  disabled = false,
  placeholder = "Tapez votre message...",
  replyTo,
  onCancelReply
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Gérer l'indicateur de frappe
  const handleTypingIndicator = (typing: boolean) => {
    if (typing !== isTyping) {
      setIsTyping(typing);
      onTypingChange(typing);
    }

    if (typing) {
      // Arrêter l'indicateur après 3 secondes d'inactivité
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingChange(false);
      }, 3000);
    }
  };

  // Gérer les changements de texte
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Indicateur de frappe
    if (value.trim()) {
      handleTypingIndicator(true);
    } else {
      handleTypingIndicator(false);
    }

    // Auto-resize du textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Envoyer le message
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    // Arrêter l'indicateur de frappe
    handleTypingIndicator(false);

    // Envoyer le message
    onSendMessage(trimmedMessage, replyTo?.id);

    // Reset
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  // Gérer les touches clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Nettoyage
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
      {/* Zone de réponse */}
      {replyTo && (
        <div className={`px-4 py-2 border-l-4 border-purple-500 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                Réponse à {replyTo.sender?.name || 'Utilisateur'}
              </p>
              <p className={`text-sm truncate ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {replyTo.content || 'Message'}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className={`text-xs px-2 py-1 rounded ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Zone de saisie */}
      <div className="p-4">
        <div className={`flex items-end gap-3 p-3 rounded-2xl ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          
          {/* Bouton pièce jointe */}
          <button
            disabled={disabled}
            className={`p-2 rounded-full transition-colors ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Zone de texte */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={`
                w-full resize-none border-none outline-none bg-transparent
                text-sm placeholder-gray-500 min-h-[24px] max-h-[120px]
                ${isDarkMode ? 'text-white' : 'text-gray-900'}
                ${disabled ? 'cursor-not-allowed' : ''}
              `}
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-2">
            {/* Bouton emoji */}
            <button
              disabled={disabled}
              className={`p-2 rounded-full transition-colors ${
                disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Bouton envoyer / micro */}
            {message.trim() ? (
              <button
                onClick={handleSend}
                disabled={disabled}
                className={`p-2 rounded-full transition-all duration-200 ${
                  disabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:scale-105'
                } text-white`}
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                disabled={disabled}
                className={`p-2 rounded-full transition-colors ${
                  disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Indicateur de frappe local */}
        {isTyping && (
          <div className="mt-2 px-3">
            <span className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Vous tapez...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================
// COMPOSANT LISTE DE CONVERSATIONS AVEC STATUTS - frontend/src/components/chat/ConversationItemWithStatus.tsx
// =============================================

interface ConversationItemWithStatusProps {
  conversation: any;
  isSelected: boolean;
  onClick: () => void;
  isOnline: boolean;
  hasUnread: boolean;
  isDarkMode: boolean;
}

export const ConversationItemWithStatus: React.FC<ConversationItemWithStatusProps> = ({
  conversation,
  isSelected,
  onClick,
  isOnline,
  hasUnread,
  isDarkMode
}) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 24 * 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getLastMessagePreview = () => {
    if (!conversation.last_message) return 'Nouvelle conversation';
    
    const msg = conversation.last_message;
    if (msg.message_type === 'image') return '📷 Photo';
    if (msg.message_type === 'voice') return '🎤 Message vocal';
    if (msg.message_type === 'system') return '⚙️ ' + (msg.content || 'Message système');
    
    return msg.content || 'Message';
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 cursor-pointer transition-all duration-200 border-l-4
        ${isSelected 
          ? isDarkMode
            ? 'bg-gray-700 border-purple-500'
            : 'bg-purple-50 border-purple-500'
          : isDarkMode
            ? 'bg-gray-800 border-transparent hover:bg-gray-700'
            : 'bg-white border-transparent hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Avatar avec statut en ligne */}
        <div className="relative">
          {conversation.other_participant?.avatar_url ? (
            <img
              src={conversation.other_participant.avatar_url}
              alt={conversation.other_participant.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {conversation.other_participant?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
          
          {/* Statut en ligne */}
          <OnlineStatus 
            isOnline={isOnline}
            size="sm"
            className="absolute -bottom-1 -right-1"
          />
        </div>

        {/* Contenu de la conversation */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {conversation.other_participant?.name || 'Utilisateur'}
            </h3>
            
            <span className={`text-xs ${
              hasUnread 
                ? 'text-purple-600 dark:text-purple-400 font-medium'
                : isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {formatTime(conversation.last_message_at || conversation.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-sm truncate flex-1 ${
              hasUnread
                ? isDarkMode ? 'text-gray-200 font-medium' : 'text-gray-800 font-medium'
                : isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {getLastMessagePreview()}
            </p>

            {/* Badge de messages non lus */}
            {hasUnread && conversation.unread_count > 0 && (
              <div className="ml-2 min-w-[20px] h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold px-1">
                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};