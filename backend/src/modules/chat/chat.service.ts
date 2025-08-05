// =============================================
// SERVICE BACKEND - Chat Système Temps Réel
// =============================================

import { supabaseAdmin } from '../../config/database';

// Types pour le chat
export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  created_at: string;
  last_message_at: string;
  last_message_id: string | null;
  status: 'active' | 'archived' | 'blocked';
  // Données jointes
  other_participant?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  unread_count?: number;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'image' | 'voice' | 'system';
  media_url: string | null;
  media_metadata: any;
  reply_to_id: string | null;
  reactions: Record<string, string[]>; // {"❤️": ["user_id1"], "😂": ["user_id2"]}
  expires_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Données jointes
  sender?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  reply_to?: Message;
}

export interface MessageRead {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_message_id: string | null;
  read_at: string;
}

// Interfaces pour les paramètres
export interface CreateConversationParams {
  participant_1_id: string;
  participant_2_id: string;
}

export interface SendMessageParams {
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type?: 'text' | 'image' | 'voice' | 'system';
  media_url?: string;
  media_metadata?: any;
  reply_to_id?: string;
  expires_in_minutes?: number; // Pour messages éphémères
}

export interface UpdateMessageParams {
  message_id: string;
  user_id: string;
  content?: string;
  media_url?: string;
  media_metadata?: any;
}

export interface ReactToMessageParams {
  message_id: string;
  user_id: string;
  emoji: string;
  action: 'add' | 'remove';
}

class ChatService {
  private webSocketService?: any; // Référence vers ChatWebSocketService

  setWebSocketService(webSocketService: any) {
    this.webSocketService = webSocketService;
  }

  // ============ GESTION DES CONVERSATIONS ============

  /**
   * Créer une nouvelle conversation (appelée automatiquement après miroir accepté)
   */
  async createConversation(params: CreateConversationParams): Promise<Conversation> {
    try {
      console.log('💬 Chat Service - Création conversation:', params);

      // Vérifier qu'une conversation n'existe pas déjà entre ces utilisateurs
      const existingConversation = await this.findExistingConversation(
        params.participant_1_id,
        params.participant_2_id
      );

      if (existingConversation) {
        console.log('✅ Conversation existante trouvée:', existingConversation.id);
        return existingConversation;
      }

      // Créer la nouvelle conversation
      const { data: newConversation, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          participant_1_id: params.participant_1_id,
          participant_2_id: params.participant_2_id,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création conversation:', error);
        throw error;
      }

      console.log('✅ Conversation créée:', newConversation.id);

      // Envoyer un message système de bienvenue
      await this.sendMessage({
        conversation_id: newConversation.id,
        sender_id: 'system',
        content: '🎉 Félicitations ! Vous pouvez maintenant discuter suite à l\'acceptation du miroir.',
        message_type: 'system'
      });

      // Créer une notification pour les deux participants
      await this.notifyNewConversation(newConversation);

      return newConversation;

    } catch (error) {
      console.error('❌ Chat Service - Erreur createConversation:', error);
      throw error;
    }
  }

