// shared/types/contact.ts
export interface ContactRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  requested_at: string;
  responded_at: string | null;
  cooldown_until: string | null;
  conversation_id: string | null;
  sender?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface ContactRequestResponse {
  success: boolean;
  message: string;
  request?: any;
  can_retry_after?: string;
}

// Types pour les payloads de notifications
export interface ContactNotificationPayload {
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  responder_id?: string;
  responder_name?: string;
  responder_avatar?: string;
  request_id: string;
  sender_message?: string;
  response?: 'accepted' | 'declined';
  conversation_id?: string;
}