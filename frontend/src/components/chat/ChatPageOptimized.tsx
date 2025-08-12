// Version simplifiée pour test
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChatWindowOptimized } from './ChatWindowOptimized';

interface ChatPageOptimizedProps {
  isDarkMode: boolean;
}

export const ChatPageOptimized: React.FC<ChatPageOptimizedProps> = ({ isDarkMode }) => {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId?: string }>();

  if (!user || !conversationId) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Sélectionnez une conversation
        </p>
      </div>
    );
  }

  // Mock conversation pour test
  const mockConversation = {
    id: conversationId,
    other_participant: {
      id: 'test',
      name: 'Michele Terrana',
      avatar_url: null
    },
    last_message_at: new Date().toISOString(),
    unread_count: 0
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ChatWindowOptimized
        conversation={mockConversation}
        isDarkMode={isDarkMode}
        isMobile={window.innerWidth <= 768}
      />
    </div>
  );
};
