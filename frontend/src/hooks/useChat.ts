// =============================================
// HOOK USECHAT OPTIMISÉ - VERSION CORRIGÉE
// =============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import { connectAffiniaSocket } from '../services/chatWebSocket';
import type { Message, Conversation } from '../../../shared/types/chat';

interface UseChatOptimizedOptions {
  conversationId?: string;
}

export function useChat({ conversationId }: UseChatOptimizedOptions = {}) {
  const { user } = useAuth();
  
  // ✅ TOUS LES STATES - AVANT LE RETURN !
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // ✅ CONVERSATIONS STATES - DÉPLACÉS AVANT LE RETURN
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatStats, setChatStats] = useState({ total_unread_conversations: 0 });
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const socketRef = useRef<ReturnType<typeof connectAffiniaSocket> | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  // ✅ CHARGEMENT DES CONVERSATIONS
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingConversations(true);
      const convs = await chatService.getConversations();
      setConversations(convs);
      console.log('✅ useChat: Conversations chargées:', convs.length);
    } catch (error) {
      console.error('❌ useChat: Erreur chargement conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  // ✅ CHARGEMENT STATS CHAT
  const loadChatStats = useCallback(async () => {
    if (!user) return;

    try {
      const stats = await chatService.getChatStats();
      setChatStats(stats);
    } catch (error) {
      console.error('❌ useChat: Erreur stats:', error);
    }
  }, [user]);

  // ✅ CHARGEMENT AU MONTAGE
  useEffect(() => {
    if (user) {
      loadConversations();
      loadChatStats();
    }
  }, [user, loadConversations, loadChatStats]);

  // ✅ CHARGEMENT INITIAL MESSAGES (une seule fois par conversation)
  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([]);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    chatService.getMessages(conversationId)
      .then((messageList) => {
        if (!mounted) return;

        const enrichedMessages = messageList.map(msg => ({
          ...msg,
          is_own_message: msg.sender_id === user.id,
          is_expired: chatService.isMessageExpired(msg)
        }));

        const sorted = enrichedMessages.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        setMessages(sorted);

        const lastMessage = sorted[sorted.length - 1];
        if (lastMessage && !lastMessage.is_own_message) {
          lastSeenIdRef.current = lastMessage.id;
          chatService.markAsRead(conversationId, lastMessage.id);
        }
      })
      .catch((e) => {
        if (!mounted) return;
        console.error('❌ Erreur chargement messages:', e);
        setError(e.message || 'Erreur chargement');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [conversationId, user]);

  // ✅ CONNEXION WEBSOCKET (écoute temps réel)
  useEffect(() => {
    if (!conversationId || !user) {
      setIsConnected(false);
      return;
    }

    const getToken = async () => {
      try {
        const { authManager } = await import('../services/authManager');
        return await authManager.getAccessToken();
      } catch (e) {
        console.error('❌ Erreur récupération token:', e);
        return null;
      }
    };

    const connectSocket = async () => {
      const token = await getToken();
      if (!token) return;

      const socket = connectAffiniaSocket(conversationId, token, {
        onConnect: () => {
          console.log('✅ WebSocket connecté conversation:', conversationId);
          setIsConnected(true);
          setError(null);
        },

        onDisconnect: () => {
          console.log('❌ WebSocket déconnecté');
          setIsConnected(false);
        },

        onError: (error) => {
          console.error('❌ Erreur WebSocket:', error);
          setIsConnected(false);
          setError('Connexion temps réel interrompue');
        },

        onNewMessage: (message) => {
          console.log('📨 Nouveau message reçu:', message.id);

          const enrichedMessage = {
            ...message,
            is_own_message: message.sender_id === user.id,
            is_expired: chatService.isMessageExpired(message)
          };

          setMessages(prev => {
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, enrichedMessage];
          });

          if (!enrichedMessage.is_own_message) {
            tryMarkAsRead(message.id);
          }
        },

        onMessageUpdated: (message) => {
          console.log('✏️ Message modifié:', message.id);
          setMessages(prev =>
            prev.map(m => m.id === message.id ? {
              ...message,
              is_own_message: m.is_own_message,
              is_expired: m.is_expired
            } : m)
          );
        },

        onMessageDeleted: (messageId) => {
          console.log('🗑️ Message supprimé:', messageId);
          setMessages(prev => prev.filter(m => m.id !== messageId));
        },

        onTyping: ({ userId, userName, isTyping }) => {
          console.log(`⌨️ ${userName} ${isTyping ? 'tape' : 'arrête'}`);
        }
      });

      socketRef.current = socket;
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [conversationId, user]);

  // ✅ ENVOI MESSAGE (sans reload !)
  const sendMessage = useCallback(async (content: string, replyToId?: string) => {
    if (!conversationId || !user || !content.trim()) return;

    setSending(true);
    setError(null);

    try {
      const newMessage = await chatService.sendMessage(conversationId, {
        content: content.trim(),
        reply_to_id: replyToId
      });

      console.log('✅ Message envoyé:', newMessage.id);

      const enrichedMessage = {
        ...newMessage,
        is_own_message: true,
        is_expired: false
      };

      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, enrichedMessage];
      });

      tryMarkAsRead(newMessage.id);

    } catch (e: any) {
      console.error('❌ Erreur envoi message:', e);
      setError(e.message || 'Erreur envoi');
      throw e;
    } finally {
      setSending(false);
    }
  }, [conversationId, user]);

  const tryMarkAsRead = useCallback((messageId?: string) => {
    if (!conversationId) return;

    const id = messageId || lastSeenIdRef.current;
    if (!id) return;

    lastSeenIdRef.current = id;

    chatService.markAsRead(conversationId, id).catch(console.error);

    if (socketRef.current) {
      socketRef.current.markAsReadRealtime(id);
    }
  }, [conversationId]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (socketRef.current) {
      socketRef.current.sendTyping(isTyping);
    }
  }, []);

  // ✅ RETURN COMPLET - TOUTES LES VARIABLES DISPONIBLES
  return {
    // Messages et chat actuel
    messages,
    loading,
    sending,
    error,
    isConnected,
    sendMessage,
    tryMarkAsRead,
    sendTypingIndicator,
    clearError: () => setError(null),
    
    // Conversations et stats
    conversations,
    chatStats,
    isLoadingConversations,
    loadConversations,
    refreshConversations: loadConversations
  };
}
