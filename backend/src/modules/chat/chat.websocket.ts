// =============================================
// SERVEUR WEBSOCKET COMPLET - backend/src/modules/chat/chat.websocket.ts
// =============================================

import { Server } from 'socket.io';
import { createServer } from 'http';
import { supabaseAdmin } from '../../config/database';
import type { Message, Conversation } from '../../../../shared/types/chat';

interface AuthenticatedSocket extends SocketIO.Socket {
  userId?: string;
  userName?: string;
}

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
  lastSeen: Date;
  isTyping: boolean;
  currentConversation?: string;
}

class ChatWebSocketServer {
  private io: Server | null = null;
  private onlineUsers = new Map<string, OnlineUser>();
  private userSockets = new Map<string, string>(); // userId -> socketId
  private conversationRooms = new Map<string, Set<string>>(); // conversationId -> Set<userId>

  /**
   * Initialiser le serveur WebSocket
   */
  setup(server: any): Server {
    console.log('🌐 WebSocket Chat Server - Initialisation...');

    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    
    console.log('✅ WebSocket Chat Server - Prêt !');
    return this.io;
  }

  /**
   * Configuration des gestionnaires d'événements
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      console.log('🔌 Nouvelle connexion WebSocket:', socket.id);

      try {
        // Authentification
        const { token, userId } = socket.handshake.auth;
        const user = await this.authenticateUser(token, userId);
        
        if (!user) {
          console.log('❌ Authentification échouée pour:', socket.id);
          socket.disconnect();
          return;
        }

        // Enrichir le socket avec les infos utilisateur
        socket.userId = user.id;
        socket.userName = user.name;

        // Ajouter l'utilisateur en ligne
        await this.addOnlineUser(socket);

        // Rejoindre les conversations de l'utilisateur
        await this.joinUserConversations(socket);

        // Gestionnaires d'événements du socket
        this.setupSocketEvents(socket);

        console.log(`✅ Utilisateur connecté: ${user.name} (${user.id})`);

      } catch (error) {
        console.error('❌ Erreur connexion WebSocket:', error);
        socket.disconnect();
      }
    });
  }

  /**
   * Authentifier un utilisateur via token
   */
  private async authenticateUser(token: string, userId: string): Promise<{ id: string; name: string } | null> {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user || user.id !== userId) {
        return null;
      }

      // Récupérer le profil utilisateur
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();

