import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { ChatWindow } from './ChatWindow';
import { ConversationList } from './ConversationList';

interface ChatPageProps {
  isDarkMode: boolean;
}

export const ChatPage: React.FC<ChatPageProps> = ({ isDarkMode }) => {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [isMobileView, setIsMobileView] = useState(false);

  // ✅ UTILISER LE HOOK CORRIGÉ - TOUTES LES VARIABLES DISPONIBLES
  const {
    conversations,
    chatStats,
    isLoadingConversations,
    loadConversations
  } = useChat({ conversationId });

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!user) return <div>Connexion requise</div>;

  // ✅ VRAIE CONVERSATION AU LIEU DU MOCK
  const currentConversation = conversationId 
    ? conversations.find(conv => conv.id === conversationId) || null
    : null;

  // ✅ NAVIGATION RÉELLE ENTRE CONVERSATIONS
  const handleSelectConversation = (conversation: any) => {
    navigate(`/chat/${conversation.id}`);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex`}>

      {/* Sidebar conversations */}
      <div className={`${isMobileView ? 'w-full' : 'w-1/3 min-w-[350px]'} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <ConversationList
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={handleSelectConversation}
          isDarkMode={isDarkMode}
          chatStats={chatStats}
          isLoading={isLoadingConversations}
          onRefresh={loadConversations}
          isMobile={isMobileView}
        />
      </div>

      {/* Zone chat */}
      <div className={`${isMobileView ? 'hidden' : 'flex-1'} flex flex-col`}>
        {currentConversation ? (
          <ChatWindow
            conversation={currentConversation}
            isDarkMode={isDarkMode}
            isMobile={isMobileView}
          />
        ) : (
          <div className={`flex-1 flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
              <p>Choisissez une conversation dans la liste pour commencer à chatter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};