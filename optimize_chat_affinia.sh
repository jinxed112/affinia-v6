#!/bin/bash

# =============================================
# 🚀 SCRIPT COMPLET - CHAT AFFINIA OPTIMISÉ
# Implémente la solution ChatGPT adaptée à Affinia
# =============================================

set -e  # Arrêter sur erreur

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 DÉMARRAGE OPTIMISATION CHAT AFFINIA${NC}"
echo -e "${BLUE}Version: ChatGPT + Affinia Hybride${NC}"
echo ""

# =============================================
# 1. BACKUP SÉCURISÉ
# =============================================

echo -e "${YELLOW}💾 ÉTAPE 1: Backup des fichiers actuels...${NC}"

BACKUP_DIR="chat_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Fichiers à sauvegarder
FILES_TO_BACKUP=(
    "frontend/src/hooks/useChat.ts"
    "frontend/src/components/chat/ChatPage.tsx"
    "frontend/src/components/chat/ChatWindow.tsx"
    "frontend/src/components/chat/MessageInput.tsx"
    "frontend/src/components/chat/MessageList.tsx"
    "frontend/src/components/chat/MessageBubble.tsx"
    "frontend/src/services/chatWebSocket.ts"
)

for file in "${FILES_TO_BACKUP[@]}"; do
    if [[ -f "$file" ]]; then
        cp "$file" "$BACKUP_DIR/$(basename $file)"
        echo -e "${GREEN}✅ Sauvegardé: $file${NC}"
    fi
done

echo -e "${GREEN}✅ Backup créé dans: $BACKUP_DIR${NC}"
echo ""

# =============================================
# 2. CRÉATION SERVICE WEBSOCKET OPTIMISÉ
# =============================================

echo -e "${YELLOW}🔧 ÉTAPE 2: Création service WebSocket optimisé...${NC}"

cat > frontend/src/services/chatWebSocketOptimized.ts << 'EOF'
// =============================================
// SERVICE WEBSOCKET AFFINIA OPTIMISÉ
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
  const socket: Socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001', {
    auth: { token },
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

  socket.on('user_typing', ({ conversationId: msgConvId, userId, userName, isTyping }) => {
    if (msgConvId === conversationId) {
      handlers.onTyping?.({ userId, userName, isTyping });
    }
  });

  const sendTyping = (isTyping: boolean) => {
    socket.emit('typing', { conversationId, isTyping });
  };

  const markAsReadRealtime = (lastMessageId: string) => {
    socket.emit('mark_as_read', { conversationId, lastMessageId });
  };

  const disconnect = () => {
    socket.emit('leave_conversation', { conversationId });
    socket.disconnect();
  };

  return { socket, sendTyping, markAsReadRealtime, disconnect };
}
EOF

echo -e "${GREEN}✅ Service WebSocket optimisé créé${NC}"

# =============================================
# 3. CRÉATION HOOK USECHAT OPTIMISÉ
# =============================================

echo -e "${YELLOW}🔧 ÉTAPE 3: Création hook useChat optimisé...${NC}"

cat > frontend/src/hooks/useChatOptimized.ts << 'EOF'
// =============================================
// HOOK USECHAT OPTIMISÉ - PAS DE RELOAD !
// =============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import { connectAffiniaSocket } from '../services/chatWebSocketOptimized';
import type { Message, Conversation } from '../../../shared/types/chat';

interface UseChatOptimizedOptions {
  conversationId?: string;
}

export function useChatOptimized({ conversationId }: UseChatOptimizedOptions = {}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<ReturnType<typeof connectAffiniaSocket> | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  // ✅ CHARGEMENT INITIAL (une seule fois par conversation)
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

  return {
    messages,
    loading,
    sending,
    error,
    isConnected,
    sendMessage,
    tryMarkAsRead,
    sendTypingIndicator,
    clearError: () => setError(null)
  };
}
EOF

echo -e "${GREEN}✅ Hook useChat optimisé créé${NC}"

# =============================================
# 4. CRÉATION MESSAGEINPUT OPTIMISÉ
# =============================================

echo -e "${YELLOW}🔧 ÉTAPE 4: Création MessageInput optimisé...${NC}"

cat > frontend/src/components/chat/MessageInputOptimized.tsx << 'EOF'
// =============================================
// MESSAGEINPUT OPTIMISÉ AVEC INDICATEURS
// =============================================

