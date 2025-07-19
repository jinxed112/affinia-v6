// =============================================
// TYPES - Système de découverte et miroir privé
// =============================================

// Types de base pour les enums
export type MirrorVisibility = 'public' | 'on_request' | 'private';
export type MirrorRequestStatus = 'pending' | 'accepted' | 'rejected';
export type NotificationType = 'profile_view' | 'mirror_request' | 'mirror_accepted' | 'mirror_rejected' | 'mirror_read';
export type NotificationStatus = 'unread' | 'read';

// Structure des réponses questionnaire (format attendu)
export interface QuestionnaireAnswers {
  firstName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  orientation?: 'hétéro' | 'homo' | 'bi' | 'autre';
  city?: string;
  energySource?: string;
  lovePriority?: string;
  ideal_partner?: string;
  free_expression?: string;
  conflictApproach?: string;
  communicationStyle?: string;
  relationship_learning?: string;
  // Autres champs selon votre questionnaire
}

// Profile étendu avec nouvelles colonnes
export interface ProfileExtended {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  xp: number;
  credits: number;
  level: number;
  bio: string | null;
  birth_date: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  role: string;
  mirror_visibility: MirrorVisibility;
  created_at: string;
  updated_at: string;
}

// Profile pour la découverte (données publiques)
export interface DiscoveryProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  age: number | null;
  gender: string | null;
  bio: string | null;
  mirror_visibility: MirrorVisibility;
  distance_km?: number; // Calculée côté serveur
  photos: ProfilePhoto[];
  // Données questionnaire filtrées
  questionnaire_snippet?: {
    authenticity_score?: number;
    attachment_style?: string;
    strength_signals?: string[];
  };
  // Statut des interactions
  interaction_status?: {
    mirror_request_status?: MirrorRequestStatus;
    can_request_mirror: boolean;
    mirror_access_expires?: string;
  };
}

// Demande d'accès au miroir
export interface MirrorRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: MirrorRequestStatus;
  created_at: string;
  responded_at: string | null;
  // Données jointes
  sender?: {
    name: string;
    avatar_url: string | null;
  };
  receiver?: {
    name: string;
    avatar_url: string | null;
  };
}

// Accès temporaire au miroir
export interface MirrorAccess {
  id: string;
  viewer_id: string;
  profile_id: string;
  granted_at: string;
  expires_at: string;
  // Données jointes
  profile?: {
    name: string;
    avatar_url: string | null;
  };
}

// Notification
export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: NotificationType;
  status: NotificationStatus;
  payload: {
    [key: string]: any;
    // Payload spécifique selon le type
    sender_name?: string;
    sender_avatar?: string;
    responder_name?: string;
    responder_avatar?: string;
    request_id?: string;
    profile_id?: string;
  };
  created_at: string;
}

// Vue du profil (tracking)
export interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_profile_id: string;
  viewed_at: string;
}

// Filtres pour la découverte
export interface DiscoveryFilters {
  gender?: 'male' | 'female' | 'other' | 'all';
  min_age?: number;
  max_age?: number;
  max_distance_km?: number;
  mirror_visibility?: MirrorVisibility[];
  has_photos?: boolean;
  has_questionnaire?: boolean;
  sort_by?: 'distance' | 'age' | 'newest' | 'random';
  limit?: number;
  offset?: number;
}

// Réponse API pour la découverte
export interface DiscoveryResponse {
  profiles: DiscoveryProfile[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  filters_applied: DiscoveryFilters;
}

// Statistiques pour le header notifications
export interface NotificationStats {
  unread_count: number;
  profile_views_count: number;
  mirror_reads_count: number;
  pending_requests_count: number;
}

// Réponse API pour les demandes miroir
export interface MirrorRequestResponse {
  success: boolean;
  message: string;
  request?: MirrorRequest;
  can_retry_after?: string; // ISO date
}

// Données pour le composant ProfileCard
export interface ProfileCardData extends DiscoveryProfile {
  main_photo?: ProfilePhoto;
  photos_count: number;
  questionnaire_completed: boolean;
  mirror_locked: boolean;
  interaction_status: {
    mirror_request_status?: MirrorRequestStatus;
    can_request_mirror: boolean;
    mirror_access_expires?: string;
    last_request_date?: string;
  };
}

// Interface pour les préférences de recherche (extension)
export interface RelationshipPreferencesExtended {
  id: string;
  user_id: string;
  relationship_type: string[];
  interested_in_genders: string[];
  min_age: number;
  max_age: number;
  search_radius_km: number;
  show_me_on_affinia: boolean;
  created_at: string;
  updated_at: string;
}

// Contexte pour les notifications temps réel
export interface NotificationContext {
  stats: NotificationStats;
  recent_notifications: Notification[];
  updateStats: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// Paramètres pour les actions
export interface RequestMirrorParams {
  receiver_id: string;
  message?: string;
}

export interface RespondMirrorParams {
  request_id: string;
  response: 'accepted' | 'rejected';
  message?: string;
}