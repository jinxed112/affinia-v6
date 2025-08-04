// =============================================
// CONTEXTE NOTIFICATIONS SIMPLIFIÉ - Pas de provider
// =============================================

import React, { createContext, useContext } from 'react';

// Version simplifiée du contexte - désactivé temporairement
// pour éviter les boucles infinies

interface SimpleNotificationContext {
  stats: {
    unread_count: number;
    profile_views_count: number;
    mirror_reads_count: number;
    pending_requests_count: number;
  };
  loading: boolean;
}

const NotificationContextReact = createContext<SimpleNotificationContext>({
  stats: {
    unread_count: 0,
    profile_views_count: 0,
    mirror_reads_count: 0,
    pending_requests_count: 0
  },
  loading: false
});

// Provider simplifié - ne fait rien pour l'instant
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultValue: SimpleNotificationContext = {
    stats: {
      unread_count: 0,
      profile_views_count: 0,
      mirror_reads_count: 0,
      pending_requests_count: 0
    },
    loading: false
  };

  return (
    <NotificationContextReact.Provider value={defaultValue}>
      {children}
    </NotificationContextReact.Provider>
  );
};

// Hook simplifié - retourne des valeurs par défaut
export const useNotificationContext = () => {
  const context = useContext(NotificationContextReact);
  if (!context) {
    // Retourner des valeurs par défaut au lieu de lancer une erreur
    return {
      stats: {
        unread_count: 0,
        profile_views_count: 0,
        mirror_reads_count: 0,
        pending_requests_count: 0
      },
      loading: false
    };
  }
  return context;
};