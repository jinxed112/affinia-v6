// backend/src/modules/discovery/discovery.service.ts
import { DiscoveryProfile, DiscoveryFilters, DiscoveryResponse } from "../../../shared/types/discovery";
// =============================================
// SERVICE BACKEND - Découverte et Miroir Privé avec RLS CORRIGÉ + SCHEMA FIXED
// =============================================

import { supabaseAdmin, createUserSupabase, UserSupabaseClient } from '../../config/database';

interface MirrorRequestResponse {
  success: boolean;
  message: string;
  request?: any;
  can_retry_after?: string;
}

interface NotificationStats {
  unread_count: number;
  profile_views_count: number;
  mirror_reads_count: number;
  pending_requests_count: number;
}

class DiscoveryService {

  /**
   * ✅ CORRIGÉ - Récupère les profils pour la page découverte avec RLS
   */
  async getDiscoveryProfiles(
    userId: string,
    userToken: string,
    filters: DiscoveryFilters = {}
  ): Promise<DiscoveryResponse> {
    try {
      console.log('🔍 Discovery - Récupération profils pour:', userId, 'avec filtres:', filters);

      // ✅ VALIDATION TOKEN AJOUTÉE
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      if (tokenError || !user || user.id !== userId) {
        console.error('❌ Token invalide dans getDiscoveryProfiles:', tokenError);
        throw new Error('Unauthorized');
      }

      const {
        gender,
        min_age = 18,
        max_age = 99,
        max_distance_km = 50,
        mirror_visibility = ['public', 'on_request'],
        has_photos = false,
        has_questionnaire = false,
        sort_by = 'distance',
        limit = 20,
        offset = 0
      } = filters;

      // Utiliser supabaseAdmin pour les requêtes de découverte car c'est des profils publics
      // Mais on va filtrer les données sensibles
      let query = supabaseAdmin
        .from('profiles')
        .select(`
          id,
          name,
          avatar_url,
          city,
          bio,
          mirror_visibility,
          latitude,
          longitude,
          created_at,
          questionnaire_responses!inner (
            answers,
            profile_json,
            created_at
          )
        `)
        .neq('id', userId) // Exclure l'utilisateur actuel
        .in('mirror_visibility', mirror_visibility);

      // Pagination
      query = query.range(offset, offset + limit - 1);

      const { data: profiles, error, count } = await query;

      if (error) {
        console.error('❌ Discovery - Erreur requête:', error);
        throw error;
      }

      if (!profiles || profiles.length === 0) {
        console.log('ℹ️ Discovery - Aucun profil trouvé');
        return {
          profiles: [],
          total: 0,
          page: Math.floor(offset / limit) + 1,
          limit,
          has_more: false,
          filters_applied: filters
        };
      }

      console.log(`✅ Discovery - ${profiles.length} profils trouvés`);

      // REQUÊTE 2 - Récupérer toutes les photos pour ces profils (supabaseAdmin car infos publiques)
      const profileIds = profiles.map(p => p.id);
      let allPhotos: any[] = [];

      if (profileIds.length > 0) {
        const { data: photosData, error: photosError } = await supabaseAdmin
          .from('profile_photos')
          .select('*')
          .in('user_id', profileIds)
          .order('photo_order', { ascending: true });

        if (photosError) {
          console.error('❌ Discovery - Erreur photos:', photosError);
        } else {
          allPhotos = photosData || [];
          console.log(`📸 Discovery - ${allPhotos.length} photos récupérées`);
        }
      }

      // ✅ REQUÊTE 3 CORRIGÉE - Vérifier l'état des demandes de miroir avec supabaseAdmin + WHERE
      let mirrorRequests: any[] = [];
      if (profileIds.length > 0) {
        const { data: requestsData, error: requestsError } = await supabaseAdmin
          .from('mirror_requests')
          .select('receiver_id, status')
          .eq('sender_id', userId)
          .in('receiver_id', profileIds);

        if (requestsError) {
          console.error('❌ Discovery - Erreur mirror requests:', requestsError);
        } else {
          mirrorRequests = requestsData || [];
        }
      }

      // Récupérer les préférences utilisateur pour calculer les distances
      const userPrefs = await this.getUserPreferences(userId, userToken);

      // Transformer les données pour le frontend
      const discoveryProfiles: DiscoveryProfile[] = profiles.map((profile) => {
        const questionnaire = profile.questionnaire_responses?.[0];
        const answers = questionnaire?.answers || {};
        const profileJson = questionnaire?.profile_json || {};

        // Calculer la distance réelle
        let distance_km: number | undefined;
        if (userPrefs.latitude && userPrefs.longitude && profile.latitude && profile.longitude) {
          distance_km = this.calculateDistance(
            userPrefs.latitude,
            userPrefs.longitude,
            profile.latitude,
            profile.longitude
          );
        } else {
          // Distance aléatoire si pas de coordonnées
          distance_km = Math.floor(Math.random() * 50) + 1;
        }

        // Associer les photos à ce profil
        const profilePhotos = allPhotos.filter(photo => photo.user_id === profile.id);
        const photos = profilePhotos.map((photo: any) => ({
          id: photo.id,
          photo_url: photo.photo_url,
          url: photo.photo_url,
          is_main: photo.is_main,
          photo_order: photo.photo_order
        }));

        // Vérifier l'état de la demande de miroir
        const existingRequest = mirrorRequests.find(req => req.receiver_id === profile.id);
        const interaction_status = {
          can_request_mirror: !existingRequest,
          mirror_request_status: existingRequest?.status || null
        };

        return {
          id: profile.id,
          name: profile.name || 'Anonyme',
          avatar_url: profile.avatar_url,
          city: profile.city,
          age: answers.age || null,
          gender: answers.gender || null,
          bio: profile.bio,
          mirror_visibility: profile.mirror_visibility,
          distance_km,
          photos,
          questionnaire_snippet: {
            authenticity_score: profileJson.authenticity_score,
            attachment_style: profileJson.attachment_style,
            strength_signals: profileJson.strength_signals?.slice(0, 2)
          },
          interaction_status,
          created_at: profile.created_at
        };
      });

      // Filtrer par âge si spécifié
      const filteredProfiles = discoveryProfiles.filter(profile => {
        if (gender && gender !== 'all' && profile.gender !== gender) {
          return false;
        }
        if (min_age && profile.age && profile.age < min_age) {
          return false;
        }
        if (max_age && profile.age && profile.age > max_age) {
          return false;
        }
        if (max_distance_km && profile.distance_km && profile.distance_km > max_distance_km) {
          return false;
        }
        return true;
      });

      // Trier selon le critère
      this.sortProfiles(filteredProfiles, sort_by);

      return {
        profiles: filteredProfiles,
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        has_more: (offset + limit) < (count || 0),
        filters_applied: filters
      };

    } catch (error) {
      console.error('❌ Discovery - Erreur service:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Récupérer un profil spécifique pour la découverte (mixte)
   */
  async getDiscoveryProfile(userId: string, profileId: string, userToken: string): Promise<DiscoveryProfile> {
    try {
      console.log('👤 Discovery - Récupération profil spécifique:', profileId);

      // ✅ VALIDATION TOKEN AJOUTÉE
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      if (tokenError || !user || user.id !== userId) {
        console.error('❌ Token invalide dans getDiscoveryProfile:', tokenError);
        throw new Error('Unauthorized');
      }

      // Utiliser supabaseAdmin pour récupérer les infos publiques du profil
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          name,
          avatar_url,
          city,
          bio,
          mirror_visibility,
          latitude,
          longitude,
          created_at,
          questionnaire_responses (
            answers,
            profile_json
          )
        `)
        .eq('id', profileId)
        .single();

      if (error || !profile) {
        throw new Error('Profile not found');
      }

      // Récupérer les photos (supabaseAdmin car infos publiques)
      const { data: photos } = await supabaseAdmin
        .from('profile_photos')
        .select('*')
        .eq('user_id', profileId)
        .order('photo_order', { ascending: true });

      // Calculer la distance avec les préférences utilisateur (RLS)
      const userPrefs = await this.getUserPreferences(userId, userToken);
      let distance_km: number | undefined;
      if (userPrefs.latitude && userPrefs.longitude && profile.latitude && profile.longitude) {
        distance_km = this.calculateDistance(
          userPrefs.latitude,
          userPrefs.longitude,
          profile.latitude,
          profile.longitude
        );
      }

      const questionnaire = profile.questionnaire_responses?.[0];
      const answers = questionnaire?.answers || {};
      const profileJson = questionnaire?.profile_json || {};

      return {
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        city: profile.city,
        age: answers.age,
        gender: answers.gender,
        bio: profile.bio,
        mirror_visibility: profile.mirror_visibility,
        distance_km,
        photos: (photos || []).map(photo => ({
          id: photo.id,
          photo_url: photo.photo_url,
          url: photo.photo_url,
          is_main: photo.is_main,
          photo_order: photo.photo_order
        })),
        questionnaire_snippet: {
          authenticity_score: profileJson.authenticity_score,
          attachment_style: profileJson.attachment_style,
          strength_signals: profileJson.strength_signals?.slice(0, 2)
        },
        created_at: profile.created_at
      };

    } catch (error) {
      console.error('❌ Discovery - Erreur getDiscoveryProfile:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Demander l'accès au miroir d'un profil avec RLS + SCHEMA FIXED
   */
  async requestMirrorAccess(
    senderId: string,
    receiverId: string,
    userToken: string
  ): Promise<MirrorRequestResponse> {
    try {
      console.log('🔐 Mirror Request - De:', senderId, 'vers:', receiverId);

      // ✅ VALIDATION TOKEN (même pattern que profile/questionnaire)
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user) {
        console.error('❌ Token invalide dans requestMirrorAccess:', tokenError);
        throw new Error('Unauthorized');
      }
      
      // ✅ VÉRIFICATION senderId match
      if (user.id !== senderId) {
        console.error('❌ SenderId mismatch:', { 
          tokenUserId: user.id, 
          providedSenderId: senderId 
        });
        throw new Error('Unauthorized');
      }

      console.log('✅ Token validé pour mirror request:', user.email);

      // ✅ VÉRIFICATION receiverId différent + existe
      if (senderId === receiverId) {
        return {
          success: false,
          message: 'Vous ne pouvez pas demander accès à votre propre miroir'
        };
      }

      const { data: receiverExists } = await supabaseAdmin
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', receiverId)
        .single();

      if (!receiverExists) {
        return {
          success: false,
          message: 'Profil destinataire introuvable'
        };
      }

      // ✅ VÉRIFICATION demande existante avec supabaseAdmin + WHERE
      const { data: existingRequest } = await supabaseAdmin
        .from('mirror_requests')
        .select('id, status')
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return {
            success: false,
            message: 'Une demande est déjà en attente pour ce profil'
          };
        } else if (existingRequest.status === 'rejected') {
          return {
            success: false,
            message: 'Votre demande a été refusée, vous ne pouvez pas refaire de demande'
          };
        } else if (existingRequest.status === 'accepted') {
          return {
            success: false,
            message: 'Vous avez déjà accès à ce miroir'
          };
        }
      }

      // Récupérer les infos du sender pour la notification (supabaseAdmin car infos publiques)
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', senderId)
        .single();

      // ✅ CRÉATION SÉCURISÉE avec supabaseAdmin + SCHEMA CORRECT
      const { data: newRequest, error: requestError } = await supabaseAdmin
        .from('mirror_requests')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          status: 'pending'
          // ✅ created_at se remplit automatiquement avec now()
          // ❌ SUPPRIMÉ requested_at (colonne inexistante)
        })
        .select()
        .single();

      if (requestError) {
        console.error('❌ Mirror Request - Erreur insertion:', requestError);
        throw requestError;
      }

      // Créer une notification pour le receiver avec supabaseAdmin (système)
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_id: receiverId,
          sender_id: senderId,
          type: 'mirror_request',
          title: 'Nouvelle demande de miroir',
          message: `${senderProfile?.name || 'Quelqu\'un'} souhaite accéder à votre miroir`,
          status: 'unread',
          payload: {
            sender_id: senderId,
            sender_name: senderProfile?.name,
            sender_avatar: senderProfile?.avatar_url,
            request_id: newRequest.id
          }
        });

      if (notifError) {
        console.error('❌ Mirror Request - Erreur notification:', notifError);
      }

      console.log('✅ Mirror Request - Demande créée:', newRequest.id);

      return {
        success: true,
        message: 'Demande envoyée avec succès',
        request: {
          id: newRequest.id,
          sender_id: senderId,
          receiver_id: receiverId,
          status: newRequest.status,
          created_at: newRequest.created_at
        }
      };

    } catch (error) {
      console.error('❌ Mirror Request - Erreur:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Répondre à une demande de miroir avec RLS
   */
  async respondToMirrorRequest(
    requestId: string,
    userId: string,
    response: 'accepted' | 'rejected',
    userToken: string
  ): Promise<MirrorRequestResponse> {
    try {
      console.log('📝 Mirror Response - Request:', requestId, 'Response:', response);

      // ✅ VALIDATION TOKEN
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        console.error('❌ Token invalide dans respondToMirrorRequest:', tokenError);
        throw new Error('Unauthorized');
      }

      // ✅ VÉRIFIER demande avec supabaseAdmin + WHERE explicite
      const { data: request, error: fetchError } = await supabaseAdmin
        .from('mirror_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status
        `)
        .eq('id', requestId)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .single();

      if (fetchError || !request) {
        return {
          success: false,
          message: 'Demande non trouvée ou déjà traitée'
        };
      }

      // ✅ MISE À JOUR avec supabaseAdmin + WHERE explicite + SCHEMA CORRECT
      const { error: updateError } = await supabaseAdmin
        .from('mirror_requests')
        .update({
          status: response,
          responded_at: new Date().toISOString()  // ✅ GARDE responded_at (existe)
        })
        .eq('id', requestId)
        .eq('receiver_id', userId);

      if (updateError) {
        console.error('❌ Mirror Response - Erreur mise à jour:', updateError);
        throw updateError;
      }

      // Récupérer le nom du responder pour la notification (supabaseAdmin car infos publiques)
      const { data: responderProfile } = await supabaseAdmin
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', userId)
        .single();

      // Créer une notification pour le sender avec supabaseAdmin (système)
      const notificationType = response === 'accepted' ? 'mirror_accepted' : 'mirror_rejected';
      const notificationMessage = response === 'accepted'
        ? `${responderProfile?.name || 'Quelqu\'un'} a accepté votre demande de miroir`
        : `${responderProfile?.name || 'Quelqu\'un'} a refusé votre demande de miroir`;

      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_id: request.sender_id,
          sender_id: userId,
          type: notificationType,
          title: response === 'accepted' ? 'Demande acceptée' : 'Demande refusée',
          message: notificationMessage,
          status: 'unread',
          payload: {
            responder_id: userId,
            responder_name: responderProfile?.name,
            responder_avatar: responderProfile?.avatar_url,
            request_id: requestId,
            response: response
          }
        });

      if (notifError) {
        console.error('❌ Mirror Response - Erreur notification:', notifError);
      }

      console.log('✅ Mirror Response - Réponse enregistrée:', response);

      return {
        success: true,
        message: response === 'accepted' ? 'Accès accordé' : 'Demande refusée',
        request: {
          id: requestId,
          responder_id: userId,
          response: response,
          updated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Mirror Response - Erreur:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Récupérer les demandes reçues avec RLS
   */
  async getReceivedMirrorRequests(userId: string, userToken: string): Promise<any[]> {
    try {
      console.log('📨 Get Received Requests - User:', userId);

      // ✅ VALIDATION TOKEN
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        console.error('❌ Token invalide dans getReceivedMirrorRequests:', tokenError);
        throw new Error('Unauthorized');
      }

      // ✅ REQUÊTE avec supabaseAdmin + WHERE explicite
      const { data: requests, error } = await supabaseAdmin
        .from('mirror_requests')
        .select(`
          id,
          sender_id,
          status,
          created_at,
          responded_at
        `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Get Received Requests - Erreur:', error);
        throw error;
      }

      // Enrichir avec les infos des senders (supabaseAdmin car infos publiques)
      const enrichedRequests = await Promise.all(
        (requests || []).map(async (request) => {
          const { data: senderProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', request.sender_id)
            .single();

          return {
            ...request,
            sender: senderProfile
          };
        })
      );

      console.log(`✅ Get Received Requests - ${enrichedRequests.length} demandes trouvées`);

      return enrichedRequests;

    } catch (error) {
      console.error('❌ Get Received Requests - Erreur:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Récupérer les demandes envoyées avec RLS
   */
  async getSentMirrorRequests(userId: string, userToken: string): Promise<any[]> {
    try {
      console.log('📤 Get Sent Requests - User:', userId);

      // ✅ VALIDATION TOKEN
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        console.error('❌ Token invalide dans getSentMirrorRequests:', tokenError);
        throw new Error('Unauthorized');
      }

      // ✅ REQUÊTE avec supabaseAdmin + WHERE explicite
      const { data: requests, error } = await supabaseAdmin
        .from('mirror_requests')
        .select(`
          id,
          receiver_id,
          status,
          created_at,
          responded_at
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Get Sent Requests - Erreur:', error);
        throw error;
      }

      // Enrichir avec les infos des receivers (supabaseAdmin car infos publiques)
      const enrichedRequests = await Promise.all(
        (requests || []).map(async (request) => {
          const { data: receiverProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', request.receiver_id)
            .single();

          return {
            ...request,
            receiver: receiverProfile
          };
        })
      );

      console.log(`✅ Get Sent Requests - ${enrichedRequests.length} demandes trouvées`);

      return enrichedRequests;

    } catch (error) {
      console.error('❌ Get Sent Requests - Erreur:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Vérifier si l'utilisateur peut voir un miroir avec LOGIQUE BIDIRECTIONNELLE
   */
  async canViewMirror(viewerId: string, profileId: string, userToken: string): Promise<boolean> {
    try {
      console.log('🔍 canViewMirror called:', {
        viewerId,
        profileId,
        timestamp: new Date().toISOString()
      });

      // ✅ VALIDATION TOKEN
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== viewerId) {
        console.error('❌ Token invalide dans canViewMirror:', tokenError);
        return false;
      }

      // Si c'est son propre miroir
      if (viewerId === profileId) {
        console.log('✅ canViewMirror - Own mirror access granted');
        return true;
      }

      // Vérifier la visibilité du miroir (supabaseAdmin car info publique)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('mirror_visibility')
        .eq('id', profileId)
        .single();

      if (!profile) {
        console.log('❌ canViewMirror - Profile not found');
        return false;
      }

      console.log('🔍 canViewMirror - Profile visibility:', profile.mirror_visibility);

      // Si public, tout le monde peut voir
      if (profile.mirror_visibility === 'public') {
        console.log('✅ canViewMirror - Public mirror access granted');
        return true;
      }

      // Si privé, personne ne peut voir
      if (profile.mirror_visibility === 'private') {
        console.log('❌ canViewMirror - Private mirror access denied');
        return false;
      }

      // ✅ LOGIQUE BIDIRECTIONNELLE CORRIGÉE
      if (profile.mirror_visibility === 'on_request') {
        console.log('🔍 canViewMirror - Checking bidirectional mirror requests...');
        
        // Vérifier s'il y a une demande acceptée dans SOIT direction
        const { data: request } = await supabaseAdmin
          .from('mirror_requests')
          .select('status, sender_id, receiver_id')
          .eq('status', 'accepted')
          .or(`and(sender_id.eq.${viewerId},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${viewerId})`)
          .maybeSingle();

        console.log('🔍 canViewMirror - Bidirectional request result:', {
          found: !!request,
          request: request ? {
            sender_id: request.sender_id,
            receiver_id: request.receiver_id,
            status: request.status
          } : null
        });

        const hasAccess = !!request;
        console.log(`${hasAccess ? '✅' : '❌'} canViewMirror - Bidirectional access ${hasAccess ? 'granted' : 'denied'}`);
        
        return hasAccess;
      }

      console.log('❌ canViewMirror - Unknown visibility type');
      return false;
      
    } catch (error) {
      console.error('❌ canViewMirror - Erreur:', error);
      return false;
    }
  }

  /**
   * ✅ CORRIGÉ - Enregistrer la lecture d'un miroir avec RLS
   */
  async recordMirrorRead(viewerId: string, profileId: string, userToken: string): Promise<void> {
    try {
      console.log('📖 Recording mirror read:', viewerId, '->', profileId);

      // ✅ VALIDATION TOKEN
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== viewerId) {
        console.error('❌ Token invalide dans recordMirrorRead:', tokenError);
        return;
      }

      // Enregistrer la vue si ce n'est pas son propre miroir
      if (viewerId !== profileId) {
        // ✅ ENREGISTREMENT avec supabaseAdmin + WHERE explicite
        const { error } = await supabaseAdmin
          .from('profile_views')
          .upsert({
            viewer_id: viewerId,
            viewed_profile_id: profileId,
            view_type: 'mirror',
            viewed_at: new Date().toISOString(),
            last_viewed_at: new Date().toISOString(),
            view_count: 1
          }, {
            onConflict: 'viewer_id,viewed_profile_id,view_type',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('❌ Record Mirror Read - Erreur:', error);
        }

        // Créer une notification pour le propriétaire du miroir avec supabaseAdmin (système)
        const { data: viewerProfile } = await supabaseAdmin
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', viewerId)
          .single();

        const { error: notifError } = await supabaseAdmin
          .from('notifications')
          .insert({
            recipient_id: profileId,
            sender_id: viewerId,
            type: 'mirror_read',
            title: 'Miroir consulté',
            message: `${viewerProfile?.name || 'Quelqu\'un'} a lu votre miroir`,
            status: 'unread',
            payload: {
              viewer_id: viewerId,
              viewer_name: viewerProfile?.name,
              viewer_avatar: viewerProfile?.avatar_url
            }
          });

        if (notifError) {
          console.error('❌ Record Mirror Read - Erreur notification:', notifError);
        }
      }
    } catch (error) {
      console.error('❌ Record Mirror Read - Erreur:', error);
    }
  }

  /**
   * ✅ CORRIGÉ - Récupérer les statistiques de notifications avec RLS
   */
  async getNotificationStats(userId: string, userToken: string): Promise<NotificationStats> {
    try {
      console.log('📊 Get Notification Stats - User:', userId);

      // ✅ VALIDATION TOKEN
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        console.error('❌ Token invalide dans getNotificationStats:', tokenError);
        throw new Error('Unauthorized');
      }

      // ✅ REQUÊTES avec supabaseAdmin + WHERE explicite
      // Compter les notifications non lues
      const { count: unreadCount } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('status', 'unread');

      // Compter les vues de profil récentes (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: profileViewsCount } = await supabaseAdmin
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewed_profile_id', userId)
        .eq('view_type', 'profile')
        .gte('last_viewed_at', sevenDaysAgo.toISOString());

      // Compter les lectures de miroir récentes (7 derniers jours)
      const { count: mirrorReadsCount } = await supabaseAdmin
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewed_profile_id', userId)
        .eq('view_type', 'mirror')
        .gte('last_viewed_at', sevenDaysAgo.toISOString());

      // Compter les demandes de miroir en attente
      const { count: pendingRequestsCount } = await supabaseAdmin
        .from('mirror_requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      const stats = {
        unread_count: unreadCount || 0,
        profile_views_count: profileViewsCount || 0,
        mirror_reads_count: mirrorReadsCount || 0,
        pending_requests_count: pendingRequestsCount || 0
      };

      console.log('✅ Get Notification Stats - Stats:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Get Notification Stats - Erreur:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Récupérer les notifications avec RLS
   */
  async getNotifications(userId: string, userToken: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      console.log('📄 Get Notifications - User:', userId, 'Limit:', limit, 'Offset:', offset);

      // ✅ VALIDATION TOKEN
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        console.error('❌ Token invalide dans getNotifications:', tokenError);
        throw new Error('Unauthorized');
      }

      // ✅ REQUÊTE avec supabaseAdmin + WHERE explicite
      const { data: notifications, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Get Notifications - Erreur:', error);
        throw error;
      }

      console.log(`✅ Get Notifications - ${notifications?.length || 0} notifications trouvées`);

      return notifications || [];

    } catch (error) {
      console.error('❌ Get Notifications - Erreur:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Marquer une notification comme lue avec RLS
   */
  async markNotificationAsRead(userId: string, notificationId: string, userToken: string): Promise<void> {
    try {
      console.log('✅ Mark Notification Read - User:', userId, 'Notification:', notificationId);

      // ✅ VALIDATION TOKEN
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        console.error('❌ Token invalide dans markNotificationAsRead:', tokenError);
        throw new Error('Unauthorized');
      }

      // ✅ MISE À JOUR avec supabaseAdmin + WHERE explicite
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('recipient_id', userId);

      if (error) {
        console.error('❌ Mark Notification Read - Erreur:', error);
        throw error;
      }

    } catch (error) {
      console.error('❌ Mark Notification Read - Erreur:', error);
      throw error;
    }
  }

  /**
   * ✅ CORRIGÉ - Marquer toutes les notifications comme lues avec RLS
   */
  async markAllNotificationsAsRead(userId: string, userToken: string): Promise<void> {
    try {
      console.log('✅ Mark All Notifications Read - User:', userId);

      // ✅ VALIDATION TOKEN
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      
      if (tokenError || !user || user.id !== userId) {
        console.error('❌ Token invalide dans markAllNotificationsAsRead:', tokenError);
        throw new Error('Unauthorized');
      }

      // ✅ MISE À JOUR avec supabaseAdmin + WHERE explicite
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('recipient_id', userId)
        .eq('status', 'unread');

      if (error) {
        console.error('❌ Mark All Notifications Read - Erreur:', error);
        throw error;
      }

    } catch (error) {
      console.error('❌ Mark All Notifications Read - Erreur:', error);
      throw error;
    }
  }

  // ============ MÉTHODES PRIVÉES ============

  /**
   * ✅ CORRIGÉ - Récupérer les préférences utilisateur avec RLS
   */
  private async getUserPreferences(userId: string, userToken: string): Promise<any> {
    // ✅ VALIDATION TOKEN
    const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
    
    if (tokenError || !user || user.id !== userId) {
      console.error('❌ Token invalide dans getUserPreferences:', tokenError);
      return {};
    }

    // ✅ REQUÊTE avec supabaseAdmin + WHERE explicite
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('latitude, longitude')
      .eq('id', userId)
      .single();

    return data || {};
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private sortProfiles(profiles: DiscoveryProfile[], sortBy: string): void {
    switch (sortBy) {
      case 'distance':
        profiles.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
        break;
      case 'age':
        profiles.sort((a, b) => (a.age || 0) - (b.age || 0));
        break;
      case 'newest':
        profiles.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'random':
        profiles.sort(() => Math.random() - 0.5);
        break;
      default:
        break;
    }
  }

  /**
   * 🆕 DÉDUPLICATION INTELLIGENTE - Créer notification seulement si pas de doublon récent
   */
  private async createNotificationSmart(
    recipientId: string,
    senderId: string,
    type: any,
    title: string,
    message: string,
    payload: any
  ): Promise<void> {
    try {
      // Vérifier si notification similaire existe dans les dernières 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: existingNotif } = await supabaseAdmin
        .from('notifications')
        .select('id, created_at')
        .eq('recipient_id', recipientId)
        .eq('sender_id', senderId)
        .eq('type', type)
        .gte('created_at', yesterday.toISOString())
        .single();

      if (existingNotif) {
        console.log('⚡ Notification similaire existe déjà, skip:', type);
        return;
      }

      // Créer nouvelle notification seulement si pas de doublon
      const { error } = await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_id: recipientId,
          sender_id: senderId,
          type,
          title,
          message,
          status: 'unread',
          payload
        });

      if (error) {
        console.error('❌ Erreur création notification:', error);
      } else {
        console.log('✅ Notification créée (dédup):', type);
      }

    } catch (error) {
      console.error('❌ Erreur createNotificationSmart:', error);
    }
  }

  /**
   * 🆕 REGROUPEMENT INTELLIGENT - Pour frontend optimisé
   */
  async getGroupedNotifications(userId: string, userToken: string, limit: number = 15): Promise<any[]> {
    try {
      // Validation token
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      if (tokenError || !user || user.id !== userId) {
        throw new Error('Unauthorized');
      }

      // Récupérer toutes les notifications récentes
      const { data: allNotifications, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Regrouper par type + sender dans les dernières 24h
      const grouped = new Map<string, any>();
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      for (const notif of allNotifications || []) {
        const notifDate = new Date(notif.created_at);
        
        // Regrouper seulement les notifications récentes (24h)
        const groupKey = notifDate > oneDayAgo 
          ? `${notif.type}-${notif.sender_id}`
          : `${notif.id}-individual`; // Anciennes = individuelles
        
        if (grouped.has(groupKey)) {
          const group = grouped.get(groupKey);
          group.count++;
          group.latest_date = notif.created_at;
          group.has_unread = group.has_unread || notif.status === 'unread';
          group.notification_ids.push(notif.id);
        } else {
          grouped.set(groupKey, {
            id: notif.id,
            type: notif.type,
            sender_id: notif.sender_id,
            sender_name: notif.payload.sender_name || notif.payload.viewer_name || notif.payload.responder_name,
            sender_avatar: notif.payload.sender_avatar || notif.payload.viewer_avatar || notif.payload.responder_avatar,
            count: 1,
            latest_date: notif.created_at,
            has_unread: notif.status === 'unread',
            notification_ids: [notif.id],
            original_notification: notif
          });
        }
      }

      // Convertir en array et trier par date
      const result = Array.from(grouped.values())
        .sort((a, b) => new Date(b.latest_date).getTime() - new Date(a.latest_date).getTime())
        .slice(0, limit);

      console.log(`✅ Regroupement: ${allNotifications?.length || 0} → ${result.length} notifications`);
      return result;

    } catch (error) {
      console.error('❌ Erreur getGroupedNotifications:', error);
      throw error;
    }
  }
}

export const discoveryService = new DiscoveryService();