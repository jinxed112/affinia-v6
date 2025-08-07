// =============================================
// TYPES PARTAGÉS - shared/types/discovery.ts
// =============================================

// ============ INTERFACES PRINCIPALES ============

export interface DiscoveryProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  age: number | null;
  gender: string | null;
  bio: string | null;
  mirror_visibility: 'public' | 'on_request' | 'private';
  distance_km?: number;
  photos: ProfilePhoto[];
  questionnaire_snippet?: {
    authenticity_score?: number;
    attachment_style?: string;
    strength_signals?: string[];
  };
  interaction_status?: {
    can_request_mirror: boolean;
    mirror_request_status: 'pending' | 'accepted' | 'rejected' | null;
  };
  created_at: string;
}

export interface ProfilePhoto {
  id: string;
  photo_url: string;
  url: string;
  is_main: boolean;
  photo_order: number;
}

export interface DiscoveryFilters {
  gender?: 'male' | 'female' | 'other' | 'all';
  min_age?: number;
  max_age?: number;
  max_distance_km?: number;
  mirror_visibility?: ('public' | 'on_request' | 'private')[];
  has_photos?: boolean;
  has_questionnaire?: boolean;
  sort_by?: 'distance' | 'age' | 'newest' | 'random';
  limit?: number;
  offset?: number;
}

export interface DiscoveryResponse {
  profiles: DiscoveryProfile[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  filters_applied: DiscoveryFilters;
}

// ============ INTERFACES MIRROR REQUESTS ============

export interface MirrorRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  responded_at?: string;
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

export interface MirrorRequestResponse {
  success: boolean;
  message: string;
  request?: {
    id: string;
    sender_id?: string;
    receiver_id?: string;
    responder_id?: string;
    status?: string;
    response?: string;
    created_at?: string;
    updated_at?: string;
    conversation_id?: string | null;
  };
  can_retry_after?: string;
}

// ============ INTERFACES NOTIFICATIONS ============

export interface NotificationStats {
  unread_count: number;
  profile_views_count: number;
  mirror_reads_count: number;
  pending_requests_count: number;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  status: 'unread' | 'read';
  payload: NotificationPayload;
  created_at: string;
  read_at?: string;
}

export type NotificationType = 
  | 'profile_view'
  | 'mirror_request'
  | 'mirror_accepted'
  | 'mirror_rejected'
  | 'mirror_read'
  | 'system'
  | 'chat_message';

export interface NotificationPayload {
  // Profile view
  viewer_id?: string;
  viewer_name?: string;
  viewer_avatar?: string;
  
  // Mirror request
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  request_id?: string;
  
  // Mirror response
  responder_id?: string;
  responder_name?: string;
  responder_avatar?: string;
  response?: 'accepted' | 'rejected';
  conversation_id?: string;
  can_start_chat?: boolean;
  
  // Chat
  conversation_id?: string;
  message_preview?: string;
  
  // System
  action_url?: string;
  action_text?: string;
  
  // Metadata commune
  [key: string]: any;
}

// ============ INTERFACES PROFILE VIEWS ============

export interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_profile_id: string;
  view_type: 'profile' | 'mirror';
  viewed_at: string;
  last_viewed_at: string;
  view_count: number;
}

// ============ CONSTANTES ============

export const MIRROR_VISIBILITY = {
  PUBLIC: 'public' as const,
  ON_REQUEST: 'on_request' as const,
  PRIVATE: 'private' as const,
} as const;

export const MIRROR_REQUEST_STATUS = {
  PENDING: 'pending' as const,
  ACCEPTED: 'accepted' as const,
  REJECTED: 'rejected' as const,
} as const;

export const NOTIFICATION_STATUS = {
  UNREAD: 'unread' as const,
  READ: 'read' as const,
} as const;

export const SORT_OPTIONS = {
  DISTANCE: 'distance' as const,
  AGE: 'age' as const,
  NEWEST: 'newest' as const,
  RANDOM: 'random' as const,
} as const;

// ============ TYPES UTILITAIRES ============

