// ============================================
// TYPES ÉTENDUS À AJOUTER DANS shared/types/discovery.ts
// Action : REMPLACER la section NotificationType existante
// ============================================

// 🆕 REMPLACER cette section dans le fichier existant :
export type NotificationType =
  | 'profile_view'
  | 'mirror_request'
  | 'mirror_accepted'
  | 'mirror_rejected'
  | 'mirror_read'
  | 'contact_request'
  | 'contact_accepted'
  | 'contact_declined_soft'
  | 'system'
  | 'chat_message'
  | 'new_match'                    // 🆕 NOUVEAU
  | 'level_up'                     // 🆕 NOUVEAU
  | 'quest_completed'              // 🆕 NOUVEAU
  | 'questionnaire_completed';     // 🆕 NOUVEAU

// 🆕 ÉTENDRE NotificationPayload existant - AJOUTER ces champs :
export interface NotificationPayload {
  // ========== EXISTANTS (garder) ==========
  viewer_id?: string;
  viewer_name?: string;
  viewer_avatar?: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  responder_id?: string;
  responder_name?: string;
  responder_avatar?: string;
  request_id?: string;
  response?: 'accepted' | 'rejected';

  // ========== NOUVEAUX (ajouter) ==========
  event_type?: string;             // Type d'événement (LEVEL_UP, NEW_MATCH, etc.)
  redirect_url?: string;           // URL de redirection calculée

  // Chat & Messages
  conversation_id?: string;
  message_id?: string;
  message_content?: string;        // Aperçu du message

  // Matching
  match_id?: string;
  compatibility_score?: number;

  // Gamification
  level?: number;
  previous_level?: number;
  xp_gained?: number;
  quest_id?: string;
  quest_name?: string;
  reward_xp?: number;
  reward_credits?: number;

  // Questionnaire
  response_id?: string;
  questionnaire_type?: 'personality' | 'preferences' | 'values';
  profile_length?: number;

  // Photos
  photo_id?: string;
  photo_url?: string;
  rejection_reason?: string;

  // Statistiques
  stats?: {
    views?: number;
    matches?: number;
    messages_sent?: number;
    mirror_reads?: number;
    [key: string]: number | undefined;
  };

  // Extension
  [key: string]: any;
}

// 🆕 REMPLACER la fonction isValidNotificationType existante :
export function isValidNotificationType(value: string): value is NotificationType {
  const validTypes: NotificationType[] = [
    'profile_view', 'mirror_request', 'mirror_accepted',
    'mirror_rejected', 'mirror_read', 'contact_request',
    'contact_accepted', 'contact_declined_soft', 'system', 
    'chat_message', 'new_match', 'level_up', 
    'quest_completed', 'questionnaire_completed'
  ];
  return validTypes.includes(value as NotificationType);
}