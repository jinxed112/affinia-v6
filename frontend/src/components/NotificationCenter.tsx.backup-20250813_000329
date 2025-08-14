// =============================================
// COMPOSANT NOTIFICATIONS MOBILE OPTIMISÉ
// =============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { discoveryService } from '../services/discoveryService';
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

  // États locaux uniquement
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

  // Contrôle des appels API
  const lastStatsLoad = useRef<number>(0);
  const lastNotificationsLoad = useRef<number>(0);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  // THROTTLING TRÈS AGRESSIF
  const STATS_CACHE_TIME = 60000; // 1 minute
  const NOTIFICATIONS_CACHE_TIME = 120000; // 2 minutes

  // Fonction pour charger les stats avec cache
  const loadStats = useCallback(async (force = false) => {
    if (!user || !mountedRef.current) return;
    if (loadingRef.current && !force) return;
    
    const now = Date.now();
    if (!force && now - lastStatsLoad.current < STATS_CACHE_TIME) {
      console.log('📊 Stats en cache, skip');
      return;
    }
    
    try {
      loadingRef.current = true;
      console.log('📊 Chargement stats NotificationCenter');
      
      const newStats = await discoveryService.getNotificationStats();
      
      if (mountedRef.current) {
        setStats(newStats);
        lastStatsLoad.current = now;
      }
      
    } catch (err) {
      console.error('❌ Erreur stats NotificationCenter:', err);
      if (mountedRef.current) {
        setError('Erreur de chargement');
      }
    } finally {
      loadingRef.current = false;
    }
  }, [user?.id]);

  // Fonction pour charger les notifications avec cache
  const loadNotifications = useCallback(async (force = false) => {
    if (!user || !mountedRef.current) return;
    
    const now = Date.now();
    if (!force && now - lastNotificationsLoad.current < NOTIFICATIONS_CACHE_TIME) {
      console.log('📋 Notifications en cache, skip');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('📋 Chargement notifications NotificationCenter');
      
      const newNotifications = await discoveryService.getNotifications(15, 0);
      
      if (mountedRef.current) {
        // Déduplication simple
        const seen = new Set<string>();
        const deduplicated = newNotifications.filter(n => {
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        }).slice(0, 12);
        
        setNotifications(deduplicated);
        lastNotificationsLoad.current = now;
      }
      
    } catch (err) {
      console.error('❌ Erreur notifications NotificationCenter:', err);
      if (mountedRef.current) {
        setError('Erreur lors du chargement');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  // Mounted ref
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Chargement initial des stats SEULEMENT
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 Init NotificationCenter pour:', user.id);
      loadStats(true);
    }
  }, [user?.id]); // Seulement user.id

  // Chargement des notifications SEULEMENT quand le panneau s'ouvre
  useEffect(() => {
    if (isOpen && user && notifications.length === 0) {
      console.log('📂 Ouverture panneau, chargement notifications');
      loadNotifications(true);
    }
  }, [isOpen]); // Seulement isOpen

  // Actualisation périodique légère des stats seulement
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      if (mountedRef.current && !loadingRef.current) {
        loadStats(false); // Avec cache
      }
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [user?.id, loadStats]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read' }
            : n
        )
      );
      
      await discoveryService.markNotificationAsRead(notificationId);
      
      // Recharger les stats après délai
      setTimeout(() => {
        if (mountedRef.current) {
          loadStats(true);
        }
      }, 2000);
      
    } catch (err) {
      console.error('❌ Erreur marquer comme lu:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await discoveryService.markAllNotificationsAsRead();
      
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' as const }))
      );
      
      setStats(prev => ({ ...prev, unread_count: 0 }));
      
    } catch (err) {
      console.error('❌ Erreur marquer tout comme lu:', err);
    }
  };

  const handleNavigateToRequests = () => {
    setIsOpen(false);
    navigate('/demandes');
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'profile_view':
        return <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />;
      case 'mirror_request':
        return <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />;
      case 'mirror_accepted':
        return <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />;
      case 'mirror_rejected':
        return <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />;
      case 'mirror_read':
        return <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />;
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
        navigate('/demandes');
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

  console.log('🔍 NotificationCenter render - Unread:', stats.unread_count, 'IsOpen:', isOpen);

  return (
    <div className="relative">
      {/* Bouton notifications - Mobile optimisé */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg ${
          stats.unread_count > 0
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 text-purple-300'
            : isDarkMode
              ? 'bg-gray-800/90 border border-gray-700/50 text-gray-300 hover:bg-gray-700/90'
              : 'bg-white/90 border border-gray-200/50 text-gray-600 hover:bg-gray-50/90'
        }`}
      >
        <Bell className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
          stats.unread_count > 0 ? 'animate-pulse' : ''
        }`} />
        
        {/* Badge non lues - Mobile friendly */}
        {stats.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 min-w-[18px] sm:min-w-[24px] h-5 sm:h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
            {stats.unread_count > 99 ? '99+' : stats.unread_count}
          </div>
        )}
      </button>

      {/* Panneau notifications - MOBILE FIXED */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 mt-2 w-[calc(100vw-16px)] max-w-[320px] sm:w-80 md:w-96 max-h-[70vh] sm:max-h-[500px] overflow-hidden z-50">
          <div className={`rounded-xl border-2 shadow-2xl backdrop-blur-xl ${
            isDarkMode
              ? 'bg-gray-900/95 border-gray-700/50 shadow-black/50'
              : 'bg-white/95 border-gray-200/50 shadow-gray-900/20'
          }`}>
            
            {/* Header - Mobile optimisé */}
            <div className={`p-3 sm:p-4 border-b ${
              isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-base sm:text-lg font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Notifications
                </h3>
                
                <div className="flex items-center gap-2">
                  {stats.unread_count > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className={`text-xs px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors ${
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
              
              {/* Statistiques rapides - Mobile grid */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-3 text-xs">
                <div className="text-center p-1">
                  <div className={`font-bold text-sm sm:text-base ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stats.profile_views_count}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Vues
                  </div>
                </div>
                
                <div className="text-center p-1">
                  <div className={`font-bold text-sm sm:text-base ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stats.mirror_reads_count}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Lectures
                  </div>
                </div>
                
                <div className="text-center p-1">
                  <div className={`font-bold text-sm sm:text-base ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stats.pending_requests_count}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    En attente
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu notifications - Mobile scroll */}
            <div className="max-h-60 sm:max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-purple-400" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-red-400 px-4">
                  <AlertCircle className="w-5 h-5 mb-2" />
                  <span className="text-sm text-center">{error}</span>
                  <button
                    onClick={() => loadNotifications(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 mt-2"
                  >
                    Réessayer
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-4">
                  <Bell className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm text-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Aucune notification
                  </span>
                  <button
                    onClick={() => loadNotifications(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 mt-2"
                  >
                    Actualiser
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5 sm:space-y-1">
                  {notifications.map((notification, index) => (
                    <div
                      key={`${notification.id}-${index}`}
                      className={`p-2.5 sm:p-3 cursor-pointer transition-all duration-200 border-l-2 ${
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
                      <div className="flex items-start gap-2 sm:gap-3">
                        
                        {/* Avatar ou icône - Mobile size */}
                        <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                          {(notification.payload.sender_avatar || 
                            notification.payload.responder_avatar || 
                            notification.payload.viewer_avatar) ? (
                            <img 
                              src={
                                notification.payload.sender_avatar || 
                                notification.payload.responder_avatar || 
                                notification.payload.viewer_avatar
                              } 
                              alt=""
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                            />
                          ) : (
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Contenu - Mobile text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1.5 sm:gap-2 mb-1">
                            {getNotificationIcon(notification.type)}
                            <span className={`text-xs sm:text-sm line-clamp-2 leading-tight ${
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
                              {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </span>
                            
                            {notification.status === 'unread' && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-pulse flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Mobile button */}
            <div className={`p-3 border-t ${
              isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              <button
                onClick={handleNavigateToRequests}
                className={`w-full text-sm px-4 py-2.5 rounded-lg font-medium transition-colors ${
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

      {/* Overlay pour fermer - Mobile touch friendly */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

