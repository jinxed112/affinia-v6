// =============================================
// INDEX EXPORT - backend/src/modules/chat/index.ts
// =============================================

export { chatService } from './chat.service';
export { chatController } from './chat.controller';
export { default as chatRoutes } from './chat.routes';

export type {
  Conversation,
  Message,
  MessageRead,
  CreateConversationParams,
  SendMessageParams,
  UpdateMessageParams,
  ReactToMessageParams
} from './chat.service';