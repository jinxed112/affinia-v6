// ============================================
// SERVICE DE NOTIFICATIONS COMPLET
// Fichier : backend/src/modules/notifications/notification.service.ts
// ============================================

import { supabaseAdmin } from '../../config/database';

// 🎯 CONFIGURATION DE TOUS LES ÉVÉNEMENTS
export const NOTIFICATION_CONFIG = {
  // ============ EXISTANTS ============
  PROFILE_VIEW: {
    type: 'profile_view' as const,
    title: 'Profil consulté',
    messageTemplate: (senderName: string) => `${senderName} a consulté votre profil`,
    frequency: 'grouped_24h',
    priority: 'low'
  },

  MIRROR_REQUEST: {
    type: 'mirror_request' as const,
    title: 'Demande de miroir',
    messageTemplate: (senderName: string) => `${senderName} souhaite consulter votre miroir`,
    frequency: 'immediate',
    priority: 'high'
  },

  MIRROR_ACCEPTED: {
    type: 'mirror_accepted' as const,
    title: 'Miroir accepté',
    messageTemplate: (responderName: string) => `${responderName} a accepté votre demande de miroir`,
    frequency: 'immediate',
    priority: 'high'
  },

  MIRROR_REJECTED: {
    type: 'mirror_rejected' as const,
    title: 'Miroir refusé',
    messageTemplate: (responderName: string) => `${responderName} a refusé votre demande de miroir`,
    frequency: 'immediate',
    priority: 'medium'
  },

  MIRROR_READ: {
    type: 'mirror_read' as const,
    title: 'Miroir consulté',
    messageTemplate: (viewerName: string) => `${viewerName} a lu votre miroir`,
    frequency: 'grouped_24h',
    priority: 'low'
  },

  CONTACT_REQUEST: {
    type: 'contact_request' as const,
    title: 'Demande de contact',
    messageTemplate: (senderName: string) => `${senderName} souhaite entrer en contact avec vous`,
    frequency: 'immediate',
    priority: 'high'
  },

  CONTACT_ACCEPTED: {
    type: 'contact_accepted' as const,
    title: 'Contact accepté',
    messageTemplate: (responderName: string) => `${responderName} a accepté votre demande de contact`,
    frequency: 'immediate',
    priority: 'high'
  },

  CONTACT_DECLINED: {
    type: 'contact_declined_soft' as const,
    title: 'Contact refusé',
    messageTemplate: (responderName: string) => `${responderName} a refusé votre demande de contact`,
    frequency: 'immediate',
    priority: 'low'
  },

  // ============ NOUVEAUX ============
  NEW_MESSAGE: {
    type: 'chat_message' as const,
    title: 'Nouveau message',
    messageTemplate: (senderName: string) => `${senderName} vous a envoyé un message`,
    frequency: 'immediate',
    priority: 'high'
  },

  NEW_MATCH: {
    type: 'new_match' as const,
    title: 'Nouveau match',
    messageTemplate: (matchName: string) => `Vous avez un nouveau match avec ${matchName}`,
    frequency: 'immediate',
    priority: 'high'
  },

  HIGH_COMPATIBILITY: {
    type: 'system' as const,
    title: 'Forte compatibilité',
    messageTemplate: (userName: string, score?: number) => 
      `Forte compatibilité détectée avec ${userName}${score ? ` (${score}%)` : ''}`,
    frequency: 'daily',
    priority: 'medium'
  },

  LEVEL_UP: {
    type: 'level_up' as const,
    title: 'Nouveau niveau',
    messageTemplate: (level: number) => `🎉 Félicitations ! Vous avez atteint le niveau ${level}`,
    frequency: 'immediate',
    priority: 'medium'
  },

  QUEST_COMPLETED: {
    type: 'quest_completed' as const,
    title: 'Quête complétée',
    messageTemplate: (questName: string) => `Quête "${questName}" terminée ! Récompense récupérée`,
    frequency: 'immediate',
    priority: 'low'
  },

  QUESTIONNAIRE_COMPLETED: {
    type: 'questionnaire_completed' as const,
    title: 'Questionnaire terminé',
    messageTemplate: () => `Votre profil psychologique a été généré avec succès`,
    frequency: 'immediate',
    priority: 'high'
  },

  PHOTO_APPROVED: {
    type: 'system' as const,
    title: 'Photo approuvée',
    messageTemplate: () => `Votre photo a été approuvée et est maintenant visible`,
    frequency: 'immediate',
    priority: 'medium'
  },

  PHOTO_REJECTED: {
    type: 'system' as const,
    title: 'Photo rejetée',
    messageTemplate: (reason: string) => `Photo rejetée : ${reason}`,
    frequency: 'immediate',
    priority: 'medium'
  },

  WEEKLY_SUMMARY: {
    type: 'system' as const,
    title: 'Résumé hebdomadaire',
    messageTemplate: (stats: any) => 
      `Cette semaine : ${stats?.views || 0} vues, ${stats?.matches || 0} matchs`,
    frequency: 'weekly',
    priority: 'low'
  }
};

// ============ SERVICE PRINCIPAL ============
export class NotificationService {
  
