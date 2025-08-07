import { authManager } from './authManager'

const API_BASE_URL = import.meta.env.VITE_API_URL

class AdminService {
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
      throw new Error(`Admin API Error: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  }

  async getDashboard(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getDashboard error:', error)
      throw error
    }
  }

  async checkAdminStatus(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers })
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export const adminService = new AdminService()
