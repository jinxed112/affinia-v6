// =============================================
// COMPOSANT NOTIFICATIONS - SANS DOUBLONS
// =============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { discoveryService } from '../services/discoveryService';
import { useDesignSystem } from '../styles/designSystem';
import { BaseComponents } from '../components/ui/BaseComponents';
import { 
  Bell, Eye, Heart, Lock, Check, X, Calendar, User, 
  AlertCircle, Loader, MoreHorizontal, Trash2
} from 'lucide-react';
import type { 
  NotificationStats, 
  Notification, 
  NotificationType 
} from '../../../shared/types/discovery';

interface NotificationCenterProps {
  isDarkMode: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isDarkMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const designSystem = useDesignSystem(isDarkMode);

  // États
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<NotificationStats>({
    unread_count: 0,
    profile_views_count: 0,
    mirror_reads_count: 0,
    pending_requests_count: 0
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Références pour éviter les rechargements multiples
  const loadingRef = useRef(false);
  const subscriptionRef = useRef<any>(null);

  // Fonction pour dédupliquer les notifications
  const deduplicateNotifications = useCallback((notifs: Notification[]): Notification[] => {
    const seen = new Set<string>();
    return notifs.filter(notif => {
      if (seen.has(notif.id)) {
        return false;
      }
      seen.add(notif.id);
      return true;
    }).slice(0, 15); // Limiter à 15 notifications max
  }, []);

  // Charger les stats avec throttling
  const loadNotificationStats = useCallback(async () => {
    if (loadingRef.current || !user) return;
    
    const now = Date.now();
    if (now - lastUpdate < 5000) return; // Throttle à 5 secondes

    try {
      loadingRef.current = true;
      const newStats = await discoveryService.getNotificationStats();
      setStats(newStats);
      setLastUpdate(now);
    } catch (err) {
      console.error('❌ Erreur chargement stats notifications:', err);
    } finally {
      loadingRef.current = false;
    }
  }, [user, lastUpdate]);

  // Charger les notifications avec déduplication
  const loadNotifications = useCallback(async () => {
    if (!user || loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const newNotifications = await discoveryService.getNotifications(20, 0);
      const deduplicated = deduplicateNotifications(newNotifications);
      setNotifications(deduplicated);
      
    } catch (err) {
      console.error('❌ Erreur chargement notifications:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [user, loading, deduplicateNotifications]);

  // Charger les stats au montage
  useEffect(() => {
    if (user) {
      loadNotificationStats();
      
      // Actualiser les stats toutes les 60 secondes (réduit de 30s)
      const interval = setInterval(loadNotificationStats, 60000);
      return () => clearInterval(interval);
    }
  }, [user, loadNotificationStats]);

  // Charger les notifications quand le panneau s'ouvre
  useEffect(() => {
    if (isOpen && user && notifications.length === 0) {
      loadNotifications();
    }
  }, [isOpen, user, notifications.length, loadNotifications]);

  // Subscription temps réel optimisée
  useEffect(() => {
    if (!user) return;

    // Nettoyer l'ancienne subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    console.log('🔄 Configuration subscription notifications pour:', user.id);

    // Nouvelle subscription avec throttling
    let lastNotificationTime = 0;

    subscriptionRef.current = {
      unsubscribe: () => {
        // Placeholder pour la vraie subscription
        console.log('🧹 Nettoyage subscription notifications');
      }
    };

    // TODO: Remplacer par vraie subscription Supabase
    // const channel = supabase.channel('notifications')...

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await discoveryService.markNotificationAsRead(notificationId);
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read' }
            : n
        )
      );
      
      // Actualiser les stats après un délai
      setTimeout(loadNotificationStats, 1000);
      
    } catch (err) {
      console.error('❌ Erreur marquer comme lu:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await discoveryService.markAllNotificationsAsRead();
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' as const }))
      );
      
      // Actualiser les stats
      setStats(prev => ({ ...prev, unread_count: 0 }));
      
    } catch (err) {
      console.error('❌ Erreur marquer tout comme lu:', err);
    }
  };

  const handleNavigateToMirrorRequests = () => {
    setIsOpen(false);
    navigate('/demandes-miroir');
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'profile_view':
        return <Eye className="w-4 h-4 text-blue-400" />;
      case 'mirror_request':
        return <Lock className="w-4 h-4 text-purple-400" />;
      case 'mirror_accepted':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'mirror_rejected':
        return <X className="w-4 h-4 text-red-400" />;
      case 'mirror_read':
        return <Heart className="w-4 h-4 text-pink-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const senderName = notification.payload.sender_name || 'Quelqu\'un';
    const responderName = notification.payload.responder_name || 'Quelqu\'un';
    
    switch (notification.type) {
      case 'profile_view':
        return `${senderName} a consulté votre profil`;
      case 'mirror_request':
        return `${senderName} souhaite consulter votre miroir`;
      case 'mirror_accepted':
        return `${responderName} a accepté votre demande de miroir`;
      case 'mirror_rejected':
        return `${responderName} a refusé votre demande de miroir`;
      case 'mirror_read':
        return `${senderName} a lu votre miroir`;
      default:
        return 'Notification';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'profile_view':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'mirror_request':
        return 'border-purple-500/30 bg-purple-500/5';
      case 'mirror_accepted':
        return 'border-green-500/30 bg-green-500/5';
      case 'mirror_rejected':
        return 'border-red-500/30 bg-red-500/5';
      case 'mirror_read':
        return 'border-pink-500/30 bg-pink-500/5';
      default:
        return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lu si non lu
    if (notification.status === 'unread') {
      handleMarkAsRead(notification.id);
    }

    // Navigation selon le type de notification
    switch (notification.type) {
      case 'mirror_request':
        setIsOpen(false);
        navigate('/demandes-miroir');
        break;
      case 'mirror_accepted':
        if (notification.payload.responder_id) {
          setIsOpen(false);
          navigate(`/miroir/${notification.payload.responder_id}`);
        }
        break;
      case 'profile_view':
        if (notification.payload.viewer_id) {
          setIsOpen(false);
          navigate(`/profil/${notification.payload.viewer_id}`);
        }
        break;
      case 'mirror_read':
        setIsOpen(false);
        navigate('/miroir');
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative">
      {/* Bouton notifications amélioré */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-xl transition-all duration-200 shadow-lg ${
          stats.unread_count > 0
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 text-purple-300'
            : isDarkMode
              ? 'bg-gray-800/90 border border-gray-700/50 text-gray-300 hover:bg-gray-700/90'
              : 'bg-white/90 border border-gray-200/50 text-gray-600 hover:bg-gray-50/90'
        }`}
      >
        <Bell className={`w-5 h-5 transition-transform duration-200 ${
          stats.unread_count > 0 ? 'animate-pulse' : ''
        }`} />
        
        {/* Badge non lues optimisé */}
        {stats.unread_count > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[24px] h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
            {stats.unread_count > 99 ? '99+' : stats.unread_count}
          </div>
        )}
      </button>

      {/* Panneau notifications */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 max-h-[500px] overflow-hidden z-50">
          <div className={`rounded-xl border-2 shadow-2xl backdrop-blur-xl ${
            isDarkMode
              ? 'bg-gray-900/95 border-gray-700/50 shadow-black/50'
              : 'bg-white/95 border-gray-200/50 shadow-gray-900/20'
          }`}>
            
            {/* Header */}
            <div className={`p-4 border-b ${
              isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Notifications
                </h3>
                
                <div className="flex items-center gap-2">
                  {stats.unread_count > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                        isDarkMode
                          ? 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      Tout lire
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-1 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-800 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Statistiques rapides */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="text-center">
                  <div className={`font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stats.profile_views_count}
                  </div>
                  <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Vues
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stats.mirror_reads_count}
                  </div>
                  <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Lectures
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stats.pending_requests_count}
                  </div>
                  <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    En attente
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu notifications */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-purple-400" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8 text-red-400">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bell className={`w-8 h-8 mb-2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Aucune notification
                  </span>
                  <button
                    onClick={loadNotifications}
                    className="text-xs text-purple-400 hover:text-purple-300 mt-2"
                  >
                    Actualiser
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div
                      key={`${notification.id}-${index}`}
                      className={`p-3 cursor-pointer transition-all duration-200 border-l-2 ${
                        notification.status === 'unread'
                          ? `${getNotificationColor(notification.type)} border-l-purple-500 ${
                              isDarkMode ? 'bg-gray-800/50' : 'bg-purple-50/50'
                            }`
                          : isDarkMode
                            ? 'hover:bg-gray-800/30 border-l-transparent'
                            : 'hover:bg-gray-50 border-l-transparent'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        
                        {/* Avatar ou icône */}
                        <div className="flex-shrink-0 mt-1">
                          {notification.payload.sender_avatar || notification.payload.responder_avatar || notification.payload.viewer_avatar ? (
                            <img 
                              src={
                                notification.payload.sender_avatar || 
                                notification.payload.responder_avatar || 
                                notification.payload.viewer_avatar
                              } 
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            {getNotificationIcon(notification.type)}
                            <span className={`text-sm line-clamp-2 ${
                              notification.status === 'unread' 
                                ? 'font-semibold' 
                                : 'font-normal'
                            } ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {getNotificationText(notification)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {discoveryService.formatTimeAgo && typeof discoveryService.formatTimeAgo === 'function' 
                                ? discoveryService.formatTimeAgo(notification.created_at)
                                : new Date(notification.created_at).toLocaleDateString()
                              }
                            </span>
                            
                            {notification.status === 'unread' && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-3 border-t ${
              isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              <button
                onClick={handleNavigateToMirrorRequests}
                className={`w-full text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                📋 Gérer les demandes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour fermer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};