export type MirrorVisibility = typeof MIRROR_VISIBILITY[keyof typeof MIRROR_VISIBILITY];
export type MirrorRequestStatus = typeof MIRROR_REQUEST_STATUS[keyof typeof MIRROR_REQUEST_STATUS];
export type NotificationStatus = typeof NOTIFICATION_STATUS[keyof typeof NOTIFICATION_STATUS];
export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

// ============ GUARDS TYPE ============

export function isValidMirrorVisibility(value: string): value is MirrorVisibility {
  return Object.values(MIRROR_VISIBILITY).includes(value as MirrorVisibility);
}

export function isValidMirrorRequestStatus(value: string): value is MirrorRequestStatus {
  return Object.values(MIRROR_REQUEST_STATUS).includes(value as MirrorRequestStatus);
}

export function isValidNotificationType(value: string): value is NotificationType {
  const validTypes: NotificationType[] = [
    'profile_view', 'mirror_request', 'mirror_accepted', 
    'mirror_rejected', 'mirror_read', 'system', 'chat_message'
  ];
  return validTypes.includes(value as NotificationType);
}

export function isValidSortOption(value: string): value is SortOption {
  return Object.values(SORT_OPTIONS).includes(value as SortOption);
}

// ============ INTERFACES POUR LES COMPOSANTS ============

export interface DiscoveryPageProps {
  isDarkMode: boolean;
}

export interface ProfileCardProps {
  profile: DiscoveryProfile;
  onRequestMirror: (profileId: string) => Promise<void>;
  onViewProfile: (profileId: string) => void;
  isDarkMode: boolean;
}

export interface MirrorRequestsPageProps {
  isDarkMode: boolean;
}

export interface NotificationCenterProps {
  isDarkMode: boolean;
}

// ============ INTERFACES POUR LES HOOKS ============

export interface UseDiscoveryReturn {
  profiles: DiscoveryProfile[];
  loading: boolean;
  error: string | null;
  filters: DiscoveryFilters;
  hasMore: boolean;
  page: number;
  
  // Actions
  loadProfiles: (filters?: DiscoveryFilters) => Promise<void>;
  loadMoreProfiles: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  updateFilters: (newFilters: Partial<DiscoveryFilters>) => void;
  requestMirrorAccess: (profileId: string) => Promise<boolean>;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  stats: NotificationStats;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadNotifications: () => Promise<void>;
  loadStats: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseMirrorRequestsReturn {
  receivedRequests: MirrorRequest[];
  sentRequests: MirrorRequest[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadRequests: () => Promise<void>;
  respondToRequest: (requestId: string, response: 'accepted' | 'rejected') => Promise<boolean>;
  refreshRequests: () => Promise<void>;
}

// ============ INTERFACES API RESPONSES ============

export interface DiscoveryApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface NotificationStatsApiResponse extends DiscoveryApiResponse<NotificationStats> {}
export interface NotificationsApiResponse extends DiscoveryApiResponse<Notification[]> {}
export interface MirrorRequestApiResponse extends DiscoveryApiResponse<MirrorRequest> {}
export interface MirrorRequestsApiResponse extends DiscoveryApiResponse<MirrorRequest[]> {}

// ============ INTERFACES POUR LES SERVICES ============

export interface DiscoveryServiceInterface {
  getDiscoveryProfiles(filters?: DiscoveryFilters): Promise<DiscoveryResponse>;
  requestMirrorAccess(receiverId: string): Promise<MirrorRequestResponse>;
  getNotificationStats(): Promise<NotificationStats>;
  getNotifications(limit?: number, offset?: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(): Promise<void>;
}

// ============ CONSTANTES POUR LES LIMITES ============

export const DEFAULT_DISCOVERY_LIMIT = 20;
export const DEFAULT_NOTIFICATIONS_LIMIT = 15;
export const MAX_DISCOVERY_DISTANCE = 100; // km
export const MIN_DISCOVERY_AGE = 18;
export const MAX_DISCOVERY_AGE = 99;
export const NOTIFICATION_CACHE_TIME = 60000; // 1 minute
export const STATS_CACHE_TIME = 60000; // 1 minute