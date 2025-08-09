// frontend/src/hooks/useContactRequests.ts - VERSION TEMPORAIRE
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
// import { contactService } from '../services/contactService'  // ⏸️ COMMENTÉ TEMPORAIREMENT
// import type { ContactRequest } from '../../../shared/types/contact'  // ⏸️ COMMENTÉ TEMPORAIREMENT

export const useContactRequests = () => {
  const { user } = useAuth()
  const [receivedRequests, setReceivedRequests] = useState<any[]>([])  // ⚠️ TYPE TEMPORAIRE
  const [sentRequests, setSentRequests] = useState<any[]>([])  // ⚠️ TYPE TEMPORAIRE
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Implémenter quand contactService sera prêt
      setReceivedRequests([])
      setSentRequests([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('❌ useContactRequests - Erreur:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const requestContact = useCallback(async (receiverId: string, message?: string): Promise<boolean> => {
    // TODO: Implémenter quand contactService sera prêt
    console.log('TODO: requestContact', receiverId, message)
    return false
  }, [])

  const respondToRequest = useCallback(async (requestId: string, response: 'accepted' | 'declined'): Promise<boolean> => {
    // TODO: Implémenter quand contactService sera prêt
    console.log('TODO: respondToRequest', requestId, response)
    return false
  }, [])

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
