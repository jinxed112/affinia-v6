// =============================================
// INDEX EXPORT - frontend/src/components/chat/index.ts
// =============================================

// Composants principaux
export { ChatPage } from './ChatPage';
export { ChatTest } from './ChatTest';
export { ChatWindow } from './ChatWindow';
export { ConversationList } from './ConversationList';
export { MessageList } from './MessageList';
export { MessageBubble } from './MessageBubble';
export { MessageInput } from './MessageInput';

// Hook principal
export { useChat } from '../../hooks/useChat';

// Service (ton service existant - parfait comme il est !)
export { chatService } from '../../services/chatService';

// Types réexportés pour faciliter l'import
export type {
  Conversation,
  Message,
  ChatStats,
  SendMessageParams,
  MessageReaction,
  ChatPageProps,
  ConversationListProps,
  ChatWindowProps,
  MessageListProps,
  MessageBubbleProps,
  MessageInputProps
} from '../../../../shared/types/chat';