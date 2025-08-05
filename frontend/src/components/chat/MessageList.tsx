// =============================================
// LISTE DES MESSAGES MOBILE - frontend/src/components/chat/MessageList.tsx
// =============================================

import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { AlertCircle, MessageCircle } from 'lucide-react';
import type { Message } from '../../../../shared/types/chat';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isDarkMode: boolean;
  isMobile?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onReactToMessage,
  onDeleteMessage,
  isDarkMode,
  isMobile = false
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas lors de nouveaux messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Grouper les messages par date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: isMobile ? 'short' : 'long',
        day: 'numeric',
        month: isMobile ? 'short' : 'long'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Chargement des messages...
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className={`text-center ${isMobile ? 'max-w-xs' : 'max-w-sm'} mx-auto ${isMobile ? 'p-4' : 'p-8'}`}>
          <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center`}>
            <MessageCircle className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Début de votre conversation
          </h3>
          
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Envoyez votre premier message pour commencer à discuter ! 
          </p>
          
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border border-purple-800/30' : 'bg-purple-50 border border-purple-200'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
              💡 Cette conversation a été créée suite à l'acceptation d'une demande de miroir
            </p>
          </div>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);
  const groupEntries = Object.entries(messageGroups).sort(([a], [b]) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div 
      ref={scrollAreaRef}
      className={`h-full overflow-y-auto ${isMobile ? 'p-3' : 'p-4'} space-y-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{ scrollBehavior: 'smooth' }}
    >
      {groupEntries.map(([dateString, dayMessages]) => (
        <div key={dateString} className="space-y-3">
          
          {/* Séparateur de date */}
          <div className="flex items-center justify-center">
            <div className={`${isMobile ? 'px-3 py-1.5' : 'px-4 py-2'} rounded-full ${isMobile ? 'text-xs' : 'text-xs'} font-medium ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-400 border border-gray-700' 
                : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
            }`}>
              {formatDateHeader(dateString)}
            </div>
          </div>

          {/* Messages du jour */}
          <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
            {dayMessages.map((message, index) => {
              const prevMessage = index > 0 ? dayMessages[index - 1] : null;
              const isGrouped = prevMessage && 
                prevMessage.sender_id === message.sender_id &&
                new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 5 * 60 * 1000; // 5 minutes

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onReactToMessage={onReactToMessage}
                  onDeleteMessage={onDeleteMessage}
                  isDarkMode={isDarkMode}
                  isGrouped={isGrouped}
                  isMobile={isMobile}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Ancre pour auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
};