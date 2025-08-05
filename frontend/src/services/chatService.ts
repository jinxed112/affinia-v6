// =============================================
// SERVICE FRONTEND - Chat Temps Réel
// frontend/src/services/chatService.ts
// =============================================

import type {
  Conversation,
  Message,
  SendMessageParams,
  ChatStats
} from '../../../shared/types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ChatService {

  constructor() {
    console.log('💬 ChatService: API_BASE_URL =', API_BASE_URL);
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    console.log('🔑 chatService: Récupération du token...');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbcbeitvmtqwoifbkghy.supabase.co';
    const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

    const authData = localStorage.getItem(storageKey);

    if (!authData) {
      console.error('❌ No auth data found');
      throw new Error('No authentication token found');
    }

    let parsedAuth;
    try {
      parsedAuth = JSON.parse(authData);
      console.log('✅ Auth data parsed successfully');
    } catch {
      console.error('❌ Invalid auth data');
      throw new Error('Invalid auth data');
    }

    const accessToken = parsedAuth?.access_token;

    if (!accessToken) {
      console.error('❌ No access token in auth data');
      throw new Error('No access token found');
    }

    console.log('✅ Access token found for chat service');

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
  }

  // ============ GESTION DES CONVERSATIONS ============

  /**
   * Récupérer les conversations de l'utilisateur
   */
  async getConversations(limit: number = 20, offset: number = 0): Promise<Conversation[]> {
    try {
      console.log('📝 chatService: Récupération conversations', { limit, offset });

      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/conversations?limit=${limit}&offset=${offset}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch conversations');
      }

      console.log('✅ chatService: Conversations récupérées:', result.data.length);
      return result.data;

    } catch (error) {
      console.error('❌ chatService: Erreur getConversations:', error);
      throw error;
    }
  }

  /**
   * Récupérer une conversation spécifique
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      console.log('👁️ chatService: Récupération conversation:', conversationId);

      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch conversation');
      }

      return result.data;

    } catch (error) {
      console.error('❌ chatService: Erreur getConversation:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle conversation
   */
  async createConversation(participantId: string): Promise<Conversation> {
    try {
      console.log('💬 chatService: Création conversation avec:', participantId);

      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          participant_id: participantId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create conversation');
      }

      console.log('✅ chatService: Conversation créée:', result.data.id);
      return result.data;

    } catch (error) {
      console.error('❌ chatService: Erreur createConversation:', error);
      throw error;
    }
  }

  // ============ GESTION DES MESSAGES ============

  /**
   * Récupérer les messages d'une conversation
   */
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      console.log('📋 chatService: Récupération messages', { conversationId, limit, offset });

      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch messages');
      }

      console.log('✅ chatService: Messages récupérés:', result.data.length);
      return result.data;

    } catch (error) {
      console.error('❌ chatService: Erreur getMessages:', error);
      throw error;
    }
  }

  /**
   * Envoyer un message
   */
  async sendMessage(conversationId: string, params: SendMessageParams): Promise<Message> {
    try {
      console.log('📤 chatService: Envoi message', { conversationId, params });

      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      console.log('✅ chatService: Message envoyé:', result.data.id);
      return result.data;

    } catch (error) {
      console.error('❌ chatService: Erreur sendMessage:', error);
      throw error;
    }
  }

  /**
   * Modifier un message
   */
  async updateMessage(messageId: string, content: string): Promise<Message> {
    try {
      console.log('✏️ chatService: Modification message:', messageId);

      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/messages/${messageId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error(`Failed to update message: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update message');
      }

      return result.data;

    } catch (error) {
      console.error('❌ chatService: Erreur updateMessage:', error);
      throw error;
    }
  }

  /**
   * Supprimer un message
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      console.log('🗑️ chatService: Suppression message:', messageId);

      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete message');
      }

      return true;

    } catch (error) {
      console.error('❌ chatService: Erreur deleteMessage:', error);
      throw error;
    }
  }

  /**
   * Réagir à un message
   */
  async reactToMessage(messageId: string, emoji: string, action: 'add' | 'remove' = 'add'): Promise<Message> {
    try {
      console.log('😊 chatService: Réaction message', { messageId, emoji, action });

      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ emoji, action })
      });

      if (!response.ok) {
        throw new Error(`Failed to react to message: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to react to message');
      }

      return result.data;

    } catch (error) {
      console.error('❌ chatService: Erreur reactToMessage:', error);
      throw error;
    }
  }

  // ============ GESTION DES LECTURES ============

  /**
   * Marquer les messages comme lus
   */
  async markAsRead(conversationId: string, lastMessageId: string): Promise<void> {
    try {
      console.log('✅ chatService: Marquage lu', { conversationId, lastMessageId });

      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ last_message_id: lastMessageId })
      });

      if (!response.ok) {
        throw new Error(`Failed to mark as read: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark as read');
      }

    } catch (error) {
      console.error('❌ chatService: Erreur markAsRead:', error);
      // Ne pas throw - ce n'est pas critique
    }
  }

  /**
   * Compter les messages non lus
   */
  async getUnreadCount(conversationId: string): Promise<number> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/unread-count`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to get unread count: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get unread count');
      }

      return result.data.unread_count;

    } catch (error) {
      console.error('❌ chatService: Erreur getUnreadCount:', error);
      return 0;
    }
  }

  // ============ STATISTIQUES ============

  /**
   * Récupérer les statistiques du chat
   */
  async getChatStats(): Promise<ChatStats> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/chat/stats`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to get chat stats: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get chat stats');
      }

      return result.data;

    } catch (error) {
      console.error('❌ chatService: Erreur getChatStats:', error);
      return { total_unread_conversations: 0 };
    }
  }

  // ============ UTILITAIRES ============

  /**
   * Formater le temps d'un message
   */
  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }

  /**
   * Formater l'heure précise d'un message
   */
  formatMessageTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();

    const timeStr = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (isToday) return timeStr;
    if (isYesterday) return `Hier ${timeStr}`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Vérifier si un message est expiré
   */
  isMessageExpired(message: Message): boolean {
    if (!message.expires_at) return false;
    return new Date(message.expires_at) <= new Date();
  }

  /**
   * Calculer le temps restant avant expiration
   */
  getExpirationTimeLeft(message: Message): string | null {
    if (!message.expires_at) return null;

    const expirationDate = new Date(message.expires_at);
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expiré';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) return `${diffHours}h`;
    if (diffMins > 0) return `${diffMins}min`;
    return `${diffSecs}s`;
  }

  /**
   * Extraire les emojis des réactions
   */
  getMessageReactions(message: Message): Array<{ emoji: string; count: number; users: string[] }> {
    if (!message.reactions) return [];

    return Object.entries(message.reactions).map(([emoji, users]) => ({
      emoji,
      count: users.length,
      users
    }));
  }

  /**
   * Vérifier si l'utilisateur a réagi avec un emoji spécifique
   */
  hasUserReacted(message: Message, userId: string, emoji: string): boolean {
    return message.reactions?.[emoji]?.includes(userId) || false;
  }

  /**
   * Générer un aperçu du contenu d'un message
   */
  getMessagePreview(message: Message): string {
    if (message.message_type === 'system') {
      return message.content || 'Message système';
    }

    if (message.message_type === 'image') {
      return '📷 Image';
    }

    if (message.message_type === 'voice') {
      return '🎵 Message vocal';
    }

    if (!message.content) {
      return 'Message vide';
    }

    // Tronquer le contenu si trop long
    const maxLength = 50;
    if (message.content.length <= maxLength) {
      return message.content;
    }

    return message.content.substring(0, maxLength) + '...';
  }
}

export const chatService = new ChatService();