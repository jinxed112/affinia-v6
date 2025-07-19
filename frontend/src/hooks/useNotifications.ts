// =============================================
// HOOK NOTIFICATIONS CORRIGÉ - Ordre des hooks stable
// =============================================

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { discoveryService } from '../services/discoveryService';
import type { 
  NotificationStats, 
  Notification, 
  NotificationContext as NotificationContextType
} from '../../../shared/types/discovery';

/**
 * Hook notifications avec ordre stable des hooks
 */
export const useNotifications = (): NotificationContextType => {
  const { user } = useAuth();
  
  // États (toujours appelés dans le même ordre)
  const [stats, setStats] = useState<NotificationStats>({
    unread_count: 0,
    profile_views_count: 0,
    mirror_reads_count: 0,
    pending_requests_count: 0
  });
  
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Refs (toujours appelées)
  const lastStatsUpdate = useRef<number>(0);
  const loadingStatsRef = useRef(false);
  const subscriptionsRef = useRef<any[]>([]);
  const processedNotificationIds = useRef(new Set<string>());

  // Fonctions stables (pas de useCallback pour éviter les problèmes d'ordre)
  const deduplicateNotifications = (notifications: Notification[]): Notification[] => {
    const seen = new Set<string>();
    return notifications.filter(notification => {
      if (seen.has(notification.id)) {
        return false;
      }
      seen.add(notification.id);
      return true;
    }).slice(0, 10);
  };

  const loadStats = async () => {
    if (!user || loadingStatsRef.current) return;
    
    const now = Date.now();
    if (now - lastStatsUpdate.current < 10000) return;
    
    try {
      loadingStatsRef.current = true;
      const newStats = await discoveryService.getNotificationStats();
      setStats(newStats);
      lastStatsUpdate.current = now;
    } catch (error) {
      console.error('❌ Erreur chargement stats notifications:', error);
    } finally {
      loadingStatsRef.current = false;
    }
  };

  const loadRecentNotifications = async () => {
    if (!user) return;
    
    try {
      const notifications = await discoveryService.getNotifications(15, 0);
      const deduplicated = deduplicateNotifications(notifications);
      setRecentNotifications(deduplicated);
      
      deduplicated.forEach(notif => {
        processedNotificationIds.current.add(notif.id);
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement notifications récentes:', error);
    }
  };

  const updateStats = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadRecentNotifications()]);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await discoveryService.markNotificationAsRead(notificationId);
      
      setRecentNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read' }
            : n
        )
      );
      
      setTimeout(() => {
        loadStats();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erreur marquer notification comme lue:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await discoveryService.markAllNotificationsAsRead();
      
      setRecentNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' as const }))
      );
      
      setStats(prev => ({ ...prev, unread_count: 0 }));
      
    } catch (error) {
      console.error('❌ Erreur marquer toutes notifications comme lues:', error);
    }
  };

  // Effect 1 : Initialisation (toujours appelé)
  useEffect(() => {
    if (user) {
      updateStats();
    }
  }, [user?.id]); // Dépendance simplifiée

  // Effect 2 : Subscriptions (toujours appelé)
  useEffect(() => {
    if (!user) {
      return;
    }

    console.log('🔄 Configuration des subscriptions pour:', user.id);

    // Nettoyer les anciennes subscriptions
    subscriptionsRef.current.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    subscriptionsRef.current = [];

    // Variables pour throttling
    let notificationThrottle: NodeJS.Timeout | null = null;
    let statsThrottle: NodeJS.Timeout | null = null;

    const handleNewNotification = (payload: any) => {
      const notification = payload.new as Notification;
      
      if (processedNotificationIds.current.has(notification.id)) {
        return;
      }
      
      console.log('🔔 Nouvelle notification reçue:', notification);
      processedNotificationIds.current.add(notification.id);
      
      if (notificationThrottle) {
        clearTimeout(notificationThrottle);
      }
      
      notificationThrottle = setTimeout(() => {
        setRecentNotifications(prev => {
          const updated = [notification, ...prev];
          return deduplicateNotifications(updated);
        });
        
        setStats(prev => ({
          ...prev,
          unread_count: prev.unread_count + 1
        }));
        
        if (Notification.permission === 'granted' && prev.length < 5) {
          new Notification('Affinia - Nouvelle notification', {
            body: getNotificationText(notification),
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
      }, 1000);
    };

    const handleStatsUpdate = () => {
      if (statsThrottle) {
        clearTimeout(statsThrottle);
      }
      
      statsThrottle = setTimeout(() => {
        loadStats();
      }, 3000);
    };

    try {
      // Subscription notifications
      const notificationsChannel = supabase
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
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            setRecentNotifications(prev => 
              prev.map(n => 
                n.id === payload.new.id 
                  ? payload.new as Notification
                  : n
              )
            );
            
            if (payload.old.status !== payload.new.status) {
              handleStatsUpdate();
            }
          }
        )
        .subscribe();

      subscriptionsRef.current.push(notificationsChannel);

      // Subscription demandes miroir
      const mirrorRequestsChannel = supabase
        .channel(`mirror_requests_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mirror_requests',
            filter: `receiver_id=eq.${user.id}`
          },
          () => {
            handleStatsUpdate();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'mirror_requests',
            filter: `receiver_id=eq.${user.id}`
          },
          () => {
            handleStatsUpdate();
          }
        )
        .subscribe();

      subscriptionsRef.current.push(mirrorRequestsChannel);

    } catch (error) {
      console.error('❌ Erreur configuration subscriptions:', error);
    }

    // Cleanup
    return () => {
      console.log('🧹 Nettoyage des subscriptions');
      
      if (notificationThrottle) {
        clearTimeout(notificationThrottle);
      }
      if (statsThrottle) {
        clearTimeout(statsThrottle);
      }
      
      subscriptionsRef.current.forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
      subscriptionsRef.current = [];
    };
  }, [user?.id]); // Dépendance simplifiée

  // Effect 3 : Permission notifications (toujours appelé)
  useEffect(() => {
    if (user && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📢 Permission notifications:', permission);
      });
    }
  }, [user?.id]); // Dépendance simplifiée

  // Effect 4 : Cleanup IDs (toujours appelé)
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (processedNotificationIds.current.size > 100) {
        const idsArray = Array.from(processedNotificationIds.current);
        processedNotificationIds.current = new Set(idsArray.slice(-50));
      }
    }, 300000);

    return () => clearInterval(cleanup);
  }, []); // Pas de dépendances

  return {
    stats,
    recent_notifications: recentNotifications,
    updateStats,
    markAsRead,
    markAllAsRead
  };
};

// Fonction utilitaire
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