      return {
        id: user.id,
        name: profile?.name || 'Utilisateur'
      };

    } catch (error) {
      console.error('❌ Erreur authentification WebSocket:', error);
      return null;
    }
  }

  /**
   * Ajouter un utilisateur à la liste des connectés
   */
  private async addOnlineUser(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.userId || !socket.userName) return;

    const onlineUser: OnlineUser = {
      userId: socket.userId,
      userName: socket.userName,
      socketId: socket.id,
      lastSeen: new Date(),
      isTyping: false
    };

    this.onlineUsers.set(socket.userId, onlineUser);
    this.userSockets.set(socket.userId, socket.id);

    // Notifier les autres utilisateurs du statut en ligne
    this.broadcastOnlineStatus(socket.userId, true);
  }

  /**
   * Rejoindre les conversations de l'utilisateur
   */
  private async joinUserConversations(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.userId) return;

    try {
      // Récupérer les conversations de l'utilisateur
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .or(`participant_1_id.eq.${socket.userId},participant_2_id.eq.${socket.userId}`)
        .eq('status', 'active');

      if (!conversations) return;

      // Rejoindre chaque room de conversation
      for (const conv of conversations) {
        const roomName = `conversation:${conv.id}`;
        socket.join(roomName);

        // Ajouter à notre tracking des rooms
        if (!this.conversationRooms.has(conv.id)) {
          this.conversationRooms.set(conv.id, new Set());
        }
        this.conversationRooms.get(conv.id)!.add(socket.userId!);

        console.log(`📥 ${socket.userName} rejoint la conversation ${conv.id}`);
      }

    } catch (error) {
      console.error('❌ Erreur joinUserConversations:', error);
    }
  }

  /**
   * Configuration des événements du socket
   */
  private setupSocketEvents(socket: AuthenticatedSocket): void {
    // ============ GESTION DES CONVERSATIONS ============

    // Rejoindre une conversation spécifique
    socket.on('join_conversation', ({ conversationId }) => {
      if (!socket.userId) return;

      const roomName = `conversation:${conversationId}`;
      socket.join(roomName);

      // Marquer l'utilisateur comme étant dans cette conversation
      const user = this.onlineUsers.get(socket.userId);
      if (user) {
        user.currentConversation = conversationId;
        this.onlineUsers.set(socket.userId, user);
      }

      console.log(`📥 ${socket.userName} rejoint la conversation ${conversationId}`);
    });

    // Quitter une conversation
    socket.on('leave_conversation', ({ conversationId }) => {
      if (!socket.userId) return;

      const roomName = `conversation:${conversationId}`;
      socket.leave(roomName);

      // Retirer la conversation courante
      const user = this.onlineUsers.get(socket.userId);
      if (user) {
        user.currentConversation = undefined;
        user.isTyping = false;
        this.onlineUsers.set(socket.userId, user);
      }

      console.log(`📤 ${socket.userName} quitte la conversation ${conversationId}`);
    });

    // ============ INDICATEURS DE FRAPPE ============

    socket.on('typing', ({ conversationId, isTyping }) => {
      if (!socket.userId || !socket.userName) return;

      // Mettre à jour le statut de frappe
      const user = this.onlineUsers.get(socket.userId);
      if (user) {
        user.isTyping = isTyping;
        this.onlineUsers.set(socket.userId, user);
      }

      // Broadcaster aux autres participants de la conversation
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId: socket.userId,
        userName: socket.userName,
        isTyping
      });

      console.log(`⌨️ ${socket.userName} ${isTyping ? 'tape' : 'arrête de taper'} dans ${conversationId}`);
    });

    // ============ MARQUAGE LU TEMPS RÉEL ============

    socket.on('mark_read', ({ conversationId, messageId }) => {
      if (!socket.userId) return;

      // Broadcaster aux autres participants
      socket.to(`conversation:${conversationId}`).emit('message_read_by_user', {
        userId: socket.userId,
        messageId,
        conversationId,
        readAt: new Date().toISOString()
      });

      console.log(`✅ ${socket.userName} a lu le message ${messageId}`);
    });

    // ============ GESTION DE LA DÉCONNEXION ============

    socket.on('disconnect', (reason) => {
      console.log(`🔌 ${socket.userName} déconnecté:`, reason);
      this.removeOnlineUser(socket);
    });

    // Heartbeat pour maintenir la connexion
    socket.on('ping', () => {
      if (socket.userId) {
        const user = this.onlineUsers.get(socket.userId);
        if (user) {
          user.lastSeen = new Date();
          this.onlineUsers.set(socket.userId, user);
        }
      }
      socket.emit('pong');
    });
  }

  /**
   * Retirer un utilisateur de la liste des connectés
   */
  private removeOnlineUser(socket: AuthenticatedSocket): void {
    if (!socket.userId) return;

    this.onlineUsers.delete(socket.userId);
    this.userSockets.delete(socket.userId);

    // Retirer des rooms de conversation
    for (const [conversationId, userSet] of this.conversationRooms) {
      userSet.delete(socket.userId);
      if (userSet.size === 0) {
        this.conversationRooms.delete(conversationId);
      }
    }

    // Notifier les autres du statut hors ligne
    this.broadcastOnlineStatus(socket.userId, false);
  }

  // ============ MÉTHODES PUBLIQUES POUR LE CHAT SERVICE ============

  /**
   * Notifier un nouveau message
   */
  notifyNewMessage(conversationId: string, message: Message, excludeUserId?: string): void {
    if (!this.io) return;

    console.log('📨 Notification nouveau message:', message.id);

    const eventData = {
      conversationId,
      message,
      timestamp: new Date().toISOString()
    };

    // Envoyer à tous les participants sauf l'expéditeur
    if (excludeUserId) {
      this.io.to(`conversation:${conversationId}`).except(this.userSockets.get(excludeUserId) || '').emit('new_message', eventData);
    } else {
      this.io.to(`conversation:${conversationId}`).emit('new_message', eventData);
    }
  }

  /**
   * Notifier une modification de message
   */
  notifyMessageUpdate(conversationId: string, message: Message): void {
    if (!this.io) return;

    console.log('✏️ Notification message modifié:', message.id);

    this.io.to(`conversation:${conversationId}`).emit('message_updated', {
      conversationId,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notifier une suppression de message
   */
  notifyMessageDeleted(conversationId: string, messageId: string): void {
    if (!this.io) return;

    console.log('🗑️ Notification message supprimé:', messageId);

    this.io.to(`conversation:${conversationId}`).emit('message_deleted', {
      conversationId,
      messageId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notifier une réaction
   */
  notifyMessageReaction(conversationId: string, messageId: string, emoji: string, action: 'add' | 'remove', userId: string): void {
    if (!this.io) return;

    console.log('😊 Notification réaction:', { messageId, emoji, action });

    // Envoyer à tous sauf celui qui a réagi
    this.io.to(`conversation:${conversationId}`).except(this.userSockets.get(userId) || '').emit('message_reaction', {
      conversationId,
      messageId,
      emoji,
      action,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notifier une nouvelle conversation
   */
  notifyNewConversation(participantIds: string[], conversation: Conversation): void {
    if (!this.io) return;

    console.log('💬 Notification nouvelle conversation:', conversation.id);

    // Créer la room pour cette conversation
    const roomName = `conversation:${conversation.id}`;
    
    // Faire rejoindre les participants
    for (const userId of participantIds) {
      const socketId = this.userSockets.get(userId);
      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.join(roomName);
        }

        // Envoyer la notification
        this.io.to(socketId).emit('new_conversation', {
          conversation,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Broadcaster le statut en ligne d'un utilisateur
   */
  private broadcastOnlineStatus(userId: string, isOnline: boolean): void {
    if (!this.io) return;

    // Récupérer les conversations de cet utilisateur pour notifier les bonnes personnes
    // Pour simplifier, on broadcast à tous les utilisateurs connectés
    // TODO: Optimiser pour ne notifier que les contacts
    this.io.emit('user_online', {
      userId,
      isOnline,
      lastSeen: new Date().toISOString()
    });

    console.log(`📡 Statut ${isOnline ? 'en ligne' : 'hors ligne'} brodcasté pour ${userId}`);
  }

  /**
   * Obtenir les utilisateurs en ligne
   */
  getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  /**
   * Vérifier si un utilisateur est en ligne
   */
  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  /**
   * Obtenir les statistiques du serveur
   */
  getServerStats() {
    return {
      connectedUsers: this.onlineUsers.size,
      activeConversations: this.conversationRooms.size,
      totalSockets: this.io?.sockets.sockets.size || 0
    };
  }

  /**
   * Nettoyage périodique des utilisateurs inactifs
   */
  startCleanupTask(): void {
    setInterval(() => {
      const now = new Date();
      const maxInactivity = 5 * 60 * 1000; // 5 minutes

      for (const [userId, user] of this.onlineUsers) {
        if (now.getTime() - user.lastSeen.getTime() > maxInactivity) {
          console.log(`🧹 Nettoyage utilisateur inactif: ${user.userName}`);
          
          // Simuler une déconnexion
          const socketId = this.userSockets.get(userId);
          if (socketId) {
            const socket = this.io?.sockets.sockets.get(socketId);
            if (socket) {
              socket.disconnect();
            }
          }
        }
      }
    }, 60000); // Toutes les minutes
  }
}

// Instance singleton
export const chatWebSocketServer = new ChatWebSocketServer();

/**
 * Fonction d'initialisation pour server.ts
 */
export const setupWebSocket = (server: any): Server => {
  const io = chatWebSocketServer.setup(server);
  
  // Démarrer la tâche de nettoyage
  chatWebSocketServer.startCleanupTask();
  
  return io;
};

export default setupWebSocket;