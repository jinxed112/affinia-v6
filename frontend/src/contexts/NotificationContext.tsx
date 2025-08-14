// =============================================
// CONTEXT NOTIFICATIONS REALTIME - VERSION PRODUCTION
// =============================================

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { discoveryService } from '../services/discoveryService';
import type { NotificationStats, Notification } from '../../../shared/types/discovery';

interface NotificationContextType {
  // État
  stats: NotificationStats;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshStats: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  
  // Meta
  hasMoreNotifications: boolean;
  isLoadingMore: boolean;
}

const defaultStats: NotificationStats = {
  unread_count: 0,
  profile_views_count: 0,
  mirror_reads_count: 0,
  pending_requests_count: 0
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // États principaux
  const [stats, setStats] = useState<NotificationStats>(defaultStats);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Cache et contrôle
  const lastStatsRefresh = useRef<number>(0);
  const lastNotificationsRefresh = useRef<number>(0);
  const currentOffset = useRef<number>(0);
  const realtimeSubscription = useRef<any>(null);
  const mountedRef = useRef(true);
  
  // Cache times
  const STATS_CACHE_TIME = 30000; // 30 secondes (réduit pour Realtime)
  const NOTIFICATIONS_CACHE_TIME = 60000; // 1 minute

  // ============ FONCTIONS REFRESH ============
  
  const refreshStats = useCallback(async (force = false) => {
    if (!user?.id || !mountedRef.current) return;
    
    const now = Date.now();
    if (!force && now - lastStatsRefresh.current < STATS_CACHE_TIME) {
      console.log('📊 Stats en cache Realtime, skip');
      return;
    }
    
    try {
      console.log('📊 Refresh stats Realtime');
      const newStats = await discoveryService.getNotificationStats();
      
      if (mountedRef.current) {
        setStats(newStats);
        lastStatsRefresh.current = now;
        setError(null);
      }
    } catch (err) {
      console.error('❌ Erreur refresh stats:', err);
      if (mountedRef.current) {
        setError('Erreur chargement stats');
      }
    }
  }, [user?.id]);

  const refreshNotifications = useCallback(async (force = false) => {
    if (!user?.id || !mountedRef.current) return;
    
    const now = Date.now();
    if (!force && now - lastNotificationsRefresh.current < NOTIFICATIONS_CACHE_TIME) {
      console.log('📋 Notifications en cache Realtime, skip');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📋 Refresh notifications Realtime');
      
      const newNotifications = await discoveryService.getGroupedNotifications(20);
      
      if (mountedRef.current) {
        setNotifications(newNotifications);
        currentOffset.current = newNotifications.length;
        setHasMoreNotifications(newNotifications.length >= 20);
        lastNotificationsRefresh.current = now;
        setError(null);
      }
    } catch (err) {
      console.error('❌ Erreur refresh notifications:', err);
      if (mountedRef.current) {
        setError('Erreur chargement notifications');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  const loadMoreNotifications = useCallback(async () => {
    if (!user?.id || !hasMoreNotifications || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      console.log('📋 Load more notifications, offset:', currentOffset.current);
      
      const moreNotifications = await discoveryService.getNotifications(10, currentOffset.current);
      
      if (mountedRef.current) {
        if (moreNotifications.length > 0) {
          setNotifications(prev => [...prev, ...moreNotifications]);
          currentOffset.current += moreNotifications.length;
          setHasMoreNotifications(moreNotifications.length >= 10);
        } else {
          setHasMoreNotifications(false);
        }
      }
    } catch (err) {
      console.error('❌ Erreur load more notifications:', err);
    } finally {
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [user?.id, hasMoreNotifications, isLoadingMore]);

  // ============ ACTIONS ============

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;
    
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read' as const }
            : n
        )
      );
      
      setStats(prev => ({
        ...prev,
        unread_count: Math.max(0, prev.unread_count - 1)
      }));
      
      await discoveryService.markNotificationAsRead(notificationId);
      
      // Refresh stats après délai pour sync serveur
      setTimeout(() => {
        refreshStats(true);
      }, 1000);
      
    } catch (err) {
      console.error('❌ Erreur mark as read:', err);
      // Revert optimistic update si erreur
      refreshNotifications(true);
      refreshStats(true);
    }
  }, [user?.id, refreshStats, refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' as const }))
      );
      
      setStats(prev => ({ ...prev, unread_count: 0 }));
      
      await discoveryService.markAllNotificationsAsRead();
      
      // Refresh pour sync serveur
      setTimeout(() => {
        refreshStats(true);
      }, 1000);
      
    } catch (err) {
      console.error('❌ Erreur mark all as read:', err);
      // Revert optimistic update si erreur
      refreshNotifications(true);
      refreshStats(true);
    }
  }, [user?.id, refreshStats, refreshNotifications]);

  // ============ REALTIME SUBSCRIPTION ============

  useEffect(() => {
    if (!user?.id) {
      // Reset état si pas d'user
      setStats(defaultStats);
      setNotifications([]);
      setError(null);
      return;
    }

    console.log('🔔 Setup Realtime notifications pour:', user.id);

    // Subscription Realtime avec filtre RLS automatique
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔔 Realtime notification reçue:', payload);
        
        // Refresh immédiat en cas de changement
        setTimeout(() => {
          if (mountedRef.current) {
            refreshStats(true);
            refreshNotifications(true);
          }
        }, 500); // Petit délai pour sync DB
      })
      .subscribe((status) => {
        console.log('🔔 Statut subscription Realtime:', status);
      });

    realtimeSubscription.current = subscription;

    // Cleanup
    return () => {
      if (realtimeSubscription.current) {
        console.log('🔔 Cleanup Realtime subscription');
        realtimeSubscription.current.unsubscribe();
        realtimeSubscription.current = null;
      }
    };
  }, [user?.id, refreshStats, refreshNotifications]);

  // ============ CHARGEMENT INITIAL ============

  useEffect(() => {
    if (user?.id) {
      console.log('🚀 Chargement initial notifications Context');
      refreshStats(true);
      refreshNotifications(true);
    }
  }, [user?.id, refreshStats, refreshNotifications]);

  // ============ CLEANUP ============

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ============ FALLBACK REFRESH ============

  useEffect(() => {
    if (!user?.id) return;
    
    // Fallback refresh toutes les 5 minutes (au cas où Realtime fail)
    const interval = setInterval(() => {
      if (mountedRef.current) {
        console.log('🔄 Fallback refresh notifications');
        refreshStats(false); // Avec cache
        // Pas de refresh notifications en fallback pour éviter surcharge
      }
    }, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [user?.id, refreshStats]);

  // ============ PROVIDER VALUE ============

  const value: NotificationContextType = {
    stats,
    notifications,
    loading,
    error,
    refreshStats,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    loadMoreNotifications,
    hasMoreNotifications,
    isLoadingMore
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};