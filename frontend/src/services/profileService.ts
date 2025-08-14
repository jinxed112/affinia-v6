import { authManager } from './authManager'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

export interface QuestionnaireResponse {
  id: string
  user_id: string
  answers: any
  completed_at?: string | null
  profile_json?: any | null
  generated_profile?: string | null
  created_at: string
  updated_at?: string
}

class ProfileService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authManager.getAccessToken()
    
    if (!token) {
      console.error('❌ ProfileService: No access token available')
      throw new Error('No access token available')
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    console.log(`📡 ProfileService: Response ${response.status} for ${response.url}`)
    
    if (response.status === 401) {
      console.warn('🚨 ProfileService: 401 - Token invalid, clearing session')
      await authManager.clearSession()
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ ProfileService: API Error ${response.status}:`, errorText)
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  async getMyProfile(): Promise<Profile> {
    try {
      console.log('🔍 ProfileService: Getting my profile...')
      const headers = await this.getAuthHeaders()
      
      const url = `${API_BASE_URL}/api/profile/me`
      console.log(`📡 ProfileService: Calling ${url}`)
      
      const response = await fetch(url, { headers })
      const result = await this.handleResponse(response)
      
      console.log('✅ ProfileService: Profile loaded successfully')
      return result
    } catch (error) {
      console.error('❌ ProfileService: getMyProfile error:', error)
      throw error
    }
  }

  async updateMyProfile(updates: Partial<Profile>): Promise<Profile> {
    try {
      console.log('🔄 ProfileService: Updating profile...', updates)
      const headers = await this.getAuthHeaders()
      
      const url = `${API_BASE_URL}/api/profile/me`
      console.log(`📡 ProfileService: PUT ${url}`)
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      })
      
      const result = await this.handleResponse(response)
      console.log('✅ ProfileService: Profile updated successfully')
      return result
    } catch (error) {
      console.error('❌ ProfileService: updateMyProfile error:', error)
      throw error
    }
  }

  // 🔥 MÉTHODE REMISE - CRITIQUE POUR QUESTIONNAIRE
  async getLatestQuestionnaire(): Promise<QuestionnaireResponse> {
    try {
      console.log('🧠 ProfileService: Getting latest questionnaire...')
      const headers = await this.getAuthHeaders()
      
      const url = `${API_BASE_URL}/api/questionnaire/latest`
      console.log(`📡 ProfileService: Calling ${url}`)
      
      const response = await fetch(url, { headers })
      
      if (response.status === 404) {
        console.log('ℹ️ ProfileService: No questionnaire found (normal for new users)')
        return null
      }

      const result = await this.handleResponse(response)
      console.log('✅ ProfileService: Questionnaire loaded successfully')
      return result
    } catch (error) {
      console.error('❌ ProfileService: getLatestQuestionnaire error:', error)
      throw error
    }
  }

  async uploadPhoto(file: File): Promise<{ photo_url: string }> {
    try {
      console.log('📸 ProfileService: Uploading photo...')
      const token = await authManager.getAccessToken()
      
      if (!token) {
        throw new Error('No access token available')
      }

      const formData = new FormData()
      formData.append('photo', file)

      const url = `${API_BASE_URL}/api/profile/photo`
      console.log(`📡 ProfileService: POST ${url}`)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      const result = await this.handleResponse(response)
      console.log('✅ ProfileService: Photo uploaded successfully')
      return result
    } catch (error) {
      console.error('❌ ProfileService: uploadPhoto error:', error)
      throw error
    }
  }

  async deletePhoto(): Promise<void> {
    try {
      console.log('🗑️ ProfileService: Deleting photo...')
      const headers = await this.getAuthHeaders()
      
      const url = `${API_BASE_URL}/api/profile/photo`
      console.log(`📡 ProfileService: DELETE ${url}`)
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      })
      
      await this.handleResponse(response)
      console.log('✅ ProfileService: Photo deleted successfully')
    } catch (error) {
      console.error('❌ ProfileService: deletePhoto error:', error)
      throw error
    }
  }
}

export const profileService = new ProfileService()