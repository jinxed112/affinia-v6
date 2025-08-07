// backend/src/modules/chat/chat.controller.ts
// =============================================
// CONTRÔLEUR CHAT - CORRIGÉ RLS
// =============================================

import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../auth/auth.middleware';
import { chatService } from './chat.service';

class ChatController {

  // ============ GESTION DES CONVERSATIONS ============

  /**
   * ✅ CORRIGÉ - GET /api/chat/conversations - Récupérer les conversations de l'utilisateur
   */
  async getConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      console.log('📝 Chat Controller - Récupération conversations:', { userId, limit, offset });

      const conversations = await chatService.getUserConversations(userId, req.userToken!, limit, offset);

      res.json({
        success: true,
        data: conversations
      });

    } catch (error) {
      console.error('❌ Chat Controller - Erreur getConversations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * ✅ CORRIGÉ - GET /api/chat/conversations/:id - Récupérer une conversation spécifique
   */
  async getConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id: conversationId } = req.params;

      console.log('👁️ Chat Controller - Récupération conversation:', { userId, conversationId });

      const conversation = await chatService.getConversation(conversationId, userId, req.userToken!);

      if (!conversation) {
        res.status(404).json({
          success: false,
          error: 'Conversation not found or access denied'
        });
        return;
      }

      res.json({
        success: true,
        data: conversation
      });

    } catch (error) {
      console.error('❌ Chat Controller - Erreur getConversation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/chat/conversations - Créer une nouvelle conversation
   */
  async createConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.id;
      const { participant_id } = req.body;

      console.log('💬 Chat Controller - Création conversation:', { userId, participant_id });

      if (userId === participant_id) {
        res.status(400).json({
          success: false,
          error: 'Cannot create conversation with yourself'
        });
        return;
      }

      const conversation = await chatService.createConversation({
        participant_1_id: userId,
        participant_2_id: participant_id
      });

      res.status(201).json({
        success: true,
        data: conversation,
        message: 'Conversation created successfully'
      });

    } catch (error) {
      console.error('❌ Chat Controller - Erreur createConversation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create conversation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ============ GESTION DES MESSAGES ============

  /**
   * ✅ CORRIGÉ - GET /api/chat/conversations/:id/messages - Récupérer les messages d'une conversation
   */
  async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id: conversationId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      console.log('📋 Chat Controller - Récupération messages:', { conversationId, userId, limit, offset });

      const messages = await chatService.getConversationMessages(conversationId, userId, req.userToken!, limit, offset);

      res.json({
        success: true,
        data: messages
      });

    } catch (error) {
      console.error('❌ Chat Controller - Erreur getMessages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * ✅ CORRIGÉ - POST /api/chat/conversations/:id/messages - Envoyer un message
   */
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.id;
      const { id: conversationId } = req.params;
      const {
        content,
        message_type = 'text',
        media_url,
        media_metadata,
        reply_to_id,
        expires_in_minutes
      } = req.body;

      console.log('📤 Chat Controller - Envoi message:', { conversationId, userId, message_type });

      const message = await chatService.sendMessage({
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type,
        media_url,
        media_metadata,
        reply_to_id,
        expires_in_minutes
      }, req.userToken!);

      res.status(201).json({
        success: true,
        data: message,
        message: 'Message sent successfully'
      });

    } catch (error) {
      console.error('❌ Chat Controller - Erreur sendMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * ✅ CORRIGÉ - PUT /api/chat/messages/:id - Modifier un message
   */
  async updateMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.id;
      const { id: messageId } = req.params;
      const { content, media_url, media_metadata } = req.body;

      console.log('✏️ Chat Controller - Modification message:', { messageId, userId });

      const message = await chatService.updateMessage({
        message_id: messageId,
        user_id: userId,
        content,
        media_url,
        media_metadata
      }, req.userToken!);

      res.json({
        success: true,
        data: message,
        message: 'Message updated successfully'
      });

    } catch (error) {
      console.error('❌ Chat Controller - Erreur updateMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * ✅ CORRIGÉ - DELETE /api/chat/messages/:id - Supprimer un message
   */
  async deleteMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id: messageId } = req.params;

      console.log('🗑️ Chat Controller - Suppression message:', { messageId, userId });

      const success = await chatService.deleteMessage(messageId, userId, req.userToken!);

      if (success) {
        res.json({
          success: true,
          message: 'Message deleted successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to delete message'
        });
      }

    } catch (error) {
      console.error('❌ Chat Controller - Erreur deleteMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * ✅ CORRIGÉ - POST /api/chat/messages/:id/react - Réagir à un message
   */
  async reactToMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.id;
      const { id: messageId } = req.params;
      const { emoji, action = 'add' } = req.body;

      console.log('😊 Chat Controller - Réaction message:', { messageId, userId, emoji, action });

      const message = await chatService.reactToMessage({
        message_id: messageId,
        user_id: userId,
        emoji,
        action
      }, req.userToken!);

      res.json({
        success: true,
        data: message,
        message: `Reaction ${action}ed successfully`
      });

    } catch (error) {
      console.error('❌ Chat Controller - Erreur reactToMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to react to message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ============ GESTION DES LECTURES ============

  /**
   * ✅ CORRIGÉ - POST /api/chat/conversations/:id/read - Marquer les messages comme lus
   */
  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id: conversationId } = req.params;
      const { last_message_id } = req.body;

      console.log('✅ Chat Controller - Marquage lu:', { conversationId, userId, last_message_id });

      await chatService.markMessagesAsRead(conversationId, userId, last_message_id, req.userToken!);

      res.json({
        success: true,
        message: 'Messages marked as read'
      });

    } catch (error) {
      console.error('❌ Chat Controller - Erreur markAsRead:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark messages as read',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * ✅ CORRIGÉ - GET /api/chat/conversations/:id/unread-count - Compter les messages non lus
   */
  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id: conversationId } = req.params;

      const unreadCount = await chatService.getUnreadMessagesCount(conversationId, userId, req.userToken!);

      res.json({
        success: true,
        data: { unread_count: unreadCount }
      });

    } catch (error) {
      console.error('❌ Chat Controller - Erreur getUnreadCount:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get unread count',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * ✅ CORRIGÉ - GET /api/chat/stats - Statistiques globales du chat
   */
  async getChatStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const totalUnreadConversations = await chatService.getTotalUnreadConversationsCount(userId, req.userToken!);

      res.json({
        success: true,
        data: {
          total_unread_conversations: totalUnreadConversations
        }
      });

    } catch (error) {
      console.error('❌ Chat Controller - Erreur getChatStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get chat stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const chatController = new ChatController();