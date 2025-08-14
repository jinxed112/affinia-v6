// frontend/src/utils/globalProfileCache.ts
// 🚀 CACHE GLOBAL SINGLETON AVEC LOCKS - Empêche appels API simultanés

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

class GlobalProfileCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MOBILE_TTL = 10 * 60 * 1000; // 10 minutes sur mobile

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  private getTTL(): number {
    return this.isMobile() ? this.MOBILE_TTL : this.DEFAULT_TTL;
  }

  /**
   * ✅ MÉTHODE PRINCIPALE - Évite les appels simultanés
   * Si une requête est en cours pour la même clé, retourne la même Promise
   */
  async getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
    console.log(`🔍 GlobalCache: getOrLoad ${key}`);

    // 1. Vérifier cache d'abord
    const cached = this.get<T>(key);
    if (cached) {
      console.log(`💾 GlobalCache: ${key} depuis cache`);
      return cached;
    }

    // 2. Vérifier si une requête est déjà en cours
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`⏳ GlobalCache: ${key} requête en cours, attente...`);
      return pending.promise;
    }

    // 3. Créer nouvelle requête avec lock
    console.log(`🚀 GlobalCache: ${key} nouveau chargement`);
    
    let resolve: (value: T) => void;
    let reject: (error: any) => void;
    
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // Stocker la requête en cours
    this.pendingRequests.set(key, { promise, resolve: resolve!, reject: reject! });

    try {
      const data = await loader();
      
      // Sauver en cache
      this.set(key, data);
      
      // Résoudre pour tous les attenteurs
      resolve!(data);
      
      console.log(`✅ GlobalCache: ${key} chargé et mis en cache`);
      return data;
      
    } catch (error) {
      // Rejeter pour tous les attenteurs
      reject!(error);
      console.error(`❌ GlobalCache: ${key} erreur:`, error);
      throw error;
      
    } finally {
      // Nettoyer la requête en cours
      this.pendingRequests.delete(key);
    }
  }

  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.getTTL();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Vérifier expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    // Annuler aussi les requêtes en cours pour cette clé
    const pending = this.pendingRequests.get(key);
    if (pending) {
      pending.reject(new Error('Cache invalidated'));
      this.pendingRequests.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
    // Annuler toutes les requêtes en cours
    for (const [key, pending] of this.pendingRequests) {
      pending.reject(new Error('Cache cleared'));
    }
    this.pendingRequests.clear();
  }

  /**
   * ✅ MÉTHODES SPÉCIALISÉES POUR PROFILE
   */
  async getProfile(userId: string, loader: () => Promise<any>): Promise<any> {
    return this.getOrLoad(`profile_${userId}`, loader);
  }

  async getQuestionnaire(userId: string, loader: () => Promise<any>): Promise<any> {
    return this.getOrLoad(`questionnaire_${userId}`, loader);
  }

  invalidateProfile(userId: string): void {
    this.invalidate(`profile_${userId}`);
  }

  invalidateQuestionnaire(userId: string): void {
    this.invalidate(`questionnaire_${userId}`);
  }

  /**
   * ✅ STATS ET DEBUG
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      keys: Array.from(this.cache.keys()),
      pending: Array.from(this.pendingRequests.keys())
    };
  }

  debug() {
    console.log('🔍 GlobalProfileCache Debug:', this.getStats());
  }
}

// 🚀 SINGLETON EXPORT
export const globalProfileCache = new GlobalProfileCache();

// Export du type pour TypeScript
export type { GlobalProfileCache };