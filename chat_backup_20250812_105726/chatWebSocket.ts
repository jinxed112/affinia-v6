// =============================================
// WEBSOCKET CHAT - frontend/src/services/chatWebSocket.ts
// =============================================

import { io, Socket } from 'socket.io-client';
import type { Message, Conversation } from '../../../shared/types/chat';

interface WebSocketEvents {
  // Messages
  new_message: (data: { conversationId: string; message: Message }) => void;
  message_updated: (data: { conversationId: string; message: Message }) => void;
  message_deleted: (data: { conversationId: string; messageId: string }) => void;
  message_reaction: (data: { 
    conversationId: string; 
    messageId: string; 
    emoji: string; 
    action: 'add' | 'remove'; 
    userId: string; 
  }) => void;

  // Conversations
  new_conversation: (data: { conversation: Conversation }) => void;
  conversation_updated: (data: { conversation: Conversation }) => void;

  // Présence
  user_typing: (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => void;
  user_online: (data: { userId: string; isOnline: boolean }) => void;

  // Système
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
}

class ChatWebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    console.log('🌐 ChatWebSocket: Service initialisé');
  }

  /**
   * Se connecter au serveur WebSocket
   */
  async connect(userId: string): Promise<void> {
    try {
      console.log('🔌 ChatWebSocket: Connexion pour utilisateur:', userId);

      // Récupérer le token d'auth
      const token = await this.getAuthToken();
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Créer la connexion Socket.IO
      this.socket = io(API_URL, {
        auth: {
          token,
          userId
        },
        transports: ['websocket', 'polling'],
        autoConnect: false
      });

      // Événements de connexion
      this.socket.on('connect', () => {
        console.log('✅ ChatWebSocket: Connecté');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connect');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ ChatWebSocket: Déconnecté:', reason);
        this.isConnected = false;
        this.emit('disconnect', reason);
        
        // Tentative de reconnexion automatique
        if (reason === 'io server disconnect') {
          // Le serveur a fermé la connexion, on doit se reconnecter manuellement
          this.reconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ ChatWebSocket: Erreur connexion:', error);
        this.isConnected = false;
        this.emit('connect_error', error);
        this.reconnect();
      });

      // Événements chat
      this.setupChatEvents();

      // Se connecter
      this.socket.connect();

    } catch (error) {
      console.error('❌ ChatWebSocket: Erreur connect:', error);
      throw error;
    }
  }

  /**
   * Configurer les événements du chat
   */
  private setupChatEvents(): void {
    if (!this.socket) return;

    // Nouveau message
    this.socket.on('new_message', (data: { conversationId: string; message: Message }) => {
      console.log('📨 ChatWebSocket: Nouveau message reçu');
      this.emit('new_message', data);
    });

    // Message modifié
    this.socket.on('message_updated', (data: { conversationId: string; message: Message }) => {
      console.log('✏️ ChatWebSocket: Message modifié');
      this.emit('message_updated', data);
    });

    // Message supprimé
    this.socket.on('message_deleted', (data: { conversationId: string; messageId: string }) => {
      console.log('🗑️ ChatWebSocket: Message supprimé');
      this.emit('message_deleted', data);
    });

    // Réaction à un message
    this.socket.on('message_reaction', (data: any) => {
      console.log('😊 ChatWebSocket: Réaction reçue');
      this.emit('message_reaction', data);
    });

    // Nouvelle conversation
    this.socket.on('new_conversation', (data: { conversation: Conversation }) => {
      console.log('💬 ChatWebSocket: Nouvelle conversation');
      this.emit('new_conversation', data);
    });

    // Indicateur de frappe
    this.socket.on('user_typing', (data: any) => {
      this.emit('user_typing', data);
    });

    // Statut en ligne
    this.socket.on('user_online', (data: any) => {
      this.emit('user_online', data);
    });
  }

  /**
   * Se déconnecter
   */
  disconnect(): void {
    console.log('🔌 ChatWebSocket: Déconnexion');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.listeners.clear();
  }

  /**
   * Rejoindre une conversation
   */
  joinConversation(conversationId: string): void {
    if (this.socket && this.isConnected) {
      console.log('🏠 ChatWebSocket: Rejoindre conversation:', conversationId);
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  /**
   * Quitter une conversation
   */
  leaveConversation(conversationId: string): void {
    if (this.socket && this.isConnected) {
      console.log('🚪 ChatWebSocket: Quitter conversation:', conversationId);
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  /**
   * Indiquer qu'on est en train de taper
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  /**
   * Marquer des messages comme lus en temps réel
   */
  markAsReadRealtime(conversationId: string, messageId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', { conversationId, messageId });
    }
  }

  // ============ SYSTÈME D'ÉVÉNEMENTS ============

  /**
   * S'abonner à un événement
   */
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Se désabonner d'un événement
   */
  off<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Émettre un événement vers les listeners
   */
  private emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(...args));
    }
  }

  // ============ UTILITAIRES ============

  /**
   * Obtenir le statut de connexion
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Obtenir le socket (pour debug)
   */
  get socketInstance(): Socket | null {
    return this.socket;
  }

  /**
   * Récupérer le token d'auth
   */
  private async getAuthToken(): Promise<string> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbcbeitvmtqwoifbkghy.supabase.co';
    const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

    const authData = localStorage.getItem(storageKey);
    if (!authData) {
      throw new Error('No authentication token found');
    }

    const parsedAuth = JSON.parse(authData);
    const accessToken = parsedAuth?.access_token;

    if (!accessToken) {
      throw new Error('No access token found');
    }

    return accessToken;
  }

  /**
   * Tentative de reconnexion
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ ChatWebSocket: Max tentatives de reconnexion atteintes');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(`🔄 ChatWebSocket: Reconnexion dans ${delay}ms (tentative ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }
}

// Instance singleton
export const chatWebSocketService = new ChatWebSocketService();