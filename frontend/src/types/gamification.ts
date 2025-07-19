export interface Quest {
  id: string
  title: string
  description: string
  xp_reward: number
  credits_reward: number
  completed: boolean
  type: 'profile' | 'matching' | 'social'
  icon: string
}

export interface UserCard {
  id: string
  type: 'Dynamique' | 'Empathique' | 'Naturel' | 'Mystère'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlocked: boolean
  compatibility?: number
}

export interface UserStats {
  level: number
  xp: number
  xp_needed: number
  credits: number
  matches: number
  cards_unlocked: number
  total_cards: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlocked_at?: string
}

export const CARD_TYPES = {
  Dynamique: {
    icon: '⚡',
    color: '#f59e0b',
    description: 'Énergie et spontanéité'
  },
  Empathique: {
    icon: '✨',
    color: '#ec4899',
    description: 'Compassion et compréhension'
  },
  Naturel: {
    icon: '🌱',
    color: '#10b981',
    description: 'Authenticité et simplicité'
  },
  Mystère: {
    icon: '🔮',
    color: '#8b5cf6',
    description: 'Profondeur et mystère'
  }
} as const

export const RARITY_COLORS = {
  common: '#6b7280',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b'
} as const