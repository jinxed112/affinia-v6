// =============================================
// SERVICE WEBSOCKET AFFINIA OPTIMISÉ - CORRIGÉ
// =============================================
import { io, Socket } from 'socket.io-client';
import type { Message } from '../../../shared/types/chat';

export type ChatSocketHandlers = {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onNewMessage?: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onMessageDeleted?: (messageId: string) => void;
  onTyping?: (data: { userId: string; userName: string; isTyping: boolean }) => void;
};

export function connectAffiniaSocket(
  conversationId: string,
  token: string,
  handlers: ChatSocketHandlers = {}
) {
  // ✅ RÉCUPÉRER LE VRAI TOKEN SUPABASE + USER ID
  const getSupabaseAuth = () => {
    try {
      const authData = localStorage.getItem('sb-qbcbeitvmtqwoifbkghy-auth-token');
      if (!authData) return null;
      
      const parsed = JSON.parse(authData);
      return {
        token: parsed.access_token,
        userId: parsed.user?.id
      };
    } catch (e) {
      console.error('❌ Erreur parsing token Supabase:', e);
      return null;
    }
  };

  const authData = getSupabaseAuth();
  if (!authData) {
    console.error('❌ Impossible de récupérer le token Supabase');
    handlers.onError?.(new Error('No auth token'));
    return null;
  }

  console.log('🔑 Auth WebSocket:', { userId: authData.userId, hasToken: !!authData.token });

  const socket: Socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001', {
    auth: { 
      token: authData.token,
      userId: authData.userId 
    },
    transports: ['websocket'],
    forceNew: true
  });

  socket.on('connect', () => {
    console.log('🟢 Socket connecté pour conversation:', conversationId);
    socket.emit('join_conversation', { conversationId });
    handlers.onConnect?.();
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket déconnecté');
    handlers.onDisconnect?.();
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Erreur connexion socket:', error);
    handlers.onError?.(error);
  });

  socket.on('new_message', ({ conversationId: msgConvId, message }) => {
    if (msgConvId === conversationId) {
      handlers.onNewMessage?.(message);
    }
  });

  socket.on('message_updated', ({ conversationId: msgConvId, message }) => {
    if (msgConvId === conversationId) {
      handlers.onMessageUpdated?.(message);
    }
  });

  socket.on('message_deleted', ({ conversationId: msgConvId, messageId }) => {
    if (msgConvId === conversationId) {
      handlers.onMessageDeleted?.(messageId);
    }
  });

  socket.on('user_typing', ({ conversationId: typingConvId, userId, userName, isTyping }) => {
    if (typingConvId === conversationId) {
      handlers.onTyping?.({ userId, userName, isTyping });
    }
  });

  return {
    disconnect: () => socket.disconnect(),
    sendTyping: (isTyping: boolean) => {
      socket.emit('typing', { conversationId, isTyping });
    },
    markAsReadRealtime: (messageId: string) => {
      socket.emit('mark_read', { conversationId, messageId });
    },
    connected: socket.connected,
    id: socket.id
  };
}
