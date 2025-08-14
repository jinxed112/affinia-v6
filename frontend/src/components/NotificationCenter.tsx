// =============================================
// NOTIFICATION CENTER COMPLET AVEC NAVIGATION ÉTENDUE
// Fichier : frontend/src/components/NotificationCenter.tsx
// Action : REMPLACER complètement le fichier existant
// =============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationContext } from '../contexts/NotificationContext';
import { 
  Bell, Eye, Heart, Lock, Check, X, User, MessageCircle,
  AlertCircle, Loader, ChevronDown, Star, Trophy, Zap
} from 'lucide-react';
import type { NotificationType } from '../../../shared/types/discovery';

interface NotificationCenterProps {
  isDarkMode: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    stats,
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    loadMoreNotifications,
    hasMoreNotifications,
    isLoadingMore,
    refreshNotifications
  } = useNotificationContext();

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNavigateToRequests = () => {
    setIsOpen(false);
    navigate('/demandes');
  };

  // ============ ICÔNES POUR CHAQUE TYPE ============
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
      case 'contact_request':
        return <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />;
      case 'contact_accepted':
        return <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />;
      case 'contact_declined_soft':
        return <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />;
      case 'chat_message':
        return <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />;
      case 'new_match':
        return <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />;
      case 'level_up':
        return <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />;
      case 'quest_completed':
        return <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />;
      case 'questionnaire_completed':
        return <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />;
      case 'system':
        return <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />;
    }
  };

  // ============ MESSAGES POUR CHAQUE TYPE ============
  const getNotificationText = (notification: any) => {
    const senderName = notification.sender_name || 'Quelqu\'un';
    const count = notification.count || 1;
    
    switch (notification.type) {
      case 'profile_view':
        return count > 1 
          ? `${senderName} et ${count - 1} autre(s) ont consulté votre profil`
          : `${senderName} a consulté votre profil`;
          
      case 'mirror_request':
        return count > 1
          ? `${count} nouvelles demandes de miroir`
          : `${senderName} souhaite consulter votre miroir`;
          
      case 'mirror_accepted':
        return `${senderName} a accepté votre demande de miroir`;
        
      case 'mirror_rejected':
        return `${senderName} a refusé votre demande de miroir`;
        
      case 'mirror_read':
        return count > 1
          ? `${senderName} et ${count - 1} autre(s) ont lu votre miroir`
          : `${senderName} a lu votre miroir`;
          
      case 'contact_request':
        return count > 1
          ? `${count} nouvelles demandes de contact`
          : `${senderName} souhaite entrer en contact avec vous`;
          
      case 'contact_accepted':
        return `${senderName} a accepté votre demande de contact`;
        
      case 'contact_declined_soft':
        return `${senderName} a refusé votre demande de contact`;
        
      case 'chat_message':
        return count > 1
          ? `${count} nouveaux messages de ${senderName}`
          : `${senderName} vous a envoyé un message`;

      case 'new_match':
        return `💖 Nouveau match avec ${senderName}`;

      case 'level_up':
        const payload = notification.original_notification?.payload || {};
        return `🎉 Vous avez atteint le niveau ${payload.level || '?'} !`;

      case 'quest_completed':
        const questPayload = notification.original_notification?.payload || {};
        return `🏆 Quête "${questPayload.quest_name || 'Inconnue'}" terminée !`;

      case 'questionnaire_completed':
        return `🧠 Votre profil psychologique a été généré`;
          
      case 'system':
        // Messages système basés sur le payload
        const systemPayload = notification.original_notification?.payload || {};
        
        if (systemPayload.event_type === 'HIGH_COMPATIBILITY') {
          return `⭐ Forte compatibilité avec ${senderName} (${systemPayload.compatibility_score}%)`;
        }
        if (systemPayload.event_type === 'PHOTO_APPROVED') {
          return `📸 Votre photo a été approuvée`;
        }
        if (systemPayload.event_type === 'PHOTO_REJECTED') {
          return `📸 Photo rejetée : ${systemPayload.reason}`;
        }
        if (systemPayload.event_type === 'WEEKLY_SUMMARY') {
          return `📊 Résumé : ${systemPayload.stats?.views || 0} vues, ${systemPayload.stats?.matches || 0} matchs`;
        }
        
        return notification.original_notification?.message || 'Notification système';
        
      default:
        return notification.original_notification?.message || 'Notification';
    }
  };

  // ============ COULEURS POUR CHAQUE TYPE ============
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'profile_view':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'mirror_request':
      case 'contact_request':
        return 'border-purple-500/30 bg-purple-500/5';
      case 'mirror_accepted':
      case 'contact_accepted':
        return 'border-green-500/30 bg-green-500/5';
      case 'mirror_rejected':
      case 'contact_declined_soft':
        return 'border-red-500/30 bg-red-500/5';
      case 'mirror_read':
      case 'new_match':
        return 'border-pink-500/30 bg-pink-500/5';
      case 'chat_message':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'level_up':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'quest_completed':
        return 'border-orange-500/30 bg-orange-500/5';
      case 'questionnaire_completed':
        return 'border-purple-500/30 bg-purple-500/5';
      case 'system':
        return 'border-gray-500/30 bg-gray-500/5';
      default:
        return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  // ============ NAVIGATION COMPLÈTE POUR TOUS LES TYPES ============
  const handleNotificationClick = (notification: any) => {
    // Marquer comme lu si non lu
    if (notification.has_unread) {
      notification.notification_ids?.forEach((id: string) => {
        markAsRead(id);
      });
    }

    // Récupérer le payload pour les redirections avancées
    const payload = notification.original_notification?.payload || {};
    
    // Navigation selon le type de notification
    switch (notification.type) {
      // ========== MIROIR ==========
      case 'mirror_request':
        setIsOpen(false);
        navigate('/demandes?tab=mirror');
        break;
        
      case 'mirror_accepted':
        if (payload.responder_id || notification.sender_id) {
          setIsOpen(false);
          navigate(`/miroir/${payload.responder_id || notification.sender_id}`);
        } else {
          navigate('/demandes?tab=mirror');
        }
        break;
        
      case 'mirror_rejected':
        setIsOpen(false);
        navigate('/decouverte');
        break;
        
      case 'mirror_read':
        setIsOpen(false);
        navigate('/miroir');
        break;

      // ========== CONTACT ==========
      case 'contact_request':
        setIsOpen(false);
        navigate('/demandes?tab=contact');
        break;
        
      case 'contact_accepted':
        if (payload.conversation_id) {
          setIsOpen(false);
          navigate(`/chat/${payload.conversation_id}`);
        } else {
          navigate('/chat');
        }
        break;
        
      case 'contact_declined_soft':
        setIsOpen(false);
        navigate('/decouverte');
        break;

      // ========== PROFIL & DÉCOUVERTE ==========
      case 'profile_view':
        if (payload.viewer_id || notification.sender_id) {
          setIsOpen(false);
          navigate(`/profil/${payload.viewer_id || notification.sender_id}`);
        } else {
          navigate('/profil');
        }
        break;

      // ========== CHAT ==========
      case 'chat_message':
        if (payload.conversation_id) {
          setIsOpen(false);
          navigate(`/chat/${payload.conversation_id}`);
        } else {
          navigate('/chat');
        }
        break;

      // ========== MATCHING ==========
      case 'new_match':
        if (payload.match_id || notification.sender_id) {
          setIsOpen(false);
          navigate(`/profil/${payload.match_id || notification.sender_id}`);
        } else {
          navigate('/decouverte');
        }
        break;

      // ========== GAMIFICATION ==========
      case 'level_up':
      case 'quest_completed':
        setIsOpen(false);
        navigate('/profil?tab=achievements');
        break;

      // ========== QUESTIONNAIRE ==========
      case 'questionnaire_completed':
        setIsOpen(false);
        navigate('/miroir');
        break;

      // ========== SYSTÈME ==========
      case 'system':
        setIsOpen(false);
        
        // Redirection selon l'événement système
        switch (payload.event_type) {
          case 'HIGH_COMPATIBILITY':
            if (payload.user_id || notification.sender_id) {
              navigate(`/profil/${payload.user_id || notification.sender_id}`);
            } else {
              navigate('/decouverte');
            }
            break;
            
          case 'PHOTO_APPROVED':
          case 'PHOTO_REJECTED':
            navigate('/profil?tab=photos');
            break;
            
          case 'WEEKLY_SUMMARY':
            navigate('/profil?tab=stats');
            break;
            
          default:
            // Utiliser redirect_url du payload si disponible
            if (payload.redirect_url) {
              navigate(payload.redirect_url);
            } else {
              navigate('/profil');
            }
            break;
        }
        break;

      // ========== DEFAULT ==========
      default:
        setIsOpen(false);
        // Utiliser redirect_url du payload si disponible
        if (payload.redirect_url) {
          navigate(payload.redirect_url);
        } else {
          navigate('/profil');
        }
        break;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  

  return (
    <div className="relative">
      {/* Bouton notifications */}
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
        
        {/* Badge temps réel */}
        {stats.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 min-w-[18px] sm:min-w-[24px] h-5 sm:h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
            {stats.unread_count > 99 ? '99+' : stats.unread_count}
          </div>
        )}
      </button>

      {/* Panneau notifications */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 mt-2 w-[calc(100vw-16px)] max-w-[320px] sm:w-80 md:w-96 max-h-[70vh] sm:max-h-[500px] overflow-hidden z-50">
          <div className={`rounded-xl border-2 shadow-2xl backdrop-blur-xl ${
            isDarkMode
              ? 'bg-gray-900/95 border-gray-700/50 shadow-black/50'
              : 'bg-white/95 border-gray-200/50 shadow-gray-900/20'
          }`}>
            
            {/* Header */}
            <div className={`p-3 sm:p-4 border-b ${
              isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-base sm:text-lg font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Notifications
                  {stats.unread_count > 0 && (
                    <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                      {stats.unread_count}
                    </span>
                  )}
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
              
              {/* Statistiques rapides */}
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

            {/* Contenu notifications */}
            <div className="max-h-60 sm:max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-purple-400" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-red-400 px-4">
                  <AlertCircle className="w-5 h-5 mb-2" />
                  <span className="text-sm text-center">{error}</span>
                  <button
                    onClick={() => refreshNotifications()}
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
                </div>
              ) : (
                <>
                  <div className="space-y-0.5 sm:space-y-1">
                    {notifications.map((notification, index) => (
                      <div
                        key={`${notification.id}-${index}`}
                        className={`p-2.5 sm:p-3 cursor-pointer transition-all duration-200 border-l-2 ${
                          notification.has_unread
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
                          
                          {/* Avatar */}
                          <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                            {notification.sender_avatar ? (
                              <img 
                                src={notification.sender_avatar} 
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

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-1.5 sm:gap-2 mb-1">
                              {getNotificationIcon(notification.type)}
                              <span className={`text-xs sm:text-sm line-clamp-2 leading-tight ${
                                notification.has_unread 
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
                                {formatDate(notification.latest_date)}
                              </span>
                              
                              <div className="flex items-center gap-1">
                                {/* Compteur si regroupé */}
                                {notification.count > 1 && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                  }`}>
                                    {notification.count}
                                  </span>
                                )}
                                
                                {/* Indicateur non lu */}
                                {notification.has_unread && (
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-pulse flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {hasMoreNotifications && (
                    <div className="p-3 border-t border-gray-200/50">
                      <button
                        onClick={loadMoreNotifications}
                        disabled={isLoadingMore}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                          isDarkMode
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isLoadingMore ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        <span className="text-sm">
                          {isLoadingMore ? 'Chargement...' : 'Voir plus'}
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
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

      {/* Overlay pour fermer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};