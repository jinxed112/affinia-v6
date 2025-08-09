// frontend/src/hooks/useRequests.ts - Hook unifié pour Mirror + Contact
import { useMirrorRequests } from './useMirrorRequests'
import { useContactRequests } from './useContactRequests'

export const useRequests = () => {
  const mirror = useMirrorRequests()
  const contact = useContactRequests()

  return {
    // Mirror requests
    mirrorReceived: mirror.receivedRequests,
    mirrorSent: mirror.sentRequests,
    mirrorLoading: mirror.loading,
    respondToMirrorRequest: mirror.respondToRequest,
    refreshMirrorRequests: mirror.refreshRequests,

    // Contact requests  
    contactReceived: contact.receivedRequests,
    contactSent: contact.sentRequests,
    contactLoading: contact.loading,
    contactError: contact.error,
    requestContact: contact.requestContact,
    respondToContactRequest: contact.respondToRequest,
    refreshContactRequests: contact.refreshRequests,

    // Unified
    isLoading: mirror.loading || contact.loading,
    refreshAll: () => {
      mirror.refreshRequests()
      contact.refreshRequests()
    }
  }
}