import React, { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';

interface MessageInputOptimizedProps {
  onSendMessage: (content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  isDarkMode: boolean;
  isMobile?: boolean;
}

export const MessageInputOptimized: React.FC<MessageInputOptimizedProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  isDarkMode,
  isMobile = false
}) => {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);

    onTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  }, [onTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || disabled || isSending) return;

    setIsSending(true);
    onTyping(false);

    try {
      await onSendMessage(content.trim());
      setContent('');
    } catch (error) {
      // Erreur gérée par le parent
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Tapez votre message..."
            disabled={disabled || isSending}
            rows={1}
            className={`w-full resize-none rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={disabled || isSending || !content.trim()}
          className={`p-3 rounded-lg transition-colors ${
            disabled || isSending || !content.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
};
EOF

echo -e "${GREEN}✅ MessageInput optimisé créé${NC}"

# =============================================
# 5. CORRECTION MESSAGEBUBBLE
# =============================================

echo -e "${YELLOW}🔧 ÉTAPE 5: Correction MessageBubble...${NC}"

# Ajouter prop isMobile manquante
sed -i '/isGrouped\?: boolean;/a\  isMobile?: boolean;' frontend/src/components/chat/MessageBubble.tsx
sed -i 's/isGrouped = false/isGrouped = false,\n  isMobile = false/g' frontend/src/components/chat/MessageBubble.tsx

echo -e "${GREEN}✅ MessageBubble corrigé${NC}"

# =============================================
# 6. CRÉATION CHATWINDOW OPTIMISÉ
# =============================================

echo -e "${YELLOW}🔧 ÉTAPE 6: Création ChatWindow optimisé...${NC}"

cat > frontend/src/components/chat/ChatWindowOptimized.tsx << 'EOF'
// =============================================
// CHATWINDOW OPTIMISÉ - TEMPS RÉEL
// =============================================

import React, { useEffect, useRef, useState } from 'react';
import { useChatOptimized } from '../../hooks/useChatOptimized';
import { MessageInputOptimized } from './MessageInputOptimized';
import { MessageBubble } from './MessageBubble';
import type { Conversation } from '../../../../shared/types/chat';

interface ChatWindowOptimizedProps {
  conversation: Conversation;
  isDarkMode: boolean;
  isMobile?: boolean;
}

export const ChatWindowOptimized: React.FC<ChatWindowOptimizedProps> = ({
  conversation,
  isDarkMode,
  isMobile = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const {
    messages,
    loading,
    sending,
    error,
    isConnected,
    sendMessage,
    sendTypingIndicator,
    clearError
  } = useChatOptimized({ conversationId: conversation.id });

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (typing: boolean) => {
    setIsTyping(typing);
    sendTypingIndicator(typing);
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      // Erreur déjà gérée dans le hook
    }
  };

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Chargement des messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Header avec status connexion */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {conversation.other_participant?.avatar_url ? (
              <img
                src={conversation.other_participant.avatar_url}
                alt={conversation.other_participant.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold">
                  {conversation.other_participant?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {conversation.other_participant?.name || 'Utilisateur'}
              </h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isConnected ? 'Connecté' : 'Hors ligne'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={clearError}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              ×
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Début de votre conversation
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onReactToMessage={() => {}}
              onDeleteMessage={() => {}}
              isDarkMode={isDarkMode}
              isMobile={isMobile}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInputOptimized
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={sending || !isConnected}
        isDarkMode={isDarkMode}
        isMobile={isMobile}
      />
    </div>
  );
};
EOF

echo -e "${GREEN}✅ ChatWindow optimisé créé${NC}"

# =============================================
# 7. MODIFICATION CHATPAGE
# =============================================

echo -e "${YELLOW}🔧 ÉTAPE 7: Modification ChatPage...${NC}"

# Remplacer imports dans ChatPage
sed -i 's/import { ChatWindow } from '\''\.\/ChatWindow'\'';/import { ChatWindowOptimized } from '\''\.\/ChatWindowOptimized'\'';/g' frontend/src/components/chat/ChatPage.tsx
sed -i 's/<ChatWindow/<ChatWindowOptimized/g' frontend/src/components/chat/ChatPage.tsx
sed -i 's/<\/ChatWindow>/<\/ChatWindowOptimized>/g' frontend/src/components/chat/ChatPage.tsx

echo -e "${GREEN}✅ ChatPage modifié${NC}"

# =============================================
# 8. CORRECTION MESSAGELIST
# =============================================

echo -e "${YELLOW}🔧 ÉTAPE 8: Correction MessageList clés uniques...${NC}"

# Corriger les clés dupliquées
sed -i 's/key={message.id}/key={`msg-${message.id}-${index}-${message.created_at}`}/g' frontend/src/components/chat/MessageList.tsx

echo -e "${GREEN}✅ MessageList corrigé${NC}"

# =============================================
# 9. INSTALLATION DÉPENDANCES
# =============================================

echo -e "${YELLOW}📦 ÉTAPE 9: Vérification dépendances...${NC}"

cd frontend

if ! npm list socket.io-client >/dev/null 2>&1; then
    echo -e "${YELLOW}Installation socket.io-client...${NC}"
    npm install socket.io-client
    echo -e "${GREEN}✅ socket.io-client installé${NC}"
else
    echo -e "${GREEN}✅ socket.io-client déjà installé${NC}"
fi

cd ..

# =============================================
# 10. CRÉATION SCRIPT DE ROLLBACK
# =============================================

echo -e "${YELLOW}🔄 ÉTAPE 10: Création script de rollback...${NC}"

cat > rollback_chat_optimization.sh << EOF
#!/bin/bash
echo "🔄 ROLLBACK OPTIMISATION CHAT..."

# Restaurer fichiers depuis backup
if [[ -d "$BACKUP_DIR" ]]; then
    cp "$BACKUP_DIR/useChat.ts" frontend/src/hooks/useChat.ts 2>/dev/null || true
    cp "$BACKUP_DIR/ChatPage.tsx" frontend/src/components/chat/ChatPage.tsx 2>/dev/null || true
    cp "$BACKUP_DIR/ChatWindow.tsx" frontend/src/components/chat/ChatWindow.tsx 2>/dev/null || true
    cp "$BACKUP_DIR/MessageInput.tsx" frontend/src/components/chat/MessageInput.tsx 2>/dev/null || true
    cp "$BACKUP_DIR/MessageList.tsx" frontend/src/components/chat/MessageList.tsx 2>/dev/null || true
    cp "$BACKUP_DIR/MessageBubble.tsx" frontend/src/components/chat/MessageBubble.tsx 2>/dev/null || true
    cp "$BACKUP_DIR/chatWebSocket.ts" frontend/src/services/chatWebSocket.ts 2>/dev/null || true
    
    echo "✅ Fichiers restaurés depuis $BACKUP_DIR"
else
    echo "❌ Dossier backup introuvable"
fi

# Supprimer fichiers optimisés
rm -f frontend/src/services/chatWebSocketOptimized.ts
rm -f frontend/src/hooks/useChatOptimized.ts
rm -f frontend/src/components/chat/ChatWindowOptimized.tsx
rm -f frontend/src/components/chat/MessageInputOptimized.tsx

echo "🔄 Rollback terminé"
EOF

chmod +x rollback_chat_optimization.sh
echo -e "${GREEN}✅ Script rollback créé: rollback_chat_optimization.sh${NC}"

# =============================================
# 11. TEST ET FINALISATION
# =============================================

echo ""
echo -e "${PURPLE}🎉 OPTIMISATION TERMINÉE !${NC}"
echo ""
echo -e "${GREEN}✅ FICHIERS CRÉÉS/MODIFIÉS :${NC}"
echo -e "  📁 frontend/src/services/chatWebSocketOptimized.ts"
echo -e "  📁 frontend/src/hooks/useChatOptimized.ts"
echo -e "  📁 frontend/src/components/chat/ChatWindowOptimized.tsx"
echo -e "  📁 frontend/src/components/chat/MessageInputOptimized.tsx"
echo -e "  🔧 frontend/src/components/chat/ChatPage.tsx (modifié)"
echo -e "  🔧 frontend/src/components/chat/MessageBubble.tsx (corrigé)"
echo -e "  🔧 frontend/src/components/chat/MessageList.tsx (corrigé)"
echo ""
echo -e "${YELLOW}📝 PROCHAINES ÉTAPES :${NC}"
echo -e "1. ${BLUE}cd frontend && npm run dev${NC}"
echo -e "2. ${BLUE}Tester le chat dans /chat${NC}"
echo -e "3. ${BLUE}Vérifier console = 0 erreur${NC}"
echo ""
echo -e "${GREEN}🚀 AVANTAGES APPORTÉS :${NC}"
echo -e "  ✅ Plus de boucle infinie"
echo -e "  ✅ Plus de reload après envoi"
echo -e "  ✅ WebSocket temps réel"
echo -e "  ✅ Clés React uniques"
echo -e "  ✅ Indicateurs de frappe"
echo -e "  ✅ Status connexion"
echo -e "  ✅ UX optimisée"
echo ""
echo -e "${RED}🔄 SI PROBLÈME : ./rollback_chat_optimization.sh${NC}"
echo ""
echo -e "${PURPLE}🎯 CHAT AFFINIA MAINTENANT NIVEAU WHATSAPP ! 🚀${NC}"