// frontend/src/hooks/useContactRequests.ts - VERSION FINALE
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { contactService } from '../services/contactService'
import type { ContactRequest, ContactRequestResponse } from '../../../shared/types/contact'

export const useContactRequests = () => {
  const { user } = useAuth()
  const [receivedRequests, setReceivedRequests] = useState<ContactRequest[]>([])
  const [sentRequests, setSentRequests] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 useContactRequests.loadRequests - Loading...')
      
      const [received, sent] = await Promise.all([
        contactService.getReceivedContactRequests(),
        contactService.getSentContactRequests()
      ])
      
      setReceivedRequests(received)
      setSentRequests(sent)
      
      console.log('✅ useContactRequests.loadRequests - Success:', {
        received: received.length,
        sent: sent.length
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('❌ useContactRequests.loadRequests - Error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const requestContact = useCallback(async (receiverId: string, message?: string): Promise<boolean> => {
    try {
      console.log('💬 useContactRequests.requestContact - receiverId:', receiverId)
      
      const result = await contactService.requestContact(receiverId, message)
      
      if (result.success) {
        console.log('✅ useContactRequests.requestContact - Success')
        await loadRequests() // Refresh
        return true
      } else {
        console.error('❌ useContactRequests.requestContact - Failed:', result.message)
        setError(result.message)
        return false
      }
    } catch (error) {
      console.error('❌ useContactRequests.requestContact - Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to request contact')
      return false
    }
  }, [loadRequests])

  const respondToRequest = useCallback(async (requestId: string, response: 'accepted' | 'declined'): Promise<boolean> => {
    try {
      console.log('📝 useContactRequests.respondToRequest - requestId:', requestId, 'response:', response)
      
      const result = await contactService.respondToContactRequest(requestId, response)
      
      if (result.success) {
        console.log('✅ useContactRequests.respondToRequest - Success')
        await loadRequests() // Refresh
        return true
      } else {
        console.error('❌ useContactRequests.respondToRequest - Failed:', result.message)
        setError(result.message)
        return false
      }
    } catch (error) {
      console.error('❌ useContactRequests.respondToRequest - Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to respond to contact request')
      return false
    }
  }, [loadRequests])

  const canRequestContact = useCallback(async (targetId: string): Promise<boolean> => {
    try {
      return await contactService.canRequestContact(targetId)
    } catch (error) {
      console.error('❌ useContactRequests.canRequestContact - Error:', error)
      return false
    }
  }, [])

  const getContactRequestStatus = useCallback(async (targetId: string) => {
    try {
      return await contactService.getContactRequestStatus(targetId)
    } catch (error) {
      console.error('❌ useContactRequests.getContactRequestStatus - Error:', error)
      return { exists: false }
    }
  }, [])

  const refreshRequests = useCallback(() => {
    console.log('🔄 useContactRequests.refreshRequests - Manual refresh')
    loadRequests()
  }, [loadRequests])

  // Load initial data
  useEffect(() => {
    if (user) {
      console.log('🚀 useContactRequests - Initial load for user:', user.id)
      loadRequests()
    }
  }, [user, loadRequests])

  // Clear data when user logs out
  useEffect(() => {
    if (!user) {
      setReceivedRequests([])
      setSentRequests([])
      setError(null)
    }
  }, [user])

  return {
    // Data
    receivedRequests,
    sentRequests,
    loading,
    error,
    
    // Actions
    requestContact,
    respondToRequest,
    canRequestContact,
    getContactRequestStatus,
    refreshRequests,
    
    // Utils
    clearError: () => setError(null),
    
    // Stats
    totalReceived: receivedRequests.length,
    totalSent: sentRequests.length,
    pendingReceived: receivedRequests.filter(r => r.status === 'pending').length,
    pendingSent: sentRequests.filter(r => r.status === 'pending').length,
    acceptedReceived: receivedRequests.filter(r => r.status === 'accepted').length,
    acceptedSent: sentRequests.filter(r => r.status === 'accepted').length
  }
}