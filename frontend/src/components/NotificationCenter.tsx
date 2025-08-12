// =============================================
// COMPOSANT NOTIFICATIONS GROUPÉES OPTIMISÉ - FIX 66 NOTIFICATIONS
// =============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { discoveryService } from '../services/discoveryService';
import {
  Bell, Eye, Heart, Lock, Check, X, User, Users,
  AlertCircle, Loader, Trash2
} from 'lucide-react';
import type {
  NotificationStats,
  NotificationType
} from '../../../shared/types/discovery';

interface GroupedNotification {
  id: string;
  type: NotificationType;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  count: number;
  latest_date: string;
  has_unread: boolean;
  notification_ids: string[];
  original_notification: any;
}

interface NotificationCenterProps {
  isDarkMode: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isDarkMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // États locaux
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<NotificationStats>({
    unread_count: 0,
    profile_views_count: 0,
    mirror_reads_count: 0,
    pending_requests_count: 0
  });
  const [notifications, setNotifications] = useState<GroupedNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache control
  const lastLoad = useRef<number>(0);
  const mountedRef = useRef(true);
  const CACHE_TIME = 60000; // 1 minute

  // 🆕 FONCTION : Charger notifications groupées
  const loadGroupedNotifications = useCallback(async (force = false) => {
    if (!user || !mountedRef.current) return;

    const now = Date.now();
    if (!force && now - lastLoad.current < CACHE_TIME) {
      console.log('📋 Cache valide, skip');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('📋 Chargement notifications groupées optimisées');

      // 🚀 NOUVEAU : API groupée qui déduplique côté backend
      const groupedData = await discoveryService.getGroupedNotifications(12);

      if (mountedRef.current) {
        setNotifications(groupedData);
        lastLoad.current = now;
      }

    } catch (err) {
      console.error('❌ Erreur notifications groupées:', err);
      if (mountedRef.current) {
        setError('Erreur lors du chargement');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  // Charger stats
  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const newStats = await discoveryService.getNotificationStats();
      if (mountedRef.current) {
        setStats(newStats);
      }
    } catch (err) {
      console.error('❌ Erreur stats:', err);
    }
  }, [user?.id]);

  // Mounted ref
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Init stats
  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id, loadStats]);

  // Charger notifications quand panneau ouvert
  useEffect(() => {
    if (isOpen && user) {
      loadGroupedNotifications(true);
    }
  }, [isOpen, user, loadGroupedNotifications]);

  // 🆕 FONCTION : Texte notification groupée
  const getGroupedNotificationText = (group: GroupedNotification) => {
    const name = group.sender_name || 'Quelqu\'un';
    
    switch (group.type) {
      case 'mirror_read':
        return group.count > 1 
          ? `${name} et ${group.count - 1} autre${group.count > 2 ? 's' : ''} ont lu votre miroir`
          : `${name} a lu votre miroir`;
      case 'profile_view':
        return group.count > 1
          ? `${name} et ${group.count - 1} autre${group.count > 2 ? 's' : ''} ont vu votre profil`
          : `${name} a vu votre profil`;
      case 'mirror_request':
        return group.count > 1
          ? `${group.count} demandes de miroir en attente`
          : `${name} demande l'accès à votre miroir`;
      case 'mirror_accepted':
        return `${name} a accepté votre demande`;
      case 'mirror_rejected':
        return `${name} a refusé votre demande`;
      default:
        return 'Notification';
    }
  };

  // 🆕 FONCTION : Marquer groupe comme lu
  const handleMarkGroupAsRead = async (group: GroupedNotification) => {
    try {
      // Marquer toutes les notifications du groupe comme lues
      for (const notifId of group.notification_ids) {
        await discoveryService.markNotificationAsRead(notifId);
      }

      // Update optimistic
      setNotifications(prev =>
        prev.map(n =>
          n.id === group.id ? { ...n, has_unread: false } : n
        )
      );

      // Recharger stats
      setTimeout(() => loadStats(), 1000);

    } catch (err) {
      console.error('❌ Erreur marquer groupe lu:', err);
    }
  };

  // Marquer tout comme lu
  const handleMarkAllAsRead = async () => {
    try {
      await discoveryService.markAllNotificationsAsRead();
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, has_unread: false }))
      );
      setStats(prev => ({ ...prev, unread_count: 0 }));

    } catch (err) {
      console.error('❌ Erreur marquer tout lu:', err);
    }
  };

  // Navigation sur clic notification
  const handleNotificationClick = (group: GroupedNotification) => {
    handleMarkGroupAsRead(group);

    switch (group.type) {
      case 'mirror_request':
        setIsOpen(false);
        navigate('/demandes');
        break;
      case 'mirror_accepted':
        if (group.sender_id) {
          setIsOpen(false);
          navigate(`/miroir/${group.sender_id}`);
        }
        break;
      case 'profile_view':
      case 'mirror_read':
        setIsOpen(false);
        navigate('/decouverte');
        break;
      default:
        break;
    }
  };

  // Icônes
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

  return (
    <div className="relative">
      {/* Bouton notifications */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 sm:p-3 rounded-xl transition-all duration-200 shadow-lg ${
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

        {stats.unread_count > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[24px] h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
            {stats.unread_count > 99 ? '99+' : stats.unread_count}
          </div>
        )}
      </button>

      {/* Panneau notifications groupées */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 mt-2 w-[calc(100vw-16px)] max-w-[340px] sm:w-80 md:w-96 max-h-[70vh] overflow-hidden z-50">
          <div className={`rounded-xl border-2 shadow-2xl backdrop-blur-xl ${
            isDarkMode
              ? 'bg-gray-900/95 border-gray-700/50'
              : 'bg-white/95 border-gray-200/50'
          }`}>

            {/* Header */}
            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Notifications 🎯
                </h3>

                <div className="flex items-center gap-2">
                  {stats.unread_count > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs px-3 py-1 rounded-lg font-medium bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-colors"
                    >
                      Tout lire
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats rapides */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="text-center p-1">
                  <div className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.profile_views_count}
                  </div>
                  <div className="text-gray-400">Vues</div>
                </div>
                <div className="text-center p-1">
                  <div className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.mirror_reads_count}
                  </div>
                  <div className="text-gray-400">Lectures</div>
                </div>
                <div className="text-center p-1">
                  <div className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.pending_requests_count}
                  </div>
                  <div className="text-gray-400">Demandes</div>
                </div>
              </div>
            </div>

            {/* Liste notifications groupées */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-purple-400" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 text-red-400 px-4">
                  <AlertCircle className="w-6 h-6 mb-2" />
                  <span className="text-sm text-center">{error}</span>
                  <button
                    onClick={() => loadGroupedNotifications(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 mt-2"
                  >
                    Réessayer
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Bell className="w-8 h-8 mb-2 text-gray-500" />
                  <span className="text-sm text-center text-gray-400">Aucune notification</span>
                  <button
                    onClick={() => loadGroupedNotifications(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 mt-2"
                  >
                    Actualiser
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((group, index) => (
                    <div
                      key={`${group.id}-${index}`}
                      className={`p-3 cursor-pointer transition-all duration-200 border-l-2 ${
                        group.has_unread
                          ? 'border-l-purple-500 bg-gray-800/50'
                          : 'border-l-transparent hover:bg-gray-800/30'
                      }`}
                      onClick={() => handleNotificationClick(group)}
                    >
                      <div className="flex items-start gap-3">

                        {/* Avatar avec badge count */}
                        <div className="flex-shrink-0 relative">
                          {group.sender_avatar ? (
                            <img
                              src={group.sender_avatar}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          
                          {/* Badge count */}
                          {group.count > 1 && (
                            <div className="absolute -top-1 -right-1 min-w-[18px] h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                              {group.count > 9 ? '9+' : group.count}
                            </div>
                          )}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            {getNotificationIcon(group.type)}
                            <span className={`text-sm line-clamp-2 leading-tight ${
                              group.has_unread ? 'font-semibold' : 'font-normal'
                            } text-white`}>
                              {getGroupedNotificationText(group)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {new Date(group.latest_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </span>

                            <div className="flex items-center gap-2">
                              {group.count > 1 && (
                                <Users className="w-3 h-3 text-gray-400" />
                              )}
                              {group.has_unread && (
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <button
                onClick={() => { setIsOpen(false); navigate('/demandes'); }}
                className="w-full text-sm px-4 py-2.5 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                📋 Gérer les demandes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};




export { NotificationCenter };
