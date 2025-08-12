// =============================================
// HOOK CHAT TEMPS RÉEL CORRIGÉ - frontend/src/hooks/useChat.ts
// =============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import { chatWebSocketService } from '../services/chatWebSocket';
import type { Conversation, Message, ChatStats, SendMessageParams } from '../../../shared/types/chat';

// Interface pour les indicateurs de frappe
interface TypingUser {
  userId: string;
  userName: string;
  conversationId: string;
  timestamp: number;
}

export const useChat = () => {
  const { user } = useAuth();
  
  // États principaux
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatStats, setChatStats] = useState<ChatStats>({ total_unread_conversations: 0 });
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // États temps réel
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  // Refs pour éviter les re-renders excessifs et références circulaires
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isTypingRef = useRef(false);
  const lastTypingTimeRef = useRef(0);
  
  // ✅ FIX : Refs pour éviter les références circulaires
  const loadConversationsRef = useRef<(() => Promise<void>) | null>(null);
  const currentConversationRef = useRef<Conversation | null>(null);

  // Synchroniser les refs avec les states
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  // ============ MÉTHODES PRINCIPALES (ordre correct) ============

  /**
   * Charger les conversations
   */
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('🔄 useChat: Chargement conversations...');

      const data = await chatService.getConversations();
      setConversations(data);

      console.log('✅ useChat: Conversations chargées:', data.length);
    } catch (error) {
      console.error('❌ useChat: Erreur chargement conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // ✅ Assigner la ref après définition
  useEffect(() => {
    loadConversationsRef.current = loadConversations;
  }, [loadConversations]);

  /**
   * Charger les messages d'une conversation
   */
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      setIsLoadingMessages(true);
      console.log('🔄 useChat: Chargement messages conversation:', conversationId);

      const data = await chatService.getMessages(conversationId);

      // Enrichir les messages
      const enrichedMessages = data.map(msg => ({
        ...msg,
        is_own_message: msg.sender_id === user.id,
        is_expired: chatService.isMessageExpired(msg)
      }));

      setMessages(enrichedMessages);

      // Marquer comme lu si des messages existent
      if (enrichedMessages.length > 0) {
        const lastMessage = enrichedMessages[enrichedMessages.length - 1];
        if (!lastMessage.is_own_message) {
          await chatService.markAsRead(conversationId, lastMessage.id);
          chatWebSocketService.markAsReadRealtime(conversationId, lastMessage.id);
        }
      }

      console.log('✅ useChat: Messages chargés:', enrichedMessages.length);
    } catch (error) {
      console.error('❌ useChat: Erreur chargement messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  /**
   * Charger les stats
   */
  const loadChatStats = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 useChat: Chargement stats...');
      const stats = await chatService.getChatStats();
      setChatStats(stats);
      console.log('✅ useChat: Stats chargées:', stats);
    } catch (error) {
      console.error('❌ useChat: Erreur chargement stats:', error);
    }
  }, [user]);

  // ============ WEBSOCKET SETUP (après les méthodes principales) ============

  /**
   * Nettoyer les listeners WebSocket
   */
  const cleanupWebSocketListeners = useCallback(() => {
    console.log('🧹 useChat: Nettoyage listeners WebSocket');
    
    // Nettoyer tous les timeouts de frappe
    typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    typingTimeoutRef.current.clear();
  }, []);

  /**
   * Configurer les listeners WebSocket
   */
  const setupWebSocketListeners = useCallback(() => {
    console.log('🎧 useChat: Configuration listeners WebSocket...');

    // ============ ÉVÉNEMENTS CONNEXION ============

    chatWebSocketService.on('connect', () => {
      console.log('✅ useChat: WebSocket connecté');
      setIsConnected(true);
    });

    chatWebSocketService.on('disconnect', (reason) => {
      console.log('❌ useChat: WebSocket déconnecté:', reason);
      setIsConnected(false);
    });

    chatWebSocketService.on('connect_error', (error) => {
      console.error('❌ useChat: Erreur connexion WebSocket:', error);
      setIsConnected(false);
    });

    // ============ ÉVÉNEMENTS MESSAGES ============

    chatWebSocketService.on('new_message', ({ conversationId, message }) => {
      console.log('📨 useChat: Nouveau message reçu');

      // Enrichir le message
      const enrichedMessage = {
        ...message,
        is_own_message: message.sender_id === user?.id,
        is_expired: chatService.isMessageExpired(message)
      };

      // Ajouter à la liste si c'est la conversation courante
      if (currentConversationRef.current?.id === conversationId) {
        setMessages(prev => [...prev, enrichedMessage]);
        
        // Marquer comme lu automatiquement si visible
        if (!enrichedMessage.is_own_message) {
          chatService.markAsRead(conversationId, message.id);
          chatWebSocketService.markAsReadRealtime(conversationId, message.id);
        }
      }

      // ✅ FIX : Utiliser la ref pour éviter la référence circulaire
      if (loadConversationsRef.current) {
        loadConversationsRef.current();
      }
    });

    chatWebSocketService.on('message_updated', ({ conversationId, message }) => {
      console.log('✏️ useChat: Message modifié reçu');
      
      if (currentConversationRef.current?.id === conversationId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === message.id
              ? {
                  ...message,
                  is_own_message: msg.is_own_message,
                  is_expired: msg.is_expired
                }
              : msg
          )
        );
      }
    });

    chatWebSocketService.on('message_deleted', ({ conversationId, messageId }) => {
      console.log('🗑️ useChat: Message supprimé reçu');
      
      if (currentConversationRef.current?.id === conversationId) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    });

    chatWebSocketService.on('message_reaction', ({ conversationId, messageId, emoji, action, userId }) => {
      console.log('😊 useChat: Réaction reçue');
      
      if (currentConversationRef.current?.id === conversationId) {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.id === messageId) {
              const reactions = { ...msg.reactions };
              
              if (action === 'add') {
                if (!reactions[emoji]) reactions[emoji] = [];
                if (!reactions[emoji].includes(userId)) {
                  reactions[emoji].push(userId);
                }
              } else {
                if (reactions[emoji]) {
                  reactions[emoji] = reactions[emoji].filter(id => id !== userId);
                  if (reactions[emoji].length === 0) {
                    delete reactions[emoji];
                  }
                }
              }
              
              return { ...msg, reactions };
            }
            return msg;
          })
        );
      }
    });

    // ============ ÉVÉNEMENTS CONVERSATIONS ============

    chatWebSocketService.on('new_conversation', ({ conversation }) => {
      console.log('💬 useChat: Nouvelle conversation reçue');
      if (loadConversationsRef.current) {
        loadConversationsRef.current();
      }
    });

    // ============ ÉVÉNEMENTS PRÉSENCE ============

    chatWebSocketService.on('user_typing', ({ conversationId, userId, userName, isTyping }) => {
      console.log(`⌨️ useChat: ${userName} ${isTyping ? 'tape' : 'arrête'} dans ${conversationId}`);
      
      if (userId === user?.id) return; // Ignorer ses propres indicateurs
      
      setTypingUsers(prev => {
        if (isTyping) {
          // Ajouter ou mettre à jour l'utilisateur qui tape
          const filtered = prev.filter(u => u.userId !== userId || u.conversationId !== conversationId);
          return [...filtered, {
            userId,
            userName,
            conversationId,
            timestamp: Date.now()
          }];
        } else {
          // Retirer l'utilisateur
          return prev.filter(u => u.userId !== userId || u.conversationId !== conversationId);
        }
      });

      // Auto-nettoyage après 5 secondes
      if (isTyping) {
        const key = `${userId}-${conversationId}`;
        const existingTimeout = typingTimeoutRef.current.get(key);
        if (existingTimeout) clearTimeout(existingTimeout);
        
        const timeout = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== userId || u.conversationId !== conversationId));
          typingTimeoutRef.current.delete(key);
        }, 5000);
        
        typingTimeoutRef.current.set(key, timeout);
      }
    });

    chatWebSocketService.on('user_online', ({ userId, isOnline }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (isOnline) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

  }, [user]); // ✅ Dépendances minimales

  /**
   * Initialiser la connexion WebSocket
   */
  const initializeWebSocket = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🌐 useChat: Initialisation WebSocket...');
      
      // Se connecter au WebSocket
      await chatWebSocketService.connect(user.id);
      setIsConnected(true);

      console.log('✅ useChat: WebSocket connecté');

    } catch (error) {
      console.error('❌ useChat: Erreur connexion WebSocket:', error);
      setIsConnected(false);
    }
  }, [user]);

  // ============ ACTIONS UTILISATEUR ============

  /**
   * Sélectionner une conversation
   */
  const selectConversation = useCallback((conversation: Conversation) => {
    console.log('👆 useChat: Sélection conversation:', conversation.id);
    
    // Quitter l'ancienne conversation
    if (currentConversation) {
      chatWebSocketService.leaveConversation(currentConversation.id);
    }
    
    // Entrer dans la nouvelle conversation
    setCurrentConversation(conversation);
    chatWebSocketService.joinConversation(conversation.id);
    loadMessages(conversation.id);
    
    // Reset des indicateurs de frappe pour cette conversation
    setTypingUsers(prev => prev.filter(u => u.conversationId !== conversation.id));
  }, [currentConversation, loadMessages]);

  /**
   * Envoyer un message
   */
  const sendMessage = useCallback(async (conversationId: string, params: SendMessageParams) => {
    if (!user) return;

    try {
      console.log('📤 useChat: Envoi message:', { conversationId, params });

      // Arrêter l'indicateur de frappe
      if (isTypingRef.current) {
        chatWebSocketService.sendTypingIndicator(conversationId, false);
        isTypingRef.current = false;
      }

      const newMessage = await chatService.sendMessage(conversationId, params);

      // Feedback immédiat
      const enrichedMessage = {
        ...newMessage,
        is_own_message: true,
        is_expired: false
      };

      setMessages(prev => [...prev, enrichedMessage]);

      // Recharger les conversations
      if (loadConversationsRef.current) {
        await loadConversationsRef.current();
      }

      console.log('✅ useChat: Message envoyé:', newMessage.id);

    } catch (error) {
      console.error('❌ useChat: Erreur envoi message:', error);
      throw error;
    }
  }, [user]);

  /**
   * Réagir à un message
   */
  const reactToMessage = useCallback(async (messageId: string, emoji: string, action: 'add' | 'remove' = 'add') => {
    try {
      await chatService.reactToMessage(messageId, emoji, action);

      // Update optimiste
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === messageId && user) {
            const reactions = { ...msg.reactions };
            
            if (action === 'add') {
              if (!reactions[emoji]) reactions[emoji] = [];
              if (!reactions[emoji].includes(user.id)) {
                reactions[emoji].push(user.id);
              }
            } else {
              if (reactions[emoji]) {
                reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
                if (reactions[emoji].length === 0) {
                  delete reactions[emoji];
                }
              }
            }
            
            return { ...msg, reactions };
          }
          return msg;
        })
      );

    } catch (error) {
      console.error('❌ useChat: Erreur réaction message:', error);
      throw error;
    }
  }, [user]);

  /**
   * Supprimer un message
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('❌ useChat: Erreur suppression message:', error);
      throw error;
    }
  }, []);

  /**
   * Marquer comme lu
   */
  const markAsRead = useCallback(async (conversationId: string, lastMessageId: string) => {
    try {
      await chatService.markAsRead(conversationId, lastMessageId);
      chatWebSocketService.markAsReadRealtime(conversationId, lastMessageId);
      
      if (loadConversationsRef.current) {
        await loadConversationsRef.current();
      }
    } catch (error) {
      console.error('❌ useChat: Erreur marquage lu:', error);
    }
  }, []);

  /**
   * Créer une nouvelle conversation
   */
  const createConversation = useCallback(async (participantId: string) => {
    if (!user) return null;

    try {
      const conversation = await chatService.createConversation(participantId);

      if (loadConversationsRef.current) {
        await loadConversationsRef.current();
      }
      selectConversation(conversation);

      return conversation;
    } catch (error) {
      console.error('❌ useChat: Erreur création conversation:', error);
      throw error;
    }
  }, [user, selectConversation]);

  // ============ INDICATEURS DE FRAPPE ============

  const sendTypingIndicator = useCallback((conversationId: string, isTyping: boolean) => {
    if (!isConnected || !currentConversation) return;

    const now = Date.now();
    
    if (isTyping) {
      if (now - lastTypingTimeRef.current < 1000) return;
      lastTypingTimeRef.current = now;
    }

    if (isTypingRef.current !== isTyping) {
      isTypingRef.current = isTyping;
      chatWebSocketService.sendTypingIndicator(conversationId, isTyping);
    }
  }, [isConnected, currentConversation]);

  const getCurrentTypingUsers = useCallback(() => {
    if (!currentConversation) return [];
    
    return typingUsers.filter(u => 
      u.conversationId === currentConversation.id &&
      Date.now() - u.timestamp < 5000
    );
  }, [currentConversation, typingUsers]);

  // ============ EFFECTS ============

  useEffect(() => {
    if (user) {
      console.log('🏁 useChat: Init pour utilisateur:', user.id);
      
      loadConversations();
      loadChatStats();
      initializeWebSocket();
      setupWebSocketListeners();
      
    } else {
      console.log('🛑 useChat: Reset');
      
      cleanupWebSocketListeners();
      chatWebSocketService.disconnect();
      
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      setChatStats({ total_unread_conversations: 0 });
      setIsConnected(false);
      setTypingUsers([]);
      setOnlineUsers(new Set());
    }

    return () => {
      cleanupWebSocketListeners();
    };
  }, [user, loadConversations, loadChatStats, initializeWebSocket, setupWebSocketListeners, cleanupWebSocketListeners]);

  useEffect(() => {
    if (currentConversation && conversations.length > 0) {
      const stillExists = conversations.find(c => c.id === currentConversation.id);
      if (!stillExists) {
        setCurrentConversation(null);
        setMessages([]);
      }
    }
  }, [conversations, currentConversation]);

  // ============ MÉTHODES UTILITAIRES ============

  const getChatStats = useCallback(async (): Promise<ChatStats> => {
    try {
      return await chatService.getChatStats();
    } catch (error) {
      return { total_unread_conversations: 0 };
    }
  }, []);

  const refreshConversations = useCallback(() => {
    loadConversations();
  }, [loadConversations]);

  const refreshMessages = useCallback(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation, loadMessages]);

  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return {
    // État principal
    conversations,
    currentConversation,
    messages,
    chatStats,
    isLoading,
    isLoadingMessages,
    isConnected,

    // État temps réel
    typingUsers: getCurrentTypingUsers(),
    onlineUsers,

    // Actions principales
    loadConversations,
    loadMessages,
    loadChatStats,
    selectConversation,
    sendMessage,
    reactToMessage,
    deleteMessage,
    markAsRead,
    createConversation,

    // Actions temps réel
    sendTypingIndicator,

    // Actions utilitaires
    getChatStats,
    refreshConversations,
    refreshMessages,
    isUserOnline,

    // Setters directs
    setCurrentConversation,
    setMessages,
    setChatStats
  };
};
