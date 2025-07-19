// src/types/profile.ts

export interface ProfilePhoto {
  id: string;
  user_id: string;
  photo_url: string;
  photo_order: number;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

export interface RelationshipPreferences {
  id: string;
  user_id: string;
  relationship_type: string[]; // ['casual', 'serious', 'friendship', 'hookup']
  interested_in_genders: string[]; // ['men', 'women', 'non-binary', 'all']
  min_age: number;
  max_age: number;
  search_radius_km: number;
  show_me_on_affinia: boolean;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  population?: number;
  created_at: string;
}

export interface ProfileAnalysis {
  reliability_score: number;
  authenticity_score: number;
  message_count: number;
  bias_warning: string | null;
  strength_signals: string[];
  weakness_signals: string[];
  cognitive_signals: {
    language_level: string;
    thinking_style: string;
    complexity: string;
    metacognition: boolean;
  };
  affective_indicators: {
    emotion_expression: string;
    defense_mechanisms: string[];
    attachment_style: string;
  };
  unconscious_patterns: string[];
  trait_observations: {
    intellectual_indicators: string[];
    emotional_regulation_signs: string[];
    social_behavior_patterns: string[];
    motivational_clues: string[];
    authenticity_markers: string[];
  };
  relationnal_risks: string[];
  ideal_partner_traits: string[];
  mirroring_warning: string;
}

export interface ProfileCompleteness {
  total: number;
  completed: number;
  percentage: number;
  missing_fields: string[];
}

export interface LevelProgress {
  current_xp: number;
  xp_for_next_level: number;
  progress_percentage: number;
  next_level: number;
}

// Types pour le système de découverte
export type MirrorVisibility = 'public' | 'on_request' | 'private';
export type MirrorRequestStatus = 'pending' | 'accepted' | 'rejected';
export type NotificationType = 'profile_view' | 'mirror_request' | 'mirror_accepted' | 'mirror_rejected' | 'mirror_read';
export type NotificationStatus = 'unread' | 'read';

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
  gender?: string;
  age?: number;
  max_distance?: number;
  created_at: string;
  updated_at: string;
}

// Profile pour la découverte