  /**
   * Chercher une conversation existante entre deux utilisateurs
   */
  async findExistingConversation(userId1: string, userId2: string): Promise<Conversation | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .or(`and(participant_1_id.eq.${userId1},participant_2_id.eq.${userId2}),and(participant_1_id.eq.${userId2},participant_2_id.eq.${userId1})`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('❌ Erreur findExistingConversation:', error);
      return null;
    }
  }

  /**
   * Récupérer les conversations d'un utilisateur
   */
  async getUserConversations(userId: string, limit: number = 20, offset: number = 0): Promise<Conversation[]> {
    try {
      console.log('📝 Chat Service - Récupération conversations pour:', userId);

      // Récupérer les conversations avec les infos des autres participants
      const { data: conversations, error } = await supabaseAdmin
        .from('conversations')
        .select(`
          id,
          participant_1_id,
          participant_2_id,
          created_at,
          last_message_at,
          last_message_id,
          status
        `)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Erreur récupération conversations:', error);
        throw error;
      }

      if (!conversations || conversations.length === 0) {
        return [];
      }

      // Enrichir avec les données des autres participants
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId = conv.participant_1_id === userId 
            ? conv.participant_2_id 
            : conv.participant_1_id;

          // Récupérer les infos de l'autre participant
          const { data: otherUser } = await supabaseAdmin
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', otherUserId)
            .single();

          // Récupérer le dernier message
          let lastMessage = null;
          if (conv.last_message_id) {
            const { data: messageData } = await supabaseAdmin
              .from('messages')
              .select('id, content, message_type, created_at, sender_id')
              .eq('id', conv.last_message_id)
              .single();
            lastMessage = messageData;
          }

          // Compter les messages non lus
          const unreadCount = await this.getUnreadMessagesCount(conv.id, userId);

          return {
            ...conv,
            other_participant: otherUser ? {
              id: otherUser.id,
              name: otherUser.name || 'Utilisateur',
              avatar_url: otherUser.avatar_url
            } : null,
            unread_count: unreadCount,
            last_message: lastMessage
          };
        })
      );

      console.log(`✅ ${enrichedConversations.length} conversations récupérées`);
      return enrichedConversations;

    } catch (error) {
      console.error('❌ Chat Service - Erreur getUserConversations:', error);
      throw error;
    }
  }

  /**
   * Récupérer une conversation spécifique
   */
  async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    try {
      const { data: conversation, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .single();

      if (error || !conversation) {
        return null;
      }

      // Enrichir avec les données de l'autre participant
      const otherUserId = conversation.participant_1_id === userId 
        ? conversation.participant_2_id 
        : conversation.participant_1_id;

      const { data: otherUser } = await supabaseAdmin
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', otherUserId)
        .single();

      return {
        ...conversation,
        other_participant: otherUser ? {
          id: otherUser.id,
          name: otherUser.name || 'Utilisateur',
          avatar_url: otherUser.avatar_url
        } : null
      };

    } catch (error) {
      console.error('❌ Chat Service - Erreur getConversation:', error);
      throw error;
    }
  }

  // ============ GESTION DES MESSAGES ============

  /**
   * Envoyer un message
   */
  async sendMessage(params: SendMessageParams): Promise<Message> {
    try {
      console.log('📤 Chat Service - Envoi message:', params);

      // Calculer la date d'expiration si message éphémère
      let expiresAt = null;
      if (params.expires_in_minutes) {
        expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + params.expires_in_minutes);
      }

      // Insérer le message
      const { data: newMessage, error } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: params.conversation_id,
          sender_id: params.sender_id,
          content: params.content || null,
          message_type: params.message_type || 'text',
          media_url: params.media_url || null,
          media_metadata: params.media_metadata || null,
          reply_to_id: params.reply_to_id || null,
          expires_at: expiresAt?.toISOString() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur envoi message:', error);
        throw error;
      }

      console.log('✅ Message envoyé:', newMessage.id);

      // Récupérer le message enrichi avec les données du sender
      const enrichedMessage = await this.getMessageWithDetails(newMessage.id);

      // Notifier les participants via WebSocket
      await this.notifyNewMessage(enrichedMessage);

      return enrichedMessage;

    } catch (error) {
      console.error('❌ Chat Service - Erreur sendMessage:', error);
      throw error;
    }
  }

  /**
   * Récupérer les messages d'une conversation
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    try {
      console.log('📋 Chat Service - Récupération messages conversation:', conversationId);

      // Vérifier que l'utilisateur a accès à cette conversation
      const conversation = await this.getConversation(conversationId, userId);
      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Récupérer les messages (non supprimés et non expirés)
      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          media_url,
          media_metadata,
          reply_to_id,
          reactions,
          expires_at,
          edited_at,
          deleted_at,
          created_at,
          updated_at
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Erreur récupération messages:', error);
        throw error;
      }

      if (!messages || messages.length === 0) {
        return [];
      }

      // Enrichir les messages avec les données des senders
      const enrichedMessages = await Promise.all(
        messages.map(async (message) => {
          // Récupérer les infos du sender (sauf pour les messages système)
          let sender = null;
          if (message.sender_id !== 'system') {
            const { data: senderData } = await supabaseAdmin
              .from('profiles')
              .select('id, name, avatar_url')
              .eq('id', message.sender_id)
              .single();
            
            sender = senderData ? {
              id: senderData.id,
              name: senderData.name || 'Utilisateur',
              avatar_url: senderData.avatar_url
            } : null;
          }

          // Récupérer le message de réponse si applicable
          let replyTo = null;
          if (message.reply_to_id) {
            replyTo = await this.getMessageWithDetails(message.reply_to_id);
          }

          return {
            ...message,
            sender,
            reply_to: replyTo
          };
        })
      );

      console.log(`✅ ${enrichedMessages.length} messages récupérés`);
      return enrichedMessages.reverse(); // Plus ancien en premier

    } catch (error) {
      console.error('❌ Chat Service - Erreur getConversationMessages:', error);
      throw error;
    }
  }

  /**
   * Modifier un message
   */
  async updateMessage(params: UpdateMessageParams): Promise<Message> {
    try {
      console.log('✏️ Chat Service - Modification message:', params.message_id);

      // Vérifier que l'utilisateur est le propriétaire du message
      const { data: existingMessage } = await supabaseAdmin
        .from('messages')
        .select('sender_id, conversation_id')
        .eq('id', params.message_id)
        .single();

      if (!existingMessage || existingMessage.sender_id !== params.user_id) {
        throw new Error('Message not found or access denied');
      }

      // Mettre à jour le message
      const { data: updatedMessage, error } = await supabaseAdmin
        .from('messages')
        .update({
          content: params.content,
          media_url: params.media_url,
          media_metadata: params.media_metadata,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', params.message_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur modification message:', error);
        throw error;
      }

      // Récupérer le message enrichi
      const enrichedMessage = await this.getMessageWithDetails(updatedMessage.id);

      // Notifier la modification via WebSocket
      await this.notifyMessageUpdated(enrichedMessage);

      return enrichedMessage;

    } catch (error) {
      console.error('❌ Chat Service - Erreur updateMessage:', error);
      throw error;
    }
  }

  /**
   * Supprimer un message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      console.log('🗑️ Chat Service - Suppression message:', messageId);

      // Vérifier que l'utilisateur est le propriétaire du message
      const { data: existingMessage } = await supabaseAdmin
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (!existingMessage || existingMessage.sender_id !== userId) {
        throw new Error('Message not found or access denied');
      }

      // Soft delete
      const { error } = await supabaseAdmin
        .from('messages')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) {
        console.error('❌ Erreur suppression message:', error);
        throw error;
      }

      // Notifier la suppression via WebSocket
      await this.notifyMessageDeleted(messageId);

      return true;

    } catch (error) {
      console.error('❌ Chat Service - Erreur deleteMessage:', error);
      throw error;
    }
  }

  /**
   * Réagir à un message
   */
  async reactToMessage(params: ReactToMessageParams): Promise<Message> {
    try {
      console.log('😊 Chat Service - Réaction message:', params);

      // Récupérer le message existant
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .select('reactions')
        .eq('id', params.message_id)
        .single();

      if (error || !message) {
        throw new Error('Message not found');
      }

      // Modifier les réactions
      const reactions = message.reactions || {};
      const emoji = params.emoji;
      const userId = params.user_id;

      if (params.action === 'add') {
        // Ajouter la réaction
        if (!reactions[emoji]) {
          reactions[emoji] = [];
        }
        if (!reactions[emoji].includes(userId)) {
          reactions[emoji].push(userId);
        }
      } else {
        // Supprimer la réaction
        if (reactions[emoji]) {
          reactions[emoji] = reactions[emoji].filter(id => id !== userId);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        }
      }

      // Mettre à jour en base
      const { data: updatedMessage, error: updateError } = await supabaseAdmin
        .from('messages')
        .update({
          reactions: reactions,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.message_id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Récupérer le message enrichi
      const enrichedMessage = await this.getMessageWithDetails(updatedMessage.id);

      // Notifier via WebSocket
      await this.notifyMessageReaction(enrichedMessage, params.emoji, params.action);

      return enrichedMessage;

    } catch (error) {
      console.error('❌ Chat Service - Erreur reactToMessage:', error);
      throw error;
    }
  }

  // ============ GESTION DES LECTURES ============

  /**
   * Marquer les messages comme lus
   */
  async markMessagesAsRead(conversationId: string, userId: string, lastMessageId: string): Promise<void> {
    try {
      console.log('✅ Chat Service - Marquage lu:', { conversationId, userId, lastMessageId });

      // Upsert du marqueur de lecture
      const { error } = await supabaseAdmin
        .from('message_reads')
        .upsert({
          conversation_id: conversationId,
          user_id: userId,
          last_read_message_id: lastMessageId,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'conversation_id,user_id'
        });

      if (error) {
        console.error('❌ Erreur marquage lu:', error);
        throw error;
      }

      // Notifier via WebSocket que les messages ont été lus
      await this.notifyMessagesRead(conversationId, userId, lastMessageId);

    } catch (error) {
      console.error('❌ Chat Service - Erreur markMessagesAsRead:', error);
      throw error;
    }
  }

  /**
   * Compter les messages non lus dans une conversation
   */
  async getUnreadMessagesCount(conversationId: string, userId: string): Promise<number> {
    try {
      // Utiliser la fonction SQL créée précédemment
      const { data, error } = await supabaseAdmin
        .rpc('get_unread_messages_count', {
          conversation_id: conversationId,
          user_id: userId
        });

      if (error) {
        console.error('❌ Erreur comptage non lus:', error);
        return 0;
      }

      return data || 0;

    } catch (error) {
      console.error('❌ Chat Service - Erreur getUnreadMessagesCount:', error);
      return 0;
    }
  }

  /**
   * Récupérer le nombre total de conversations non lues
   */
  async getTotalUnreadConversationsCount(userId: string): Promise<number> {
    try {
      const conversations = await this.getUserConversations(userId, 100, 0);
      return conversations.filter(conv => (conv.unread_count || 0) > 0).length;
    } catch (error) {
      console.error('❌ Chat Service - Erreur getTotalUnreadConversationsCount:', error);
      return 0;
    }
  }

  // ============ INTÉGRATION AVEC LE SYSTÈME DE MIROIR ============

  /**
   * Créer automatiquement une conversation après acceptation d'un miroir
   * (À appeler depuis discoveryService.respondToMirrorRequest)
   */
  async createConversationFromMirrorAcceptance(senderId: string, receiverId: string): Promise<Conversation> {
    try {
      console.log('🪞➡️💬 Création conversation depuis miroir accepté:', { senderId, receiverId });

      // Créer la conversation
      const conversation = await this.createConversation({
        participant_1_id: senderId,
        participant_2_id: receiverId
      });

      // Créer une notification spéciale pour les deux utilisateurs
      await this.createChatNotification(senderId, receiverId, conversation.id);
      await this.createChatNotification(receiverId, senderId, conversation.id);

      return conversation;

    } catch (error) {
      console.error('❌ Erreur createConversationFromMirrorAcceptance:', error);
      throw error;
    }
  }

  // ============ MÉTHODES PRIVÉES ============

  /**
   * Récupérer un message avec tous ses détails
   */
  private async getMessageWithDetails(messageId: string): Promise<Message> {
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error || !message) {
      throw new Error('Message not found');
    }

    // Enrichir avec les données du sender
    let sender = null;
    if (message.sender_id !== 'system') {
      const { data: senderData } = await supabaseAdmin
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', message.sender_id)
        .single();
      
      sender = senderData ? {
        id: senderData.id,
        name: senderData.name || 'Utilisateur',
        avatar_url: senderData.avatar_url
      } : null;
    }

    return {
      ...message,
      sender
    };
  }

  /**
   * Notifier une nouvelle conversation
   */
  private async notifyNewConversation(conversation: Conversation): Promise<void> {
    console.log('🔔 Notification nouvelle conversation:', conversation.id);
    
    if (this.webSocketService) {
      this.webSocketService.notifyNewConversation([
        conversation.participant_1_id,
        conversation.participant_2_id
      ], conversation);
    }
  }

  /**
   * Notifier un nouveau message
   */
  private async notifyNewMessage(message: Message): Promise<void> {
    console.log('🔔 Notification nouveau message:', message.id);
    
    if (this.webSocketService) {
      this.webSocketService.notifyNewMessage(
        message.conversation_id, 
        message, 
        message.sender_id
      );
    }
  }

  /**
   * Notifier la modification d'un message
   */
  private async notifyMessageUpdated(message: Message): Promise<void> {
    console.log('🔔 Notification message modifié:', message.id);
    
    if (this.webSocketService) {
      this.webSocketService.notifyMessageUpdate(message.conversation_id, message);
    }
  }

  /**
   * Notifier la suppression d'un message
   */
  private async notifyMessageDeleted(messageId: string): Promise<void> {
    console.log('🔔 Notification message supprimé:', messageId);
    
    // Récupérer l'info de la conversation depuis le message
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('conversation_id')
      .eq('id', messageId)
      .single();

    if (this.webSocketService && message) {
      this.webSocketService.notifyMessageDeleted(message.conversation_id, messageId);
    }
  }

  /**
   * Notifier une réaction
   */
  private async notifyMessageReaction(message: Message, emoji: string, action: 'add' | 'remove'): Promise<void> {
    console.log('🔔 Notification réaction:', { messageId: message.id, emoji, action });
    
    if (this.webSocketService) {
      this.webSocketService.notifyMessageReaction(
        message.conversation_id, 
        message.id, 
        emoji, 
        action, 
        message.sender_id
      );
    }
  }

  /**
   * Notifier que des messages ont été lus
   */
  private async notifyMessagesRead(conversationId: string, userId: string, lastMessageId: string): Promise<void> {
    console.log('🔔 Notification messages lus:', { conversationId, userId, lastMessageId });
    // WebSocket notification sera implémentée
  }

  /**
   * Créer une notification de nouveau chat
   */
  private async createChatNotification(recipientId: string, senderId: string, conversationId: string): Promise<void> {
    try {
      // Récupérer le nom de l'expéditeur
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', senderId)
        .single();

      // Créer la notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_id: recipientId,
          sender_id: senderId,
          type: 'new_chat',
          title: 'Nouvelle conversation',
          message: `Vous pouvez maintenant discuter avec ${senderProfile?.name || 'cette personne'}`,
          status: 'unread',
          payload: {
            conversation_id: conversationId,
            sender_name: senderProfile?.name,
            sender_avatar: senderProfile?.avatar_url
          }
        });

    } catch (error) {
      console.error('❌ Erreur création notification chat:', error);
    }
  }
}

export const chatService = new ChatService();