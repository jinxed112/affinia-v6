// =============================================
// TYPES PARTAGÉS - shared/types/chat.ts
// =============================================

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  created_at: string;
  last_message_at: string;
  last_message_id: string | null;
  status: 'active' | 'archived' | 'blocked';
  // Données enrichies côté frontend
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
  // Données enrichies côté frontend
  sender?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  reply_to?: Message;
  is_own_message?: boolean; // Calculé côté frontend
  is_expired?: boolean; // Calculé côté frontend
}

export interface MessageRead {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_message_id: string | null;
  read_at: string;
}

// ============ INTERFACES POUR LES PARAMÈTRES ============

export interface CreateConversationParams {
  participant_1_id: string;
  participant_2_id: string;
}

export interface SendMessageParams {
  content?: string;
  message_type?: 'text' | 'image' | 'voice';
  media_url?: string;
  media_metadata?: any;
  reply_to_id?: string;
  expires_in_minutes?: number;
}

export interface UpdateMessageParams {
  content?: string;
  media_url?: string;
  media_metadata?: any;
}

export interface ReactToMessageParams {
  emoji: string;
  action?: 'add' | 'remove';
}

export interface ChatStats {
  total_unread_conversations: number;
}

// ============ INTERFACES POUR LE CONTEXTE REACT ============

export interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  chatStats: ChatStats;
  isLoading: boolean;
  isLoadingMessages: boolean;
  isConnected: boolean; // WebSocket

  // Actions
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, params: SendMessageParams) => Promise<void>;
  markAsRead: (conversationId: string, lastMessageId: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string, action?: 'add' | 'remove') => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  
  // Navigation
  selectConversation: (conversation: Conversation) => void;
  
  // Stats
  getChatStats: () => Promise<ChatStats>;
}

// ============ INTERFACES WEBSOCKET ============

export interface WebSocketEvents {
  // Messages
  new_message: (data: { conversationId: string; message: Message; timestamp: string }) => void;
  message_updated: (data: { conversationId: string; message: Message; timestamp: string }) => void;
  message_deleted: (data: { conversationId: string; messageId: string; timestamp: string }) => void;
  message_reaction: (data: { 
    conversationId: string; 
    messageId: string; 
    emoji: string; 
    action: 'add' | 'remove'; 
    userId: string; 
    timestamp: string; 
  }) => void;

  // Conversations
  new_conversation: (data: { conversation: Conversation; timestamp: string }) => void;
  conversation_updated: (data: { conversationId: string; timestamp: string }) => void;

  // Présence
  user_typing: (data: { userId: string; userName: string; isTyping: boolean }) => void;
  message_read_by_user: (data: { userId: string; messageId: string; readAt: string }) => void;
  online_status_update: (data: Array<{ userId: string; isOnline: boolean; lastSeen: string }>) => void;

  // Système
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
}

// ============ INTERFACES UPLOAD MÉDIAS ============

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  metadata?: {
    size: number;
    type: string;
    duration?: number; // Pour l'audio
    width?: number; // Pour les images
    height?: number; // Pour les images
  };
}

export interface MediaMetadata {
  size: number;
  type: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnail_url?: string;
}

// ============ INTERFACES RÉACTIONS ============

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  hasUserReacted?: boolean; // Calculé côté frontend
}

// ============ INTERFACES TYPING INDICATORS ============

export interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: string;
}

// ============ INTERFACES POUR LES COMPOSANTS ============

export interface ChatPageProps {
  isDarkMode: boolean;
}

export interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  isDarkMode: boolean;
}

export interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  isLoadingMessages: boolean;
  onSendMessage: (content: string, replyToId?: string) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isDarkMode: boolean;
}

export interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isDarkMode: boolean;
}

export interface MessageBubbleProps {
  message: Message;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isDarkMode: boolean;
}

export interface MessageInputProps {
  onSendMessage: (content: string, replyToId?: string) => void;
  isDarkMode: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// ============ CONSTANTES ============

export const MESSAGE_TYPES = {
  TEXT: 'text' as const,
  IMAGE: 'image' as const,
  VOICE: 'voice' as const,
  SYSTEM: 'system' as const,
};

export const CONVERSATION_STATUS = {
  ACTIVE: 'active' as const,
  ARCHIVED: 'archived' as const,
  BLOCKED: 'blocked' as const,
};

export const REACTION_EMOJIS = [
  '❤️', '😂', '👍', '👎', '😮', '😢', '😡', '🔥', '💯', '👏'
] as const;

export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_MEDIA_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VOICE_SIZE = 5 * 1024 * 1024; // 5MB

// ============ UTILITAIRES TYPE ============

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
export type ConversationStatus = typeof CONVERSATION_STATUS[keyof typeof CONVERSATION_STATUS];
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

// ============ GUARDS TYPE ============

export function isMessage(obj: any): obj is Message {
  return obj && typeof obj.id === 'string' && typeof obj.conversation_id === 'string';
}

export function isConversation(obj: any): obj is Conversation {
  return obj && typeof obj.id === 'string' && typeof obj.participant_1_id === 'string';
}

export function isValidMessageType(type: string): type is MessageType {
  return Object.values(MESSAGE_TYPES).includes(type as MessageType);
}

export function isValidConversationStatus(status: string): status is ConversationStatus {
  return Object.values(CONVERSATION_STATUS).includes(status as ConversationStatus);
}