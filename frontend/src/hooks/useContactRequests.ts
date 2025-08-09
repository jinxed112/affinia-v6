// frontend/src/hooks/useContactRequests.ts
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { contactService } from '../services/contactService'
import type { ContactRequest } from '../../../shared/types/contact'

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
      
      const [received, sent] = await Promise.all([
        contactService.getReceivedContactRequests(),
        contactService.getSentContactRequests()
      ])
      
      setReceivedRequests(received)
      setSentRequests(sent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('❌ useContactRequests - Erreur:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const requestContact = useCallback(async (receiverId: string, message?: string): Promise<boolean> => {
    try {
      await contactService.requestContact(receiverId, message)
      await loadRequests() // Refresh
      return true
    } catch (error) {
      console.error('❌ useContactRequests - requestContact error:', error)
      return false
    }
  }, [loadRequests])

  const respondToRequest = useCallback(async (requestId: string, response: 'accepted' | 'declined'): Promise<boolean> => {
    try {
      await contactService.respondToContactRequest(requestId, response)
      await loadRequests() // Refresh
      return true
    } catch (error) {
      console.error('❌ useContactRequests - respondToRequest error:', error)
      return false
    }
  }, [loadRequests])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  return {
    receivedRequests,
    sentRequests,
    loading,
    error,
    requestContact,
    respondToRequest,
    refreshRequests: loadRequests
  }
}