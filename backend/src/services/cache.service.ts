// SERVICE OPTIONNEL - Implémentation complète disponible mais non utilisée actuellement
import Redis from 'redis'
import { env } from '../config/environment'

export interface CacheItem {
  data: any
  expiry: number
}

class CacheService {
  private redis: Redis.RedisClientType | null = null
  private memoryCache: Map<string, CacheItem> = new Map()

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = Redis.createClient({ url: process.env.REDIS_URL })
        await this.redis.connect()
        console.log('✅ Redis cache connected')
      } else {
        console.log('ℹ️ Using memory cache (Redis not configured)')
      }
    } catch (error) {
      console.error('❌ Redis connection failed, using memory cache:', error)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const value = await this.redis.get(key)
        return value ? JSON.parse(value) : null
      } else {
        const item = this.memoryCache.get(key)
        if (item && item.expiry > Date.now()) {
          return item.data
        } else if (item) {
          this.memoryCache.delete(key)
        }
        return null
      }
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.setEx(key, ttlSeconds, JSON.stringify(value))
      } else {
        this.memoryCache.set(key, {
          data: value,
          expiry: Date.now() + (ttlSeconds * 1000)
        })
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key)
      } else {
        this.memoryCache.delete(key)
      }
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushAll()
      } else {
        this.memoryCache.clear()
      }
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }
}

export const cacheService = new CacheService()