  /**
   * Créer une notification selon la config
   */
  static async createNotification(
    eventType: keyof typeof NOTIFICATION_CONFIG,
    recipientId: string,
    triggerData: {
      senderName?: string;
      senderId?: string;
      senderAvatar?: string;
      responderName?: string;
      responderId?: string;
      responderAvatar?: string;
      viewerName?: string;
      viewerId?: string;
      viewerAvatar?: string;
      conversationId?: string;
      matchId?: string;
      compatibilityScore?: number;
      level?: number;
      questName?: string;
      reason?: string;
      stats?: any;
      [key: string]: any;
    }
  ): Promise<void> {
    try {
      const config = NOTIFICATION_CONFIG[eventType];
      
      if (!config) {
        console.error(`❌ Configuration manquante pour ${eventType}`);
        return;
      }
      
      // Vérifier la fréquence (anti-spam)
      if (config.frequency !== 'immediate') {
        const shouldSkip = await this.checkFrequencyLimit(
          recipientId, 
          config.type, 
          config.frequency
        );
        if (shouldSkip) {
          console.log(`⚡ Notification ${eventType} skipped (frequency limit)`);
          return;
        }
      }

      // Générer le message selon le type
      let message: string;
      if (eventType === 'LEVEL_UP') {
        message = config.messageTemplate(triggerData.level || 1);
      } else if (eventType === 'HIGH_COMPATIBILITY') {
        message = config.messageTemplate(
          triggerData.senderName || triggerData.responderName || triggerData.viewerName || 'Quelqu\'un',
          triggerData.compatibilityScore
        );
      } else if (eventType === 'QUEST_COMPLETED') {
        message = config.messageTemplate(triggerData.questName || 'Quête inconnue');
      } else if (eventType === 'PHOTO_REJECTED') {
        message = config.messageTemplate(triggerData.reason || 'Raison non spécifiée');
      } else if (eventType === 'WEEKLY_SUMMARY') {
        message = config.messageTemplate(triggerData.stats || {});
      } else {
        message = config.messageTemplate(
          triggerData.senderName || triggerData.responderName || triggerData.viewerName || 'Quelqu\'un'
        );
      }

      // Créer le payload avec redirect URL
      const payload = {
        ...triggerData,
        event_type: eventType,
        redirect_url: this.getRedirectUrl(eventType, triggerData)
      };

      // Créer la notification
      const { error } = await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_id: recipientId,
          sender_id: triggerData.senderId || triggerData.responderId || triggerData.viewerId || null,
          type: config.type,
          title: config.title,
          message: message,
          status: 'unread',
          payload: payload
        });

      if (error) {
        console.error(`❌ Erreur création notification ${eventType}:`, error);
      } else {
        console.log(`✅ Notification ${eventType} créée pour ${recipientId}`);
      }
      
    } catch (error) {
      console.error(`❌ Erreur générale notification ${eventType}:`, error);
    }
  }

  /**
   * Calculer l'URL de redirection selon l'événement
   */
  private static getRedirectUrl(
    eventType: keyof typeof NOTIFICATION_CONFIG,
    triggerData: any
  ): string {
    switch (eventType) {
      case 'PROFILE_VIEW':
        return `/profil/${triggerData.viewerId || triggerData.senderId}`;
      case 'MIRROR_REQUEST':
        return '/demandes?tab=mirror';
      case 'MIRROR_ACCEPTED':
        return `/miroir/${triggerData.responderId || triggerData.senderId}`;
      case 'MIRROR_REJECTED':
        return '/decouverte';
      case 'MIRROR_READ':
        return '/miroir';
      case 'CONTACT_REQUEST':
        return '/demandes?tab=contact';
      case 'CONTACT_ACCEPTED':
        return triggerData.conversationId ? `/chat/${triggerData.conversationId}` : '/chat';
      case 'CONTACT_DECLINED':
        return '/decouverte';
      case 'NEW_MESSAGE':
        return triggerData.conversationId ? `/chat/${triggerData.conversationId}` : '/chat';
      case 'NEW_MATCH':
        return `/profil/${triggerData.matchId || triggerData.senderId}`;
      case 'HIGH_COMPATIBILITY':
        return `/profil/${triggerData.senderId}`;
      case 'LEVEL_UP':
        return '/profil?tab=achievements';
      case 'QUEST_COMPLETED':
        return '/profil?tab=quests';
      case 'QUESTIONNAIRE_COMPLETED':
        return '/miroir';
      case 'PHOTO_APPROVED':
      case 'PHOTO_REJECTED':
        return '/profil?tab=photos';
      case 'WEEKLY_SUMMARY':
        return '/profil?tab=stats';
      default:
        return '/profil';
    }
  }

  /**
   * Vérifier les limites de fréquence pour éviter spam
   */
  private static async checkFrequencyLimit(
    recipientId: string,
    type: string,
    frequency: string
  ): Promise<boolean> {
    let timeLimit: Date;
    
    switch (frequency) {
      case 'grouped_24h':
        timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case 'daily':
        timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        timeLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        return false; // Pas de limite pour 'immediate'
    }

    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq('type', type)
      .gte('created_at', timeLimit.toISOString())
      .limit(1);

    return (existing?.length || 0) > 0;
  }

  /**
   * Créer notifications en batch (pour migration/import)
   */
  static async createBulkNotifications(
    notifications: Array<{
      eventType: keyof typeof NOTIFICATION_CONFIG;
      recipientId: string;
      triggerData: any;
    }>
  ): Promise<void> {
    console.log(`📦 Création en batch de ${notifications.length} notifications`);
    
    for (const notif of notifications) {
      await this.createNotification(
        notif.eventType,
        notif.recipientId,
        notif.triggerData
      );
      
      // Délai pour éviter spam
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Batch notifications terminé');
  }

  /**
   * Test rapide pour vérifier le service
   */
  static async testNotification(recipientId: string): Promise<void> {
    await this.createNotification('NEW_MESSAGE', recipientId, {
      senderId: 'test-sender',
      senderName: 'Test User',
      conversationId: 'test-conversation'
    });
  }
}