// =============================================
// CONTEXTE NOTIFICATIONS REACT
// =============================================

import React, { createContext, useContext } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationContext as NotificationContextType } from '../../../shared/types/discovery';

const NotificationContextReact = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notificationContext = useNotifications();

  return (
    <NotificationContextReact.Provider value={notificationContext}>
      {children}
    </NotificationContextReact.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContextReact);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};