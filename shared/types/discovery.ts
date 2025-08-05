// =============================================
// MODIFICATION DISCOVERY SERVICE
// backend/src/modules/discovery/discovery.service.ts
// =============================================

// ✨ À AJOUTER EN HAUT DU FICHIER (dans les imports)
import { chatService } from '../chat/chat.service';

// ✨ REMPLACER LA MÉTHODE respondToMirrorRequest PAR CELLE-CI :

/**
 * Répondre à une demande de miroir - MODIFIÉ AVEC INTÉGRATION CHAT
 */
async respondToMirrorRequest(
  requestId: string,
  userId: string,
  response: 'accepted' | 'rejected'
): Promise<MirrorRequestResponse> {
  try {
    console.log('📝 Mirror Response - Request:', requestId, 'Response:', response);

    // Vérifier que la demande existe et que l'utilisateur est le receiver
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('mirror_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        sender:profiles!mirror_requests_sender_id_fkey(name, avatar_url)
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

    // Mettre à jour le statut de la demande
    const { error: updateError } = await supabaseAdmin
      .from('mirror_requests')
      .update({
        status: response,
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Mirror Response - Erreur mise à jour:', updateError);
      throw updateError;
    }

    // Récupérer le nom du responder pour la notification
    const { data: responderProfile } = await supabaseAdmin
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', userId)
      .single();

    // 🚀 NOUVELLE FONCTIONNALITÉ : Créer automatiquement une conversation si accepté
    let conversationCreated = null;
    if (response === 'accepted') {
      try {
        console.log('🪞➡️💬 Miroir accepté - Création conversation automatique');
        
        // Créer la conversation via le chat service
        conversationCreated = await chatService.createConversationFromMirrorAcceptance(
          request.sender_id, 
          userId
        );
        
        console.log('✅ Conversation créée automatiquement:', conversationCreated.id);
        
      } catch (chatError) {
        console.error('❌ Erreur création conversation automatique:', chatError);
        // Ne pas faire échouer la réponse au miroir si la conversation échoue
      }
    }

    // Créer une notification pour le sender - MODIFIÉE
    const notificationType = response === 'accepted' ? 'mirror_accepted' : 'mirror_rejected';
    const notificationMessage = response === 'accepted'
      ? `${responderProfile?.name || 'Quelqu\'un'} a accepté votre demande de miroir.${conversationCreated ? ' Vous pouvez maintenant discuter !' : ''}`
      : `${responderProfile?.name || 'Quelqu\'un'} a refusé votre demande de miroir`;

    const notificationPayload: any = {
      responder_id: userId,
      responder_name: responderProfile?.name,
      responder_avatar: responderProfile?.avatar_url,
      request_id: requestId,
      response: response
    };

    // Ajouter l'ID de conversation si créée
    if (conversationCreated) {
      notificationPayload.conversation_id = conversationCreated.id;
      notificationPayload.can_start_chat = true;
    }

    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_id: request.sender_id,
        sender_id: userId,
        type: notificationType,
        title: response === 'accepted' ? 'Demande acceptée 🎉' : 'Demande refusée',
        message: notificationMessage,
        status: 'unread',
        payload: notificationPayload
      });

    if (notifError) {
      console.error('❌ Mirror Response - Erreur notification:', notifError);
    }

    console.log('✅ Mirror Response - Réponse enregistrée:', response);

    return {
      success: true,
      message: response === 'accepted' 
        ? conversationCreated 
          ? 'Accès accordé ! Une conversation a été créée.' 
          : 'Accès accordé !'
        : 'Demande refusée',
      request: {
        id: requestId,
        sender_id: request.sender_id,
        receiver_id: userId,
        responder_id: userId,
        status: response,
        response: response,
        created_at: request.created_at,
        updated_at: new Date().toISOString(),
        conversation_id: conversationCreated?.id || null // ← NOUVEAU : Retourner l'ID de la conversation
      }
    };

  } catch (error) {
    console.error('❌ Mirror Response - Erreur:', error);
    throw error;
  }
}

// =============================================
// AUSSI, METTRE À JOUR shared/types/discovery.ts
// =============================================

/*
Dans shared/types/discovery.ts, modifier l'interface MirrorRequestResponse :

export interface MirrorRequestResponse {
  success: boolean;
  message: string;
  request?: {
    id: string;
    sender_id?: string;
    receiver_id?: string;
    responder_id?: string;
    status?: string;
    response?: string;
    created_at?: string;
    updated_at?: string;
    conversation_id?: string | null; // ← NOUVEAU : ID de la conversation créée
  };
  can_retry_after?: string;
}
*/