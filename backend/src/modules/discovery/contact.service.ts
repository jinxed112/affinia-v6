// backend/src/modules/discovery/contact.service.ts
import { supabaseAdmin } from '../../config/database';
import { chatService } from '../chat/chat.service';

interface ContactRequestResponse {
  success: boolean;
  message: string;
  request?: any;
  can_retry_after?: string;
}

interface ContactRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  requested_at: string;
  responded_at: string | null;
  cooldown_until: string | null;
  sender?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

class ContactService {
  
  /**
   * Demander un contact après accès miroir mutuel
   */
  async requestContact(
    senderId: string,
    receiverId: string,
    message: string | null,
    userToken: string
  ): Promise<ContactRequestResponse> {
    try {
      console.log('💬 Contact Request - De:', senderId, 'vers:', receiverId);

      // ✅ Validation token
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      if (tokenError || !user || user.id !== senderId) {
        throw new Error('Unauthorized');
      }

      // Vérifier que ce n'est pas soi-même
      if (senderId === receiverId) {
        return {
          success: false,
          message: 'Vous ne pouvez pas vous demander en contact'
        };
      }

      // Vérifier l'accès miroir bidirectionnel
      const hasAccess = await this.checkMutualMirrorAccess(senderId, receiverId);
      if (!hasAccess) {
        return {
          success: false,
          message: 'Accès miroir mutuel requis pour demander un contact'
        };
      }

      // Vérifier demande existante et cooldown
      const { data: existingRequest } = await supabaseAdmin
        .from('contact_requests')
        .select('*')
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return {
            success: false,
            message: 'Une demande de contact est déjà en attente'
          };
        }
        
        if (existingRequest.status === 'declined' && existingRequest.cooldown_until) {
          const cooldownEnd = new Date(existingRequest.cooldown_until);
          if (cooldownEnd > new Date()) {
            return {
              success: false,
              message: 'Vous pourrez refaire une demande plus tard',
              can_retry_after: cooldownEnd.toISOString()
            };
          }
        }
      }

      // Récupérer infos sender pour notification
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', senderId)
        .single();

