// =============================================
// SAISIE DE MESSAGE - frontend/src/components/chat/MessageInput.tsx
// =============================================

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, X, Reply } from 'lucide-react';
import type { MessageInputProps } from '../../../../shared/types/chat';

interface MessageInputProps {
  onSendMessage: (content: string, replyToId?: string) => void;
  isDarkMode: boolean;
  disabled?: boolean;
  placeholder?: string;
  replyToMessage?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  onCancelReply?: () => void;
  isMobile?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isDarkMode,
  disabled = false,
  placeholder = "Tapez votre message...",
  replyToMessage,
  onCancelReply,
  isMobile = false
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emojis populaires
  const popularEmojis = [
    '😀', '😂', '😍', '🥰', '😎', '😅', '🤔', '😒', 
    '😭', '😱', '😡', '🤗', '👍', '👎', '❤️', '🔥',
    '💯', '👏', '🎉', '💪', '🤝', '🙏', '✨', '⭐'
  ];

  // Auto-resize du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Focus automatique
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || disabled) return;

    try {
      setIsSending(true);
      await onSendMessage(message.trim(), replyToMessage?.id);
      setMessage('');
      if (onCancelReply) onCancelReply();
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      // TODO: Afficher une notification d'erreur
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Envoyer avec Entrée (sauf si Shift+Entrée)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }

    // Fermer l'emoji picker avec Escape
    if (e.key === 'Escape' && showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.slice(0, start) + emoji + message.slice(end);
    
    setMessage(newMessage);
    setShowEmojiPicker(false);
    
    // Remettre le focus et positionner le curseur
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Gérer l'upload de fichiers
    console.log('📎 Fichier sélectionné:', file.name);
    
    // Reset l'input
    e.target.value = '';
  };

  // Gestion du typing indicator (mobile)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (message.trim() && textareaRef.current) {
      // TODO: Envoyer typing indicator
      timeoutId = setTimeout(() => {
        // TODO: Arrêter typing indicator
      }, 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [message]);

  const canSend = message.trim().length > 0 && !isSending && !disabled;

  return (
    <div className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      
      {/* Réponse à un message */}
      {replyToMessage && (
        <div className={`px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                Répondre à {replyToMessage.senderName}
              </span>
            </div>
            {onCancelReply && (
              <button
                onClick={onCancelReply}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className={`text-sm mt-1 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {replyToMessage.content}
          </p>
        </div>
      )}

      {/* Zone de saisie principale */}
      <form onSubmit={handleSubmit} className={isMobile ? "p-3" : "p-4"}>
        <div className={`
          flex items-end space-x-3 ${isMobile ? 'p-2' : 'p-3'} rounded-2xl border transition-colors
          ${isDarkMode 
            ? 'border-gray-600 bg-gray-700/50 focus-within:border-purple-500' 
            : 'border-gray-300 bg-gray-50 focus-within:border-purple-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}>
          
          {/* Bouton fichier */}
          <button
            type="button"
            onClick={handleFileSelect}
            disabled={disabled}
            className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-full transition-colors flex-shrink-0 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
            title="Joindre un fichier"
          >
            <Paperclip className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </button>

          {/* Zone de texte */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Chargement...' : placeholder}
              disabled={disabled}
              rows={1}
              className={`
                w-full resize-none border-0 bg-transparent outline-none
                ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}
                ${disabled ? 'cursor-not-allowed' : ''}
              `}
              style={{ 
                minHeight: '24px',
                maxHeight: '120px',
                lineHeight: '24px'
              }}
            />
            
            {/* Compteur de caractères */}
            {message.length > 3800 && (
              <div className={`absolute -top-6 right-0 text-xs ${
                message.length > 4000 
                  ? 'text-red-500' 
                  : message.length > 3900 
                    ? 'text-yellow-500' 
                    : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {message.length}/4000
              </div>
            )}
          </div>

          {/* Bouton emoji */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-full transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              } ${disabled ? 'cursor-not-allowed' : ''}`}
              title="Ajouter un emoji"
            >
              <Smile className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </button>

            {/* Picker d'emojis */}
            {showEmojiPicker && (
              <>
                {/* Overlay pour fermer */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowEmojiPicker(false)}
                />
                
                {/* Popup emojis */}
                <div className={`
                  absolute bottom-full right-0 mb-2 p-3 rounded-lg shadow-lg border z-20
                  ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}
                `}>
                  <div className="grid grid-cols-8 gap-1 max-w-xs">
                    {popularEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-lg p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bouton d'envoi */}
          <button
            type="submit"
            disabled={!canSend}
            className={`
              ${isMobile ? 'p-1.5' : 'p-2'} rounded-full transition-all duration-200 flex-shrink-0
              ${canSend
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105'
                : isDarkMode
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            title={canSend ? 'Envoyer le message' : 'Saisissez un message'}
          >
            {isSending ? (
              <div className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-spin rounded-full border-2 border-white border-t-transparent`} />
            ) : (
              <Send className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            )}
          </button>
        </div>

        {/* Input fichier caché */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,audio/*,.pdf,.doc,.docx"
        />

        {/* Indication des raccourcis */}
        <div className={`flex justify-between items-center mt-2 text-xs ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <span>Entrée pour envoyer, Shift+Entrée pour nouvelle ligne</span>
          {message.length > 0 && (
            <span className={message.length > 4000 ? 'text-red-500' : ''}>
              {message.length} caractères
            </span>
          )}
        </div>
      </form>
    </div>
  );
};