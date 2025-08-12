import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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

  // ✅ ÉTAT MOBILE : true = sidebar, false = chat
  const [showMobileSidebar, setShowMobileSidebar] = useState(!conversationId);

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

  // ✅ MISE À JOUR SIDEBAR MOBILE QUAND CONVERSATION CHANGE
  useEffect(() => {
    if (isMobileView) {
      setShowMobileSidebar(!conversationId);
    }
  }, [conversationId, isMobileView]);

  if (!user) return <div>Connexion requise</div>;

  const currentConversation = conversationId 
    ? conversations.find(conv => conv.id === conversationId) || null
    : null;

  // ✅ NAVIGATION MOBILE OPTIMISÉE
  const handleSelectConversation = (conversation: any) => {
    navigate(`/chat/${conversation.id}`);
    if (isMobileView) {
      setShowMobileSidebar(false); // Cacher sidebar et montrer chat
    }
  };

  // ✅ RETOUR À LA LISTE SUR MOBILE
  const handleBackToList = () => {
    if (isMobileView) {
      navigate('/chat');
      setShowMobileSidebar(true);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex`}>

      {/* ✅ SIDEBAR - Cachée sur mobile quand conversation ouverte */}
      <div className={`
        ${isMobileView 
          ? (showMobileSidebar ? 'w-full' : 'hidden') 
          : 'w-1/3 min-w-[350px]'
        } 
        border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
      `}>
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

      {/* ✅ ZONE CHAT - Plein écran sur mobile quand conversation ouverte */}
      <div className={`
        ${isMobileView 
          ? (showMobileSidebar ? 'hidden' : 'w-full') 
          : 'flex-1'
        } 
        flex flex-col
      `}>
        {currentConversation ? (
          <>
            {/* ✅ BOUTON RETOUR MOBILE */}
            {isMobileView && (
              <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <button
                  onClick={handleBackToList}
                  className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Conversations</span>
                </button>
              </div>
            )}
            
            {/* CHAT WINDOW */}
            <ChatWindow
              conversation={currentConversation}
              isDarkMode={isDarkMode}
              isMobile={isMobileView}
            />
          </>
        ) : (
          // MESSAGE SÉLECTION (uniquement sur desktop)
          !isMobileView && (
            <div className={`flex-1 flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
                <p>Choisissez une conversation dans la liste pour commencer à chatter</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
