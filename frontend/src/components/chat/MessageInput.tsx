// =============================================
// MESSAGEINPUT OPTIMISÉ AVEC INDICATEURS
// =============================================

import React, { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  isDarkMode: boolean;
  isMobile?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  isDarkMode,
  isMobile = false
}) => {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);

    onTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  }, [onTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || disabled || isSending) return;

    setIsSending(true);
    onTyping(false);

    try {
      await onSendMessage(content.trim());
      setContent('');
    } catch (error) {
      // Erreur gérée par le parent
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Tapez votre message..."
            disabled={disabled || isSending}
            rows={1}
            className={`w-full resize-none rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={disabled || isSending || !content.trim()}
          className={`p-3 rounded-lg transition-colors ${
            disabled || isSending || !content.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
};
