// =============================================
// HOOK CHAT - frontend/src/hooks/useChat.ts
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import type { Conversation, Message, ChatStats, SendMessageParams } from '../../../shared/types/chat';

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatStats, setChatStats] = useState<ChatStats>({ total_unread_conversations: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(true); // WebSocket status (pour plus tard)

  // Charger les conversations
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
      // Ne pas faire planter l'app, juste logger
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Charger les messages d'une conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      setIsLoadingMessages(true);
      console.log('🔄 useChat: Chargement messages conversation:', conversationId);
      
      const data = await chatService.getMessages(conversationId);
      
      // Enrichir les messages avec is_own_message
      const enrichedMessages = data.map(msg => ({
        ...msg,
        is_own_message: msg.sender_id === user.id,
        is_expired: chatService.isMessageExpired(msg)
      }));
      
      setMessages(enrichedMessages);

      // Marquer comme lu si des messages existent
      if (enrichedMessages.length > 0) {
        const lastMessage = enrichedMessages[enrichedMessages.length - 1];
        await chatService.markAsRead(conversationId, lastMessage.id);
      }

      console.log('✅ useChat: Messages chargés:', enrichedMessages.length);
    } catch (error) {
      console.error('❌ useChat: Erreur chargement messages:', error);
      setMessages([]); // Reset messages en cas d'erreur
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // Charger les stats
  const loadChatStats = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 useChat: Chargement stats...');
      const stats = await chatService.getChatStats();
      setChatStats(stats);
      console.log('✅ useChat: Stats chargées:', stats);
    } catch (error) {
      console.error('❌ useChat: Erreur chargement stats:', error);
      // Garder les stats par défaut
    }
  }, [user]);

  // Sélectionner une conversation
  const selectConversation = useCallback((conversation: Conversation) => {
    console.log('👆 useChat: Sélection conversation:', conversation.id);
    setCurrentConversation(conversation);
    loadMessages(conversation.id);
  }, [loadMessages]);

  // Envoyer un message
  const sendMessage = useCallback(async (conversationId: string, params: SendMessageParams) => {
    if (!user) return;

    try {
      console.log('📤 useChat: Envoi message:', { conversationId, params });
      
      const newMessage = await chatService.sendMessage(conversationId, params);
      
      // Ajouter le message à la liste avec enrichissement
      const enrichedMessage = {
        ...newMessage,
        is_own_message: true,
        is_expired: false
      };

      setMessages(prev => [...prev, enrichedMessage]);
      
      // Recharger les conversations pour mettre à jour l'ordre et les compteurs
      await loadConversations();
      
      console.log('✅ useChat: Message envoyé:', newMessage.id);

    } catch (error) {
      console.error('❌ useChat: Erreur envoi message:', error);
      throw error; // Remonter l'erreur pour le composant
    }
  }, [user, loadConversations]);

  // Réagir à un message
  const reactToMessage = useCallback(async (messageId: string, emoji: string, action: 'add' | 'remove' = 'add') => {
    try {
      console.log('😊 useChat: Réaction message:', { messageId, emoji, action });
      
      const updatedMessage = await chatService.reactToMessage(messageId, emoji, action);
      
      // Mettre à jour le message dans la liste avec conservation des flags
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...updatedMessage, 
                is_own_message: msg.is_own_message, 
                is_expired: msg.is_expired 
              }
            : msg
        )
      );

      console.log('✅ useChat: Réaction ajoutée');

    } catch (error) {
      console.error('❌ useChat: Erreur réaction message:', error);
      throw error;
    }
  }, []);

  // Supprimer un message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      console.log('🗑️ useChat: Suppression message:', messageId);
      
      await chatService.deleteMessage(messageId);
      
      // Supprimer le message de la liste (soft delete côté UI)
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      console.log('✅ useChat: Message supprimé');

    } catch (error) {
      console.error('❌ useChat: Erreur suppression message:', error);
      throw error;
    }
  }, []);

  // Marquer comme lu
  const markAsRead = useCallback(async (conversationId: string, lastMessageId: string) => {
    try {
      console.log('✅ useChat: Marquage lu:', { conversationId, lastMessageId });
      
      await chatService.markAsRead(conversationId, lastMessageId);
      await loadConversations(); // Recharger pour mettre à jour les compteurs
      
    } catch (error) {
      console.error('❌ useChat: Erreur marquage lu:', error);
      // Ne pas faire planter, c'est pas critique
    }
  }, [loadConversations]);

  // Créer une nouvelle conversation
  const createConversation = useCallback(async (participantId: string) => {
    if (!user) return null;

    try {
      console.log('💬 useChat: Création conversation avec:', participantId);
      
      const conversation = await chatService.createConversation(participantId);
      
      // Recharger les conversations
      await loadConversations();
      
      // Sélectionner la nouvelle conversation
      selectConversation(conversation);
      
      console.log('✅ useChat: Conversation créée:', conversation.id);
      return conversation;

    } catch (error) {
      console.error('❌ useChat: Erreur création conversation:', error);
      throw error;
    }
  }, [user, loadConversations, selectConversation]);

  // Charger les données initiales
  useEffect(() => {
    if (user) {
      console.log('🏁 useChat: Init pour utilisateur:', user.id);
      loadConversations();
      loadChatStats();
    } else {
      // Reset des données si plus d'utilisateur
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      setChatStats({ total_unread_conversations: 0 });
    }
  }, [user, loadConversations, loadChatStats]);

  // Polling léger pour les nouvelles données (temporaire - en attendant WebSocket)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('🔄 useChat: Polling refresh...');
      
      // Recharger les conversations et stats
      loadConversations();
      loadChatStats();
      
      // Recharger les messages de la conversation courante si elle existe
      if (currentConversation) {
        loadMessages(currentConversation.id);
      }
    }, 30000); // Toutes les 30 secondes (assez conservateur)

    return () => {
      console.log('🛑 useChat: Arrêt polling');
      clearInterval(interval);
    };
  }, [user, currentConversation, loadConversations, loadChatStats, loadMessages]);

  // Reset conversation courante si elle disparaît de la liste
  useEffect(() => {
    if (currentConversation && conversations.length > 0) {
      const stillExists = conversations.find(c => c.id === currentConversation.id);
      if (!stillExists) {
        console.log('⚠️ useChat: Conversation courante plus dans la liste, reset');
        setCurrentConversation(null);
        setMessages([]);
      }
    }
  }, [conversations, currentConversation]);

  // Fonctions utilitaires exportées
  const getChatStats = useCallback(async (): Promise<ChatStats> => {
    try {
      return await chatService.getChatStats();
    } catch (error) {
      console.error('❌ useChat: Erreur getChatStats:', error);
      return { total_unread_conversations: 0 };
    }
  }, []);

  const refreshConversations = useCallback(() => {
    console.log('🔄 useChat: Refresh manuel conversations');
    loadConversations();
  }, [loadConversations]);

  const refreshMessages = useCallback(() => {
    if (currentConversation) {
      console.log('🔄 useChat: Refresh manuel messages');
      loadMessages(currentConversation.id);
    }
  }, [currentConversation, loadMessages]);

  return {
    // État
    conversations,
    currentConversation,
    messages,
    chatStats,
    isLoading,
    isLoadingMessages,
    isConnected,

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

    // Actions utilitaires
    getChatStats,
    refreshConversations,
    refreshMessages,

    // Setters directs (pour des cas spéciaux)
    setCurrentConversation,
    setMessages,
    setChatStats
  };
};