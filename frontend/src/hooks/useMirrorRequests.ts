// ============ HOOK POUR LES DEMANDES DE MIROIR ============

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { discoveryService } from '../services/discoveryService';

export const useMirrorRequests = () => {
  const { user } = useAuth();
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReceivedRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const requests = await discoveryService.getReceivedMirrorRequests();
      setReceivedRequests(requests);
    } catch (error) {
      console.error('❌ Erreur chargement demandes reçues:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadSentRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const requests = await discoveryService.getSentMirrorRequests();
      setSentRequests(requests);
    } catch (error) {
      console.error('❌ Erreur chargement demandes envoyées:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const respondToRequest = useCallback(async (requestId: string, response: 'accepted' | 'rejected') => {
    try {
      await discoveryService.respondToMirrorRequest(requestId, response);
      
      // Recharger les demandes reçues
      await loadReceivedRequests();
      
    } catch (error) {
      console.error('❌ Erreur réponse à la demande:', error);
      throw error;
    }
  }, [loadReceivedRequests]);

  useEffect(() => {
    if (user) {
      loadReceivedRequests();
      loadSentRequests();
    }
  }, [user, loadReceivedRequests, loadSentRequests]);

  // Subscription temps réel pour les demandes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('mirror_requests_user')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mirror_requests',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          loadReceivedRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mirror_requests',
          filter: `sender_id=eq.${user.id}`
        },
        () => {
          loadSentRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadReceivedRequests, loadSentRequests]);

  return {
    receivedRequests,
    sentRequests,
    loading,
    respondToRequest,
    refreshRequests: () => {
      loadReceivedRequests();
      loadSentRequests();
    }
  };
};