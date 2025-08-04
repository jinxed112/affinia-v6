// =============================================
// HOOK NOTIFICATIONS OPTIMISÉ - Fix boucles infinies
// =============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { discoveryService } from '../services/discoveryService';
import type { 
  NotificationStats, 
  Notification, 
  NotificationContext as NotificationContextType
} from '../../../shared/types/discovery';

/**
 * Hook notifications avec throttling agressif et prévention des boucles
 */
export const useNotifications = (): NotificationContextType => {
  const { user } = useAuth();
  
  // États optimisés
  const [stats, setStats] = useState<NotificationStats>({
    unread_count: 0,
    profile_views_count: 0,
    mirror_reads_count: 0,
    pending_requests_count: 0
  });
  
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Refs pour contrôler les appels
  const lastStatsUpdate = useRef<number>(0);
  const lastNotificationsUpdate = useRef<number>(0);
  const loadingStatsRef = useRef(false);
  const loadingNotificationsRef = useRef(false);
  const subscriptionsRef = useRef<any[]>([]);
  const processedNotificationIds = useRef(new Set<string>());
  const mountedRef = useRef(true);
  
  // THROTTLING AGRESSIF - 30 secondes minimum entre les appels
  const STATS_THROTTLE_MS = 30000; // 30 secondes
  const NOTIFICATIONS_THROTTLE_MS = 60000; // 1 minute
  const MAX_NOTIFICATIONS = 10;

  // Fonction de déduplication stable
  const deduplicateNotifications = useCallback((notifications: Notification[]): Notification[] => {
    const seen = new Set<string>();
    return notifications.filter(notification => {
      if (seen.has(notification.id)) {
        return false;
      }
      seen.add(notification.id);
      return true;
    }).slice(0, MAX_NOTIFICATIONS);
  }, []);

  // Chargement des stats avec throttling agressif
  const loadStats = useCallback(async (force = false) => {
    if (!user || !mountedRef.current) return;
    if (loadingStatsRef.current && !force) return;
    
    const now = Date.now();
    if (!force && now - lastStatsUpdate.current < STATS_THROTTLE_MS) {
      console.log('🚫 Stats throttled, dernière mise à jour il y a', Math.round((now - lastStatsUpdate.current) / 1000), 's');
      return;
    }
    
    try {
      loadingStatsRef.current = true;
      console.log('📊 Chargement stats notifications...');
      
      const newStats = await discoveryService.getNotificationStats();
      
      if (mountedRef.current) {
        setStats(newStats);
        lastStatsUpdate.current = now;
        console.log('✅ Stats mises à jour:', newStats);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
    } finally {
      loadingStatsRef.current = false;
    }
  }, [user?.id]);

  // Chargement des notifications avec throttling agressif
  const loadRecentNotifications = useCallback(async (force = false) => {
    if (!user || !mountedRef.current) return;
    if (loadingNotificationsRef.current && !force) return;
    
    const now = Date.now();
    if (!force && now - lastNotificationsUpdate.current < NOTIFICATIONS_THROTTLE_MS) {
      console.log('🚫 Notifications throttled, dernière mise à jour il y a', Math.round((now - lastNotificationsUpdate.current) / 1000), 's');
      return;
    }
    
    try {
      loadingNotificationsRef.current = true;
      console.log('📋 Chargement notifications récentes...');
      
      const notifications = await discoveryService.getNotifications(15, 0);
      const deduplicated = deduplicateNotifications(notifications);
      
      if (mountedRef.current) {
        setRecentNotifications(deduplicated);
        lastNotificationsUpdate.current = now;
        
        // Marquer comme traitées
        deduplicated.forEach(notif => {
          processedNotificationIds.current.add(notif.id);
        });
        
        console.log('✅ Notifications mises à jour:', deduplicated.length);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    } finally {
      loadingNotificationsRef.current = false;
    }
  }, [user?.id, deduplicateNotifications]);

  // Mise à jour complète avec contrôle strict
  const updateStats = useCallback(async (force = false) => {
    if (!mountedRef.current || loading) return;
    
    console.log('🔄 updateStats appelé, force:', force);
    
    try {
      setLoading(true);
      await Promise.all([
        loadStats(force),
        loadRecentNotifications(force)
      ]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadStats, loadRecentNotifications, loading]);

  // Marquer comme lu - optimisé
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!mountedRef.current) return;
    
    try {
      console.log('✅ Marquer comme lu:', notificationId);
      
      // Mise à jour optimiste
      setRecentNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read' as const }
            : n
        )
      );
      
      // Appel API
      await discoveryService.markNotificationAsRead(notificationId);
      
      // Mise à jour des stats après délai (pour éviter les spam)
      setTimeout(() => {
        if (mountedRef.current) {
          loadStats(true);
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ Erreur marquer comme lu:', error);
      // Rollback en cas d'erreur
      setRecentNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'unread' as const }
            : n
        )
      );
    }
  }, [loadStats]);

  // Marquer tout comme lu - optimisé
  const markAllAsRead = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('✅ Marquer tout comme lu');
      
      // Mise à jour optimiste
      setRecentNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' as const }))
      );
      setStats(prev => ({ ...prev, unread_count: 0 }));
      
      // Appel API
      await discoveryService.markAllNotificationsAsRead();
      
    } catch (error) {
      console.error('❌ Erreur marquer tout comme lu:', error);
      // Rollback en cas d'erreur
      loadStats(true);
      loadRecentNotifications(true);
    }
  }, [loadStats, loadRecentNotifications]);

  // Effect 1 : Mounted ref
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Effect 2 : Initialisation UNIQUE - ne se déclenche qu'une fois par user
  useEffect(() => {
    if (!user?.id || !mountedRef.current) return;
    
    console.log('🚀 Initialisation notifications pour user:', user.id);
    
    // Reset des refs
    lastStatsUpdate.current = 0;
    lastNotificationsUpdate.current = 0;
    processedNotificationIds.current.clear();
    
    // Chargement initial
    updateStats(true);
    
  }, [user?.id]); // SEULEMENT user.id, pas updateStats pour éviter les boucles

  // Effect 3 : Subscriptions temps réel - DÉACTIVÉES temporairement
  useEffect(() => {
    if (!user?.id) return;

    console.log('📡 Configuration subscriptions (DÉSACTIVÉES pour debug)');
    
    // TODO: Réactiver les subscriptions une fois les boucles résolues
    /*
    const handleNewNotification = (payload: any) => {
      if (!mountedRef.current) return;
      
      const notification = payload.new as Notification;
      
      if (processedNotificationIds.current.has(notification.id)) {
        return;
      }
      
      console.log('🔔 Nouvelle notification:', notification.id);
      processedNotificationIds.current.add(notification.id);
      
      setRecentNotifications(prev => {
        const updated = [notification, ...prev];
        return deduplicateNotifications(updated);
      });
      
      setStats(prev => ({
        ...prev,
        unread_count: prev.unread_count + 1
      }));
    };

    try {
      const channel = supabase
        .channel(`notifications_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`
          },
          handleNewNotification
        )
        .subscribe();

      subscriptionsRef.current.push(channel);

    } catch (error) {
      console.error('❌ Erreur subscriptions:', error);
    }
    */

    return () => {
      console.log('🧹 Nettoyage subscriptions');
      subscriptionsRef.current.forEach(sub => {
        if (sub?.unsubscribe) {
          sub.unsubscribe();
        }
      });
      subscriptionsRef.current = [];
    };
  }, [user?.id, deduplicateNotifications]);

  // Effect 4 : Cleanup périodique des IDs
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (processedNotificationIds.current.size > 50) {
        const idsArray = Array.from(processedNotificationIds.current);
        processedNotificationIds.current = new Set(idsArray.slice(-25));
        console.log('🧹 Nettoyage des IDs traités');
      }
    }, 600000); // 10 minutes

    return () => clearInterval(cleanup);
  }, []);

  // Pas d'effet pour les permissions notifications (cause des re-renders)

  console.log('🔍 Hook notifications render - Stats:', stats.unread_count, 'Loading:', loading);

  return {
    stats,
    recent_notifications: recentNotifications,
    updateStats: useCallback(() => updateStats(false), [updateStats]),
    markAsRead,
    markAllAsRead
  };
};

// Fonction utilitaire hors hook
const getNotificationText = (notification: Notification): string => {
  const senderName = notification.payload.sender_name || 'Quelqu\'un';
  const responderName = notification.payload.responder_name || 'Quelqu\'un';
  
  switch (notification.type) {
    case 'profile_view':
      return `${senderName} a consulté votre profil`;
    case 'mirror_request':
      return `${senderName} souhaite consulter votre miroir`;
    case 'mirror_accepted':
      return `${responderName} a accepté votre demande`;
    case 'mirror_rejected':
      return `${responderName} a refusé votre demande`;
    case 'mirror_read':
      return `${senderName} a lu votre miroir`;
    default:
      return 'Nouvelle notification';
  }
};