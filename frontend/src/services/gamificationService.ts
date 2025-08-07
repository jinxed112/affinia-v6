import { authManager } from './authManager'

const API_BASE_URL = import.meta.env.VITE_API_URL

export interface Quest {
  id: string
  type: 'profile' | 'photo' | 'questionnaire' | 'social'
  title: string
  description: string
  xp_reward: number
  credits_reward: number
  icon: string
  required_level: number
  is_active: boolean
}

class GamificationService {
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
      throw new Error(`Gamification API Error: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  }

  async getUserQuests(): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/gamification/quests`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getUserQuests error:', error)
      throw error
    }
  }

  async completeQuest(questType: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/gamification/complete-quest`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questType })
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ completeQuest error:', error)
      throw error
    }
  }
}

export const gamificationService = new GamificationService()
