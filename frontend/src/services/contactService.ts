// frontend/src/services/contactService.ts
import { authManager } from './authManager'
import type { ContactRequest, ContactRequestResponse } from '../../../shared/types/contact'

const API_BASE_URL = import.meta.env.VITE_API_URL

class ContactService {
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
      const errorText = await response.text()
      let errorMessage = `Contact API Error: ${response.status}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error || errorMessage
      } catch {
        // Keep default error message if parsing fails
      }
      
      throw new Error(errorMessage)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Contact operation failed')
    }

    return result
  }

  /**
   * Demander un contact
   */
  async requestContact(receiverId: string, message?: string): Promise<ContactRequestResponse> {
    try {
      console.log('💬 contactService.requestContact - receiverId:', receiverId, 'message:', message)
      
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/contact-request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          receiver_id: receiverId,
          message: message 
        })
      })
      
      const result = await this.handleResponse(response)
      
      console.log('✅ contactService.requestContact - Success:', result)
      return {
        success: true,
        message: result.message,
        request: result.data
      }
    } catch (error) {
      console.error('❌ contactService.requestContact error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to request contact'
      }
    }
  }

  /**
   * Répondre à une demande de contact
   */
  async respondToContactRequest(requestId: string, response: 'accepted' | 'declined'): Promise<ContactRequestResponse> {
    try {
      console.log('📝 contactService.respondToContactRequest - requestId:', requestId, 'response:', response)
      
      const headers = await this.getAuthHeaders()
      const apiResponse = await fetch(`${API_BASE_URL}/api/discovery/contact-request/${requestId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ response })
      })
      
      const result = await this.handleResponse(apiResponse)
      
      console.log('✅ contactService.respondToContactRequest - Success:', result)
      return {
        success: true,
        message: result.message,
        request: result.data
      }
    } catch (error) {
      console.error('❌ contactService.respondToContactRequest error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to respond to contact request'
      }
    }
  }

  /**
   * Récupérer demandes de contact reçues
   */
  async getReceivedContactRequests(): Promise<ContactRequest[]> {
    try {
      console.log('📥 contactService.getReceivedContactRequests')
      
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/contact-requests/received`, { 
        method: 'GET',
        headers 
      })
      
      const result = await this.handleResponse(response)
      
      console.log('✅ contactService.getReceivedContactRequests - Count:', result.data?.length || 0)
      return result.data || []
    } catch (error) {
      console.error('❌ contactService.getReceivedContactRequests error:', error)
      throw error
    }
  }

  /**
   * Récupérer demandes de contact envoyées
   */
  async getSentContactRequests(): Promise<ContactRequest[]> {
    try {
      console.log('📤 contactService.getSentContactRequests')
      
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/contact-requests/sent`, { 
        method: 'GET',
        headers 
      })
      
      const result = await this.handleResponse(response)
      
      console.log('✅ contactService.getSentContactRequests - Count:', result.data?.length || 0)
      return result.data || []
    } catch (error) {
      console.error('❌ contactService.getSentContactRequests error:', error)
      throw error
    }
  }

  /**
   * Vérifier si on peut demander un contact
   */
  async canRequestContact(targetId: string): Promise<boolean> {
    try {
      console.log('🤔 contactService.canRequestContact - targetId:', targetId)
      
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/discovery/contact-requests/can-request/${targetId}`, { 
        method: 'GET',
        headers 
      })
      
      const result = await this.handleResponse(response)
      
      console.log('✅ contactService.canRequestContact - Result:', result.data?.can_request)
      return result.data?.can_request || false
    } catch (error) {
      console.error('❌ contactService.canRequestContact error:', error)
      return false
    }
  }

  /**
   * Récupérer le statut d'une demande de contact existante
   */
  async getContactRequestStatus(targetId: string): Promise<{
    exists: boolean;
    status?: 'pending' | 'accepted' | 'declined';
    canRetryAfter?: string;
  }> {
    try {
      // Cette fonction vérifie le statut sans faire de demande
      // Utile pour l'UI
      const canRequest = await this.canRequestContact(targetId)
      
      return {
        exists: !canRequest,
        status: canRequest ? undefined : 'pending' // Simplifié pour le moment
      }
    } catch (error) {
      console.error('❌ contactService.getContactRequestStatus error:', error)
      return { exists: false }
    }
  }
}

export const contactService = new ContactService()