// =============================================
// LISTE DES CONVERSATIONS MOBILE - frontend/src/components/chat/ConversationList.tsx
// =============================================

import React, { useState } from 'react';
import { Search, MoreVertical, RefreshCw, MessageCircle, Clock, ArrowLeft } from 'lucide-react';
import { chatService } from '../../services/chatService';
import type { Conversation, ChatStats } from '../../../../shared/types/chat';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  isDarkMode: boolean;
  chatStats: ChatStats;
  isLoading: boolean;
  onRefresh: () => void;
  isMobile?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversation,
  onSelectConversation,
  isDarkMode,
  chatStats,
  isLoading,
  onRefresh,
  isMobile = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtrer les conversations par recherche
  const filteredConversations = conversations.filter(conv =>
    conv.other_participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.last_message?.content && conv.last_message.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'maintenant';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) return 'Nouvelle conversation';
    
    const msg = conversation.last_message;
    if (msg.message_type === 'system') return msg.content || 'Message système';
    if (msg.message_type === 'image') return '📷 Image';
    if (msg.message_type === 'voice') return '🎵 Message vocal';
    
    const content = msg.content || '';
    return content.length > (isMobile ? 35 : 40) ? content.substring(0, isMobile ? 35 : 40) + '...' : content;
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      
      {/* Header */}
      <div className={`${isMobile ? 'p-3' : 'p-4'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Messages
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              {chatStats.total_unread_conversations > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {chatStats.total_unread_conversations} non lue{chatStats.total_unread_conversations !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            } ${(isLoading || isRefreshing) ? 'opacity-50' : ''}`}
            title="Actualiser"
          >
            <RefreshCw className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isMobile ? 'pl-9 pr-3 py-2.5 text-sm' : 'pl-10 pr-4 py-2'} rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Chargement des conversations...
            </p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            {conversations.length === 0 ? (
              // Aucune conversation
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <MessageCircle className={`w-8 h-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Aucune conversation
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ${isMobile ? 'px-4' : ''}`}>
                    Les conversations se créent automatiquement quand quelqu'un accepte votre demande de miroir !
                  </p>
                </div>
              </div>
            ) : (
              // Pas de résultats de recherche
              <div className="space-y-4">
                <Search className={`w-12 h-12 mx-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Aucun résultat
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Aucune conversation ne correspond à "{searchQuery}"
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={isMobile ? 'space-y-0' : 'space-y-1'}>
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full text-left ${isMobile ? 'p-3' : 'p-4'} transition-all duration-200 border-l-4 ${
                  isMobile ? 'active:scale-[0.98]' : 'hover:scale-[1.02]'
                } ${
                  currentConversation?.id === conversation.id
                    ? `border-l-purple-500 ${
                        isDarkMode 
                          ? 'bg-purple-900/30 shadow-lg shadow-purple-900/20' 
                          : 'bg-purple-50 shadow-lg shadow-purple-500/10'
                      }`
                    : `border-l-transparent ${
                        isDarkMode 
                          ? 'hover:bg-gray-700/50 active:bg-gray-700/70' 
                          : 'hover:bg-gray-50 active:bg-gray-100'
                      }`
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {conversation.other_participant?.avatar_url ? (
                      <img
                        src={conversation.other_participant.avatar_url}
                        alt={conversation.other_participant.name}
                        className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover ring-2 ring-white/10`}
                      />
                    ) : (
                      <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-white/10`}>
                        <span className="text-white font-bold text-lg">
                          {conversation.other_participant?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    
                    {/* Indicateur en ligne (placeholder) */}
                    <div className={`absolute -bottom-0 -right-0 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'} bg-green-500 border-2 border-white dark:border-gray-800 rounded-full`}></div>
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold truncate ${isMobile ? 'text-sm' : 'text-base'} ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      } ${currentConversation?.id === conversation.id ? 'text-purple-300' : ''}`}>
                        {conversation.other_participant?.name || 'Utilisateur'}
                      </h4>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formatLastMessageTime(conversation.last_message_at)}
                        </span>
                        
                        {(conversation.unread_count || 0) > 0 && (
                          <span className={`inline-flex items-center justify-center px-2 py-1 ${isMobile ? 'text-xs' : 'text-xs'} font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px]`}>
                            {conversation.unread_count! > 99 ? '99+' : conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} truncate mr-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      } ${currentConversation?.id === conversation.id ? 'text-purple-200' : ''}`}>
                        {getLastMessagePreview(conversation)}
                      </p>
                      
                      {conversation.last_message?.edited_at && (
                        <span className={`text-xs italic ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          modifié
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu options (masqué sur mobile pour l'espace) */}
                  {!isMobile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Menu options conversation
                      }}
                      className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                        isDarkMode 
                          ? 'hover:bg-gray-600 text-gray-400' 
                          : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer avec statistiques (masqué sur mobile si pas de place) */}
      {conversations.length > 0 && !isMobile && (
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <MessageCircle className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {conversations.length}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Mis à jour
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};