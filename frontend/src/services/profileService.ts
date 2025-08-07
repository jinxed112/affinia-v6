import { authManager } from './authManager'

const API_BASE_URL = import.meta.env.VITE_API_URL

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  xp: number
  credits: number
  level: number
  created_at: string
  updated_at?: string
  bio?: string | null
  birth_date?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  max_distance?: number | null
  role?: string
  mirror_visibility?: string
  gender?: string | null
  relationship_type?: string[] | null
  interested_in_genders?: string[] | null
  min_age?: number | null
  max_age?: number | null
  show_me_on_affinia?: boolean | null
}

class ProfileService {
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
      console.warn('🚨 401 - Token invalid, clearing session')
      await authManager.clearSession()
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  async getMyProfile(): Promise<Profile> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/profiles/me`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getMyProfile error:', error)
      throw error
    }
  }

  async updateMyProfile(updates: Partial<Profile>): Promise<Profile> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ updateMyProfile error:', error)
      throw error
    }
  }

  async getLatestQuestionnaire(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/questionnaire/latest`, { headers })
      
      if (response.status === 404) {
        return null
      }

      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getLatestQuestionnaire error:', error)
      throw error
    }
  }
}

export const profileService = new ProfileService()