      // Créer la demande de contact
      const { data: newRequest, error: requestError } = await supabaseAdmin
        .from('contact_requests')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          sender_message: message,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) {
        console.error('❌ Contact Request - Erreur insertion:', requestError);
        throw requestError;
      }

      // Créer notification pour le receiver
      await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_id: receiverId,
          sender_id: senderId,
          type: 'contact_request',
          title: 'Nouvelle demande de contact',
          message: `${senderProfile?.name || 'Quelqu\'un'} souhaite discuter avec vous`,
          status: 'unread',
          payload: {
            sender_id: senderId,
            sender_name: senderProfile?.name,
            sender_avatar: senderProfile?.avatar_url,
            request_id: newRequest.id,
            sender_message: message
          }
        });

      console.log('✅ Contact Request - Demande créée:', newRequest.id);

      return {
        success: true,
        message: 'Demande de contact envoyée avec succès',
        request: newRequest
      };

    } catch (error) {
      console.error('❌ Contact Request - Erreur:', error);
      throw error;
    }
  }

  /**
   * Répondre à une demande de contact
   */
  async respondToContactRequest(
    requestId: string,
    userId: string,
    response: 'accepted' | 'declined',
    userToken: string
  ): Promise<ContactRequestResponse> {
    try {
      console.log('📝 Contact Response - Request:', requestId, 'Response:', response);

      // ✅ Validation token
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      if (tokenError || !user || user.id !== userId) {
        throw new Error('Unauthorized');
      }

      // Vérifier demande avec WHERE explicite
      const { data: request, error: fetchError } = await supabaseAdmin
        .from('contact_requests')
        .select('*')
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

      let conversationId = null;
      let cooldownUntil = null;

      // Si accepté, créer la conversation automatiquement
      if (response === 'accepted') {
        try {
          const conversation = await chatService.createConversationFromMirrorAcceptance(
            request.sender_id,
            request.receiver_id
          );
          conversationId = conversation.id;
          console.log('✅ Conversation auto-créée:', conversationId);
        } catch (error) {
          console.error('❌ Erreur création conversation:', error);
          // Continuer même si création conversation échoue
        }
      } else {
        // Si refusé, définir cooldown 1 mois
        const cooldown = new Date();
        cooldown.setMonth(cooldown.getMonth() + 1);
        cooldownUntil = cooldown.toISOString();
      }

      // Mettre à jour la demande
      const { error: updateError } = await supabaseAdmin
        .from('contact_requests')
        .update({
          status: response,
          responded_at: new Date().toISOString(),
          conversation_id: conversationId,
          cooldown_until: cooldownUntil
        })
        .eq('id', requestId)
        .eq('receiver_id', userId);

      if (updateError) {
        console.error('❌ Contact Response - Erreur mise à jour:', updateError);
        throw updateError;
      }

      // Récupérer infos responder pour notification
      const { data: responderProfile } = await supabaseAdmin
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', userId)
        .single();

      // Créer notification pour le sender
      const notificationType = response === 'accepted' ? 'contact_accepted' : 'contact_declined_soft';
      const notificationMessage = response === 'accepted'
        ? `${responderProfile?.name || 'Cette personne'} a accepté de discuter avec vous ! 💬`
        : `${responderProfile?.name || 'Cette personne'} n'est pas disponible pour discuter en ce moment`;

      await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_id: request.sender_id,
          sender_id: userId,
          type: notificationType,
          title: response === 'accepted' ? 'Contact accepté !' : 'Réponse à votre demande',
          message: notificationMessage,
          status: 'unread',
          payload: {
            responder_id: userId,
            responder_name: responderProfile?.name,
            responder_avatar: responderProfile?.avatar_url,
            request_id: requestId,
            response: response,
            conversation_id: conversationId
          }
        });

      console.log('✅ Contact Response - Réponse enregistrée:', response);

      return {
        success: true,
        message: response === 'accepted' 
          ? 'Contact accepté ! Conversation créée automatiquement' 
          : 'Réponse enregistrée',
        request: {
          id: requestId,
          response: response,
          conversation_id: conversationId,
          updated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Contact Response - Erreur:', error);
      throw error;
    }
  }

  /**
   * Récupérer demandes de contact reçues
   */
  async getReceivedContactRequests(userId: string, userToken: string): Promise<ContactRequest[]> {
    try {
      // ✅ Validation token
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      if (tokenError || !user || user.id !== userId) {
        throw new Error('Unauthorized');
      }

      const { data: requests, error } = await supabaseAdmin
        .from('contact_requests')
        .select('*')
        .eq('receiver_id', userId)
        .order('requested_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Enrichir avec infos senders
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

      console.log('📥 Get Received Contact Requests - Count:', enrichedRequests.length);
      return enrichedRequests;
    } catch (error) {
      console.error('❌ Get Received Contact Requests - Erreur:', error);
      throw error;
    }
  }

  /**
   * Récupérer demandes de contact envoyées
   */
  async getSentContactRequests(userId: string, userToken: string): Promise<ContactRequest[]> {
    try {
      // ✅ Validation token
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      if (tokenError || !user || user.id !== userId) {
        throw new Error('Unauthorized');
      }

      const { data: requests, error } = await supabaseAdmin
        .from('contact_requests')
        .select('*')
        .eq('sender_id', userId)
        .order('requested_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Enrichir avec infos receivers
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

      console.log('📤 Get Sent Contact Requests - Count:', enrichedRequests.length);
      return enrichedRequests;
    } catch (error) {
      console.error('❌ Get Sent Contact Requests - Erreur:', error);
      throw error;
    }
  }

  /**
   * Vérifier si l'utilisateur peut demander un contact
   */
  async canRequestContact(userId: string, targetId: string, userToken: string): Promise<boolean> {
    try {
      // ✅ Validation token
      const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(userToken);
      if (tokenError || !user || user.id !== userId) {
        return false;
      }

      if (userId === targetId) return false;

      // Vérifier accès miroir bidirectionnel
      const hasAccess = await this.checkMutualMirrorAccess(userId, targetId);
      if (!hasAccess) return false;

      // Vérifier demande existante
      const { data: existingRequest } = await supabaseAdmin
        .from('contact_requests')
        .select('status, cooldown_until')
        .eq('sender_id', userId)
        .eq('receiver_id', targetId)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') return false;
        if (existingRequest.status === 'accepted') return false;
        
        if (existingRequest.status === 'declined' && existingRequest.cooldown_until) {
          const cooldownEnd = new Date(existingRequest.cooldown_until);
          if (cooldownEnd > new Date()) return false;
        }
      }

      console.log('🤔 Can Request Contact - User:', userId, 'Target:', targetId, 'Result: true');
      return true;
    } catch (error) {
      console.error('❌ Can Request Contact - Erreur:', error);
      return false;
    }
  }

  /**
   * Vérifier accès miroir bidirectionnel
   */
  private async checkMutualMirrorAccess(userId1: string, userId2: string): Promise<boolean> {
    try {
      const { data: request } = await supabaseAdmin
        .from('mirror_requests')
        .select('status')
        .eq('status', 'accepted')
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .maybeSingle();

      return !!request;
    } catch (error) {
      console.error('❌ Check Mutual Mirror Access - Erreur:', error);
      return false;
    }
  }
}

export const contactService = new ContactService();