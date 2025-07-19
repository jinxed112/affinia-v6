// =============================================
// SERVICE FRONTEND - Découverte et Miroir Privé - AVEC DEBUG
// =============================================

import type { 
  DiscoveryProfile, 
  DiscoveryFilters, 
  DiscoveryResponse, 
  MirrorRequest, 
  MirrorRequestResponse, 
  NotificationStats,
  Notification
} from '../../../shared/types/discovery';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class DiscoveryService {
  
  constructor() {
    console.log('🔍 DiscoveryService: API_BASE_URL =', API_BASE_URL);
  }
  
  private async getAuthHeaders(): Promise<Record<string, string>> {
    console.log('🔑 discoveryService: Récupération du token...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbcbeitvmtqwoifbkghy.supabase.co';
    const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
    
    console.log('🔍 Storage key:', storageKey);
    
    const authData = localStorage.getItem(storageKey);
    
    if (!authData) {
      console.error('❌ No auth data found');
      throw new Error('No authentication token found');
    }
    
    let parsedAuth;
    try {
      parsedAuth = JSON.parse(authData);
      console.log('✅ Auth data parsed successfully');
    } catch {
      console.error('❌ Invalid auth data');
      throw new Error('Invalid auth data');
    }
    
    const accessToken = parsedAuth?.access_token;
    
    if (!accessToken) {
      console.error('❌ No access token in auth data');
      throw new Error('No access token found');
    }
    
    console.log('✅ Access token found, length:', accessToken.length);

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
  }

  // ============ DÉCOUVERTE DE PROFILS ============

  /**
   * Récupérer les profils pour la découverte
   */
  async getDiscoveryProfiles(filters: DiscoveryFilters = {}): Promise<DiscoveryResponse> {
    try {
      console.log('🔍 discoveryService: Récupération profils avec filtres:', filters);
      
      const headers = await this.getAuthHeaders();
      
      // Construire les query parameters
      const params = new URLSearchParams();
      
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.min_age) params.append('min_age', filters.min_age.toString());
      if (filters.max_age) params.append('max_age', filters.max_age.toString());
      if (filters.max_distance_km) params.append('max_distance_km', filters.max_distance_km.toString());
      if (filters.mirror_visibility) params.append('mirror_visibility', filters.mirror_visibility.join(','));
      if (filters.has_photos) params.append('has_photos', 'true');
      if (filters.has_questionnaire) params.append('has_questionnaire', 'true');
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`${API_BASE_URL}/api/discovery?${params}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch discovery profiles: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profiles');
      }

      console.log('✅ discoveryService: Profils récupérés:', result.data.profiles.length);
      return result.data;

    } catch (error) {
      console.error('❌ discoveryService: Erreur getDiscoveryProfiles:', error);
      throw error;
    }
  }

  /**
   * Récupérer un profil spécifique
   */
  async getDiscoveryProfile(profileId: string): Promise<DiscoveryProfile> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/discovery/profile/${profileId}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      return result.data;

    } catch (error) {
      console.error('❌ discoveryService: Erreur getDiscoveryProfile:', error);
      throw error;
    }
  }

  // ============ DEMANDES DE MIROIR ============

  /**
   * Demander l'accès au miroir d'un profil
   */
  async requestMirrorAccess(receiverId: string): Promise<MirrorRequestResponse> {
    try {
      console.log('🔐 discoveryService: Demande accès miroir pour:', receiverId);
      
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/discovery/mirror-request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          receiver_id: receiverId
        })
      });

      const result = await response.json();
      
      console.log('📝 discoveryService: Réponse demande miroir:', result);
      return result;

    } catch (error) {
      console.error('❌ discoveryService: Erreur requestMirrorAccess:', error);
      throw error;
    }
  }

  /**
   * Répondre à une demande de miroir
   */
  async respondToMirrorRequest(
    requestId: string, 
    response: 'accepted' | 'rejected'
  ): Promise<MirrorRequestResponse> {
    try {
      console.log('📝 discoveryService: Réponse à la demande:', requestId, response);
      
      const headers = await this.getAuthHeaders();
      
      const apiResponse = await fetch(`${API_BASE_URL}/api/discovery/mirror-request/${requestId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          response
        })
      });

      const result = await apiResponse.json();
      
      console.log('✅ discoveryService: Réponse enregistrée:', result);
      return result;

    } catch (error) {
      console.error('❌ discoveryService: Erreur respondToMirrorRequest:', error);
      throw error;
    }
  }

  /**
   * Récupérer les demandes reçues
   */
  async getReceivedMirrorRequests(): Promise<MirrorRequest[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/discovery/mirror-requests/received`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch received requests: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch received requests');
      }

      return result.data;

    } catch (error) {
      console.error('❌ discoveryService: Erreur getReceivedMirrorRequests:', error);
      throw error;
    }
  }

  /**
   * Récupérer les demandes envoyées
   */
  async getSentMirrorRequests(): Promise<MirrorRequest[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/discovery/mirror-requests/sent`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sent requests: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sent requests');
      }

      return result.data;

    } catch (error) {
      console.error('❌ discoveryService: Erreur getSentMirrorRequests:', error);
      throw error;
    }
  }

  // ============ ACCÈS AUX MIROIRS ============

  /**
   * Vérifier si on peut voir un miroir - AVEC DEBUG
   */
  async canViewMirror(profileId: string): Promise<boolean> {
    try {
      console.log('🔍 canViewMirror: Getting headers for profileId:', profileId);
      const headers = await this.getAuthHeaders();
      console.log('🔍 canViewMirror: Headers obtained:', Object.keys(headers));
      
      const url = `${API_BASE_URL}/api/discovery/mirror/${profileId}/can-view`;
      console.log('🔍 canViewMirror: Calling URL:', url);
      
      const response = await fetch(url, {
        headers
      });
      
      console.log('🔍 canViewMirror: Response status:', response.status, 'OK:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 canViewMirror: Error response:', errorText);
        return false;
      }

      const result = await response.json();
      console.log('🔍 canViewMirror: Full result:', result);
      
      const canView = result.success && result.data.can_view;
      console.log('🔍 canViewMirror: Final result:', canView);
      
      return canView;

    } catch (error) {
      console.error('❌ discoveryService: Erreur canViewMirror:', error);
      throw error; // Laisser l'erreur remonter pour debug
    }
  }

  /**
   * Enregistrer la lecture d'un miroir
   */
  async recordMirrorRead(profileId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      await fetch(`${API_BASE_URL}/api/discovery/mirror/${profileId}/read`, {
        method: 'POST',
        headers
      });

    } catch (error) {
      console.error('❌ discoveryService: Erreur recordMirrorRead:', error);
      // Ne pas throw - ce n'est pas critique
    }
  }

  // ============ NOTIFICATIONS ============

  /**
   * Récupérer les statistiques de notifications
   */
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/discovery/notifications/stats`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notification stats: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch notification stats');
      }

      return result.data;

    } catch (error) {
      console.error('❌ discoveryService: Erreur getNotificationStats:', error);
      throw error;
    }
  }

  /**
   * Récupérer les notifications
   */
  async getNotifications(limit: number = 20, offset: number = 0): Promise<Notification[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/discovery/notifications?limit=${limit}&offset=${offset}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch notifications');
      }

      return result.data;

    } catch (error) {
      console.error('❌ discoveryService: Erreur getNotifications:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      await fetch(`${API_BASE_URL}/api/discovery/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers
      });

    } catch (error) {
      console.error('❌ discoveryService: Erreur markNotificationAsRead:', error);
      // Ne pas throw - ce n'est pas critique
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      await fetch(`${API_BASE_URL}/api/discovery/notifications/read-all`, {
        method: 'PUT',
        headers
      });

    } catch (error) {
      console.error('❌ discoveryService: Erreur markAllNotificationsAsRead:', error);
      // Ne pas throw - ce n'est pas critique
    }
  }

  // ============ UTILITAIRES ============

  /**
   * Récupérer les filtres disponibles
   */
  async getAvailableFilters(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/discovery/filters`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch filters: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch filters');
      }

      return result.data;

    } catch (error) {
      console.error('❌ discoveryService: Erreur getAvailableFilters:', error);
      throw error;
    }
  }

  /**
   * Calculer l'âge à partir d'une date de naissance
   */
  calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Formater la distance
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return 'Moins d\'1 km';
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)} km`;
    } else {
      return `${Math.round(distanceKm)} km`;
    }
  }

  /**
   * Formater le temps écoulé
   */
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }
}

export const discoveryService = new DiscoveryService();