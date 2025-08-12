import { authManager } from './authManager'
import type { 
  DiscoveryProfile, 
  DiscoveryFilters, 
  DiscoveryResponse,
  NotificationStats,
  Notification,
  MirrorRequestResponse,
  MirrorRequest
} from '../../../shared/types/discovery'

const API_BASE_URL = import.meta.env.VITE_API_URL

class DiscoveryService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authManager.getAccessToken()

    if (!token) {
      throw new Error('No access token available')
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    if (response.status === 401) {
      await authManager.clearSession()
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`Discovery API Error: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Discovery operation failed')
    }

    return result.data
  }

  // ============ MÉTHODES DISCOVERY ============

  async getDiscoveryProfiles(filters: DiscoveryFilters = {}): Promise<DiscoveryResponse> {
    try {
      const headers = await this.getAuthHeaders()

      const params = new URLSearchParams()
      if (filters.gender) params.append('gender', filters.gender)
      if (filters.min_age) params.append('min_age', filters.min_age.toString())
      if (filters.max_age) params.append('max_age', filters.max_age.toString())
      if (filters.max_distance_km) params.append('max_distance_km', filters.max_distance_km.toString())
      if (filters.mirror_visibility) params.append('mirror_visibility', filters.mirror_visibility.join(','))
      if (filters.has_photos !== undefined) params.append('has_photos', filters.has_photos.toString())
      if (filters.has_questionnaire !== undefined) params.append('has_questionnaire', filters.has_questionnaire.toString())
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`${API_BASE_URL}/api/discovery?${params}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getDiscoveryProfiles error:', error)
      throw error
    }
  }

  async getDiscoveryProfile(profileId: string): Promise<DiscoveryProfile> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/profile/${profileId}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getDiscoveryProfile error:', error)
      throw error
    }
  }

  // ============ MÉTHODES MIRROR REQUESTS ============

  async requestMirrorAccess(receiverId: string): Promise<MirrorRequestResponse> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/mirror-request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ receiver_id: receiverId })
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ requestMirrorAccess error:', error)
      throw error
    }
  }

  async respondToMirrorRequest(requestId: string, response: 'accepted' | 'rejected'): Promise<MirrorRequestResponse> {
    try {
      const headers = await this.getAuthHeaders()
      const apiResponse = await fetch(`${API_BASE_URL}/api/discovery/mirror-request/${requestId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ response })
      })
      return this.handleResponse(apiResponse)
    } catch (error) {
      console.error('❌ respondToMirrorRequest error:', error)
      throw error
    }
  }

  async getReceivedMirrorRequests(): Promise<MirrorRequest[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/mirror-requests/received`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getReceivedMirrorRequests error:', error)
      throw error
    }
  }

  async getSentMirrorRequests(): Promise<MirrorRequest[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/mirror-requests/sent`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getSentMirrorRequests error:', error)
      throw error
    }
  }

  async canViewMirror(profileId: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/mirror/${profileId}/can-view`, { headers })
      const result = await this.handleResponse(response)
      return result.can_view
    } catch (error) {
      console.error('❌ canViewMirror error:', error)
      return false
    }
  }

  async recordMirrorRead(profileId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()
      await fetch(`${API_BASE_URL}/api/discovery/mirror/${profileId}/read`, {
        method: 'POST',
        headers
      })
    } catch (error) {
      console.error('❌ recordMirrorRead error:', error)
      // Ne pas faire planter l'app pour ça
    }
  }

  // ============ MÉTHODES NOTIFICATIONS ============

  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/notifications/stats`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getNotificationStats error:', error)
      throw error
    }
  }

  async getNotifications(limit = 15, offset = 0): Promise<Notification[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/notifications?limit=${limit}&offset=${offset}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getNotifications error:', error)
      throw error
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()
      await fetch(`${API_BASE_URL}/api/discovery/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers
      })
    } catch (error) {
      console.error('❌ markNotificationAsRead error:', error)
      throw error
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()
      await fetch(`${API_BASE_URL}/api/discovery/notifications/read-all`, {
        method: 'PUT',
        headers
      })
    } catch (error) {
      console.error('❌ markAllNotificationsAsRead error:', error)
      throw error
    }
  }

  // ============ 🆕 MÉTHODE NOTIFICATIONS GROUPÉES ============

  async getGroupedNotifications(limit = 15): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/notifications/grouped?limit=${limit}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error("❌ getGroupedNotifications error:", error)
      throw error
    }
  }

  // ============ 🆕 MÉTHODE NOTIFICATIONS GROUPÉES ============

  async getGroupedNotifications(limit = 15): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/notifications/grouped?limit=${limit}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getGroupedNotifications error:', error)
      throw error
    }
  }
}

export const discoveryService = new DiscoveryService()
  // ============ 🆕 MÉTHODE NOTIFICATIONS GROUPÉES ============

  async getGroupedNotifications(limit = 15): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/notifications/grouped?limit=${limit}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getGroupedNotifications error:', error)
      throw error
    }
  }
