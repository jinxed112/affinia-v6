#!/bin/bash
echo "🔄 ROLLBACK OPTIMISATION CHAT..."

# Restaurer fichiers depuis backup
if [[ -d "chat_backup_20250812_105726" ]]; then
    cp "chat_backup_20250812_105726/useChat.ts" frontend/src/hooks/useChat.ts 2>/dev/null || true
    cp "chat_backup_20250812_105726/ChatPage.tsx" frontend/src/components/chat/ChatPage.tsx 2>/dev/null || true
    cp "chat_backup_20250812_105726/ChatWindow.tsx" frontend/src/components/chat/ChatWindow.tsx 2>/dev/null || true
    cp "chat_backup_20250812_105726/MessageInput.tsx" frontend/src/components/chat/MessageInput.tsx 2>/dev/null || true
    cp "chat_backup_20250812_105726/MessageList.tsx" frontend/src/components/chat/MessageList.tsx 2>/dev/null || true
    cp "chat_backup_20250812_105726/MessageBubble.tsx" frontend/src/components/chat/MessageBubble.tsx 2>/dev/null || true
    cp "chat_backup_20250812_105726/chatWebSocket.ts" frontend/src/services/chatWebSocket.ts 2>/dev/null || true
    
    echo "✅ Fichiers restaurés depuis chat_backup_20250812_105726"
else
    echo "❌ Dossier backup introuvable"
fi

# Supprimer fichiers optimisés
rm -f frontend/src/services/chatWebSocketOptimized.ts
rm -f frontend/src/hooks/useChatOptimized.ts
rm -f frontend/src/components/chat/ChatWindowOptimized.tsx
rm -f frontend/src/components/chat/MessageInputOptimized.tsx

echo "🔄 Rollback terminé"
