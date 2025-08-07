import { authManager } from './authManager'
import type { 
  Conversation, 
  Message, 
  SendMessageParams, 
  ChatStats,
  CreateConversationParams,
  UpdateMessageParams,
  ReactToMessageParams
} from '../../../shared/types/chat'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ChatService {
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
      throw new Error(`Chat API Error: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Chat operation failed')
    }

    return result.data
  }

  // ============ MÉTHODES CONVERSATIONS ============

  async getConversations(limit = 20, offset = 0): Promise<Conversation[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations?limit=${limit}&offset=${offset}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getConversations error:', error)
      throw error
    }
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getConversation error:', error)
      throw error
    }
  }

  async createConversation(participantId: string): Promise<Conversation> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ participant_id: participantId })
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ createConversation error:', error)
      throw error
    }
  }

  // ============ MÉTHODES MESSAGES ============

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getMessages error:', error)
      throw error
    }
  }

  async sendMessage(conversationId: string, params: SendMessageParams): Promise<Message> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params)
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ sendMessage error:', error)
      throw error
    }
  }

  async updateMessage(messageId: string, params: UpdateMessageParams): Promise<Message> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/messages/${messageId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(params)
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ updateMessage error:', error)
      throw error
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers
      })
      await this.handleResponse(response)
      return true
    } catch (error) {
      console.error('❌ deleteMessage error:', error)
      throw error
    }
  }

  async reactToMessage(messageId: string, emoji: string, action: 'add' | 'remove' = 'add'): Promise<Message> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ emoji, action })
      })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ reactToMessage error:', error)
      throw error
    }
  }

  // ============ MÉTHODES LECTURES ============

  async markAsRead(conversationId: string, lastMessageId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders()
      await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ last_message_id: lastMessageId })
      })
    } catch (error) {
      console.error('❌ markAsRead error:', error)
      // Ne pas faire planter l'app pour ça
    }
  }

  async getUnreadCount(conversationId: string): Promise<number> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/unread-count`, { headers })
      const result = await this.handleResponse(response)
      return result.unread_count || 0
    } catch (error) {
      console.error('❌ getUnreadCount error:', error)
      return 0
    }
  }

  // ============ MÉTHODES STATS ============

  async getChatStats(): Promise<ChatStats> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/chat/stats`, { headers })
      return this.handleResponse(response)
    } catch (error) {
      console.error('❌ getChatStats error:', error)
      throw error
    }
  }

  // ============ MÉTHODES UTILITAIRES ============

  isMessageExpired(message: Message): boolean {
    if (!message.expires_at) return false
    return new Date(message.expires_at) < new Date()
  }

  formatMessageTime(message: Message): string {
    const date = new Date(message.created_at)
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  formatMessageDate(message: Message): string {
    const date = new Date(message.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      })
    }
  }

  getLastMessagePreview(message: Message): string {
    if (message.message_type === 'image') {
      return '📷 Image'
    } else if (message.message_type === 'voice') {
      return '🎤 Message vocal'
    } else if (message.message_type === 'system') {
      return '⚙️ Message système'
    } else {
      return message.content || 'Message'
    }
  }

  // ============ MÉTHODES DE VALIDATION ============

  validateMessageContent(content: string): boolean {
    return content.trim().length > 0 && content.length <= 4000
  }

  validateMediaFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Le fichier est trop volumineux (max 10MB)' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Type de fichier non supporté' }
    }

    return { valid: true }
  }

  validateVoiceFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg']
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Le fichier audio est trop volumineux (max 5MB)' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Type de fichier audio non supporté' }
    }

    return { valid: true }
  }

  // ============ MÉTHODES DE FILTRAGE ============

  filterActiveConversations(conversations: Conversation[]): Conversation[] {
    return conversations.filter(conv => conv.status === 'active')
  }

  sortConversationsByLastMessage(conversations: Conversation[]): Conversation[] {
    return [...conversations].sort((a, b) => {
      const dateA = new Date(a.last_message_at || a.created_at).getTime()
      const dateB = new Date(b.last_message_at || b.created_at).getTime()
      return dateB - dateA
    })
  }

  filterMessagesByType(messages: Message[], types: string[]): Message[] {
    return messages.filter(message => types.includes(message.message_type))
  }

  filterNonExpiredMessages(messages: Message[]): Message[] {
    return messages.filter(message => !this.isMessageExpired(message))
  }

  // ============ MÉTHODES DE RECHERCHE ============

  searchMessages(messages: Message[], query: string): Message[] {
    const searchTerm = query.toLowerCase().trim()
    if (!searchTerm) return messages

    return messages.filter(message => {
      if (message.message_type !== 'text' || !message.content) return false
      return message.content.toLowerCase().includes(searchTerm)
    })
  }

  searchConversations(conversations: Conversation[], query: string): Conversation[] {
    const searchTerm = query.toLowerCase().trim()
    if (!searchTerm) return conversations

    return conversations.filter(conversation => {
      const participantName = conversation.other_participant?.name?.toLowerCase()
      const lastMessageContent = conversation.last_message?.content?.toLowerCase()
      
      return (
        participantName?.includes(searchTerm) ||
        lastMessageContent?.includes(searchTerm)
      )
    })
  }

  // ============ MÉTHODES DE CACHE ============

  private messageCache = new Map<string, Message[]>()
  private conversationCache = new Map<string, Conversation>()

  getCachedMessages(conversationId: string): Message[] | null {
    return this.messageCache.get(conversationId) || null
  }

  setCachedMessages(conversationId: string, messages: Message[]): void {
    this.messageCache.set(conversationId, messages)
  }

  clearMessageCache(conversationId?: string): void {
    if (conversationId) {
      this.messageCache.delete(conversationId)
    } else {
      this.messageCache.clear()
    }
  }

  getCachedConversation(conversationId: string): Conversation | null {
    return this.conversationCache.get(conversationId) || null
  }

  setCachedConversation(conversation: Conversation): void {
    this.conversationCache.set(conversation.id, conversation)
  }

  clearConversationCache(): void {
    this.conversationCache.clear()
  }

  // ============ MÉTHODES DE NETTOYAGE ============

  cleanup(): void {
    this.clearMessageCache()
    this.clearConversationCache()
  }
}

export const chatService = new ChatService()