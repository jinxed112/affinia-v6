// =============================================
// HOOK WEBSOCKET CHAT - frontend/src/hooks/useChatWebSocket.ts
// =============================================

import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatWebSocketService } from '../services/chatWebSocket';
import type { Message, Conversation } from '../../../shared/types/chat';

interface ChatWebSocketHook {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTypingIndicator: (conversationId: string, isTyping: boolean) => void;
}

interface WebSocketEventHandlers {
  onNewMessage?: (data: { conversationId: string; message: Message }) => void;
  onMessageUpdated?: (data: { conversationId: string; message: Message }) => void;
  onMessageDeleted?: (data: { conversationId: string; messageId: string }) => void;
  onMessageReaction?: (data: { 
    conversationId: string; 
    messageId: string; 
    emoji: string; 
    action: 'add' | 'remove'; 
    userId: string; 
  }) => void;
  onNewConversation?: (data: { conversation: Conversation }) => void;
  onUserTyping?: (data: { 
    conversationId: string; 
    userId: string; 
    userName: string; 
    isTyping: boolean; 
  }) => void;
  onUserOnline?: (data: { userId: string; isOnline: boolean }) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (error: Error) => void;
}

export const useChatWebSocket = (handlers: WebSocketEventHandlers = {}): ChatWebSocketHook => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  // ============ ÉVÉNEMENTS WEBSOCKET ============

  useEffect(() => {
    // Événements de connexion
    const handleConnect = () => {
      console.log('✅ useChatWebSocket: Connecté');
      setIsConnected(true);
      handlers.onConnect?.();
    };

    const handleDisconnect = (reason: string) => {
      console.log('❌ useChatWebSocket: Déconnecté:', reason);
      setIsConnected(false);
      handlers.onDisconnect?.(reason);
    };

    const handleConnectError = (error: Error) => {
      console.error('❌ useChatWebSocket: Erreur connexion:', error);
      setIsConnected(false);
      handlers.onConnectError?.(error);
    };

    // Événements de messages
    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      console.log('📨 useChatWebSocket: Nouveau message');
      handlers.onNewMessage?.(data);
    };

    const handleMessageUpdated = (data: { conversationId: string; message: Message }) => {
      console.log('✏️ useChatWebSocket: Message modifié');
      handlers.onMessageUpdated?.(data);
    };

    const handleMessageDeleted = (data: { conversationId: string; messageId: string }) => {
      console.log('🗑️ useChatWebSocket: Message supprimé');
      handlers.onMessageDeleted?.(data);
    };

    const handleMessageReaction = (data: any) => {
      console.log('😊 useChatWebSocket: Réaction message');
      handlers.onMessageReaction?.(data);
    };

    // Événements de conversations
    const handleNewConversation = (data: { conversation: Conversation }) => {
      console.log('💬 useChatWebSocket: Nouvelle conversation');
      handlers.onNewConversation?.(data);
    };

    // Événements de présence
    const handleUserTyping = (data: any) => {
      handlers.onUserTyping?.(data);
    };

    const handleUserOnline = (data: any) => {
      handlers.onUserOnline?.(data);
    };

    // Abonner aux événements
    chatWebSocketService.on('connect', handleConnect);
    chatWebSocketService.on('disconnect', handleDisconnect);
    chatWebSocketService.on('connect_error', handleConnectError);
    chatWebSocketService.on('new_message', handleNewMessage);
    chatWebSocketService.on('message_updated', handleMessageUpdated);
    chatWebSocketService.on('message_deleted', handleMessageDeleted);
    chatWebSocketService.on('message_reaction', handleMessageReaction);
    chatWebSocketService.on('new_conversation', handleNewConversation);
    chatWebSocketService.on('user_typing', handleUserTyping);
    chatWebSocketService.on('user_online', handleUserOnline);

    // Nettoyage
    return () => {
      chatWebSocketService.off('connect', handleConnect);
      chatWebSocketService.off('disconnect', handleDisconnect);
      chatWebSocketService.off('connect_error', handleConnectError);
      chatWebSocketService.off('new_message', handleNewMessage);
      chatWebSocketService.off('message_updated', handleMessageUpdated);
      chatWebSocketService.off('message_deleted', handleMessageDeleted);
      chatWebSocketService.off('message_reaction', handleMessageReaction);
      chatWebSocketService.off('new_conversation', handleNewConversation);
      chatWebSocketService.off('user_typing', handleUserTyping);
      chatWebSocketService.off('user_online', handleUserOnline);
    };
  }, [handlers]);

  // ============ CONNEXION AUTOMATIQUE ============

  useEffect(() => {
    if (user && !isConnected) {
      console.log('🔌 useChatWebSocket: Connexion automatique pour:', user.id);
      chatWebSocketService.connect(user.id).catch(error => {
        console.error('❌ useChatWebSocket: Erreur connexion auto:', error);
      });
    }

    // Déconnecter quand plus d'utilisateur
    return () => {
      if (!user) {
        console.log('🔌 useChatWebSocket: Déconnexion (plus d\'utilisateur)');
        chatWebSocketService.disconnect();
        setIsConnected(false);
      }
    };
  }, [user, isConnected]);

  // ============ ACTIONS ============

  const connect = useCallback(() => {
    if (user) {
      console.log('🔌 useChatWebSocket: Connexion manuelle');
      chatWebSocketService.connect(user.id).catch(error => {
        console.error('❌ useChatWebSocket: Erreur connexion manuelle:', error);
      });
    }
  }, [user]);

  const disconnect = useCallback(() => {
    console.log('🔌 useChatWebSocket: Déconnexion manuelle');
    chatWebSocketService.disconnect();
    setIsConnected(false);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    console.log('🏠 useChatWebSocket: Rejoindre conversation:', conversationId);
    chatWebSocketService.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    console.log('🚪 useChatWebSocket: Quitter conversation:', conversationId);
    chatWebSocketService.leaveConversation(conversationId);
  }, []);

  const sendTypingIndicator = useCallback((conversationId: string, isTyping: boolean) => {
    chatWebSocketService.sendTypingIndicator(conversationId, isTyping);
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendTypingIndicator
  };
};

// ============ HOOK SIMPLIFIÉ POUR LES COMPOSANTS ============

/**
 * Hook simplifié pour intégrer les WebSockets dans les composants de chat
 */
export const useChatRealtime = (
  currentConversationId?: string,
  onNewMessage?: (message: Message) => void,
  onMessageUpdated?: (message: Message) => void,
  onMessageDeleted?: (messageId: string) => void
) => {
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const webSocket = useChatWebSocket({
    onNewMessage: (data) => {
      // Seulement pour la conversation courante
      if (data.conversationId === currentConversationId) {
        onNewMessage?.(data.message);
      }
    },
    
    onMessageUpdated: (data) => {
      if (data.conversationId === currentConversationId) {
        onMessageUpdated?.(data.message);
      }
    },
    
    onMessageDeleted: (data) => {
      if (data.conversationId === currentConversationId) {
        onMessageDeleted?.(data.messageId);
      }
    },
    
    onUserTyping: (data) => {
      if (data.conversationId === currentConversationId) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          if (data.isTyping) {
            return [...filtered, { userId: data.userId, userName: data.userName }];
          }
          return filtered;
        });
      }
    },
    
    onUserOnline: (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    }
  });

  // Rejoindre/quitter la conversation courante
  useEffect(() => {
    if (currentConversationId && webSocket.isConnected) {
      webSocket.joinConversation(currentConversationId);
      
      return () => {
        webSocket.leaveConversation(currentConversationId);
      };
    }
  }, [currentConversationId, webSocket.isConnected]);

  return {
    ...webSocket,
    typingUsers,
    onlineUsers,
    isUserOnline: (userId: string) => onlineUsers.has(userId)
  };
};