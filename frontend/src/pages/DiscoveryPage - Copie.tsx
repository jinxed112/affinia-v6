import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { discoveryService } from "../services/discoveryService";
import { contactService } from "../services/contactService";
import { supabase } from "../lib/supabase";
import { parseEmotionalText, smartSplitParagraphs, extractJsonFromText } from "../utils/mirrorUtils";
import { useDesignSystem } from "../styles/designSystem";
import { BaseComponents } from "../components/ui/BaseComponents";
import { AffiniaCard } from "../components/profile/AffiniaCard";
import { 
  MapPin, X, Loader, SlidersHorizontal, RefreshCw, ChevronLeft, ChevronRight, 
  Unlock, Lock, Clock, Sparkles, Heart, Info, Zap, Star, ArrowUpRight, Brain, Cpu,
  Database, Check, MessageCircle, BookOpen, Target, CloudRain, User, Shield, Filter
} from "lucide-react";
import type { DiscoveryProfile, DiscoveryFilters } from "../../../shared/types/discovery";

interface DiscoveryPageProps { isDarkMode: boolean }

interface AcceptedConnection {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  age?: number;
  gender?: string;
  bio?: string;
  photos: any[];
  questionnaire_snippet?: any;
  connected_at: string;
  status: 'accepted';
}

interface MirrorData {
  generated_profile: string;
  profile_json: any;
}

// 🆕 CONTACT REQUEST STATUS PAR PROFIL
interface ContactRequestState {
  status: 'idle' | 'requesting' | 'requested' | 'accepted';
  canRequest: boolean;
}

type EnhancedProfile = DiscoveryProfile | AcceptedConnection;

// Status filter types
type ProfileStatusFilter = 'all' | 'new' | 'pending' | 'accepted';

interface EnhancedFilters extends DiscoveryFilters {
  profile_status: ProfileStatusFilter;
}

// Mirror status machine (ENHANCED)
function getMirrorState(p: EnhancedProfile) {
  if ('status' in p && p.status === 'accepted') {
    return { key: "accepted" as const, label: "Connexion établie", color: "green", actionLabel: "Voir le miroir", icon: Check };
  }
  if ('mirror_visibility' in p && p.mirror_visibility === "public") {
    return { key: "public" as const, label: "Public", color: "green", actionLabel: "Voir le miroir", icon: Unlock };
  }
  const s = 'interaction_status' in p ? p.interaction_status?.mirror_request_status : undefined;
  if (s === "accepted") return { key: "accepted" as const, label: "Accès accordé", color: "purple", actionLabel: "Voir le miroir", icon: Sparkles };
  if (s === "pending") return { key: "pending" as const, label: "En attente", color: "yellow", icon: Clock };
  if (s === "rejected") return { key: "rejected" as const, label: "Refusé", color: "red", icon: X };
  return { key: "private" as const, label: "Privé", color: "blue", actionLabel: "Demander l'accès", icon: Lock };
}

const defaultFilters: EnhancedFilters = {
  gender: "all",
  min_age: 18,
  max_age: 99,
  max_distance_km: 50,
  sort_by: "distance",
  limit: 12,
  offset: 0,
  profile_status: "all"
};

export function DiscoveryPage({ isDarkMode }: DiscoveryPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const design = useDesignSystem(isDarkMode);

  const [filters, setFilters] = useState<EnhancedFilters>(defaultFilters);
  const [discoveryProfiles, setDiscoveryProfiles] = useState<DiscoveryProfile[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<AcceptedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showCompatibilityInfo, setShowCompatibilityInfo] = useState(false);

  // États pour le miroir (profils acceptés)
  const [mirrorData, setMirrorData] = useState<MirrorData | null>(null);
  const [loadingMirror, setLoadingMirror] = useState(false);

  // 🆕 CONTACT REQUEST STATES PAR PROFIL
  const [contactRequests, setContactRequests] = useState<Map<string, ContactRequestState>>(new Map());

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Couleurs sections miroir
  const sectionColors = [
    { bg: 'from-purple-900/10 to-indigo-900/10', accent: 'purple-400', glow: 'purple-500/20' },
    { bg: 'from-indigo-900/10 to-violet-900/10', accent: 'indigo-400', glow: 'indigo-500/20' },
    { bg: 'from-violet-900/10 to-purple-900/10', accent: 'violet-400', glow: 'violet-500/20' },
    { bg: 'from-rose-900/10 to-pink-900/10', accent: 'rose-400', glow: 'rose-500/20' },
  ];

  // Combiner et filtrer tous les profils selon le statut sélectionné
  const allProfiles: EnhancedProfile[] = useMemo(() => {
    const profileMap = new Map<string, EnhancedProfile>();
    
    // Base profiles selon le filtre de statut
    if (filters.profile_status === 'all' || filters.profile_status === 'new') {
      discoveryProfiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }
    
    if (filters.profile_status === 'all' || filters.profile_status === 'accepted') {
      acceptedConnections.forEach(connection => {
        const existingProfile = profileMap.get(connection.id);
        
        if (existingProfile) {
          const mergedProfile: AcceptedConnection = {
            ...connection,
            photos: existingProfile.photos.length > 0 ? existingProfile.photos : connection.photos,
            questionnaire_snippet: connection.questionnaire_snippet || ('questionnaire_snippet' in existingProfile ? existingProfile.questionnaire_snippet : null)
          };
          profileMap.set(connection.id, mergedProfile);
        } else {
          profileMap.set(connection.id, connection);
        }
      });
    }
    
    if (filters.profile_status === 'pending') {
      // Filtrer seulement les profils avec statut pending
      discoveryProfiles
        .filter(p => p.interaction_status?.mirror_request_status === 'pending')
        .forEach(profile => {
          profileMap.set(profile.id, profile);
        });
    }
    
    return Array.from(profileMap.values());
  }, [discoveryProfiles, acceptedConnections, filters.profile_status]);

  // Redirect if no user
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // Block body scroll when modal is open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedIndex]);

  // Load accepted connections (même logique)
  const loadAcceptedConnections = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔗 Chargement des connexions acceptées...');

      const { data: acceptedRequests, error: requestsError } = await supabase
        .from('mirror_requests')
        .select('receiver_id, created_at, responded_at')
        .eq('sender_id', user.id)
        .eq('status', 'accepted')
        .order('responded_at', { ascending: false });

      if (requestsError) {
        console.error('Erreur mirror_requests:', requestsError);
        return;
      }

      if (!acceptedRequests || acceptedRequests.length === 0) {
        console.log('🔭 Aucune connexion acceptée');
        setAcceptedConnections([]);
        return;
      }

      const receiverIds = acceptedRequests.map(req => req.receiver_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, city, bio, gender, birth_date')
        .in('id', receiverIds);

      if (profilesError) {
        console.error('Erreur profiles:', profilesError);
        return;
      }

      const { data: photos, error: photosError } = await supabase
        .from('profile_photos')
        .select('id, photo_url, is_main, photo_order, user_id')
        .in('user_id', receiverIds);

      if (photosError) {
        console.warn('⚠️ Erreur photos:', photosError);
      }

      const { data: questionnaires, error: questionnaireError } = await supabase
        .from('questionnaire_responses')
        .select('user_id, profile_json, generated_profile, created_at')
        .in('user_id', receiverIds)
        .order('created_at', { ascending: false });

      if (questionnaireError) {
        console.warn('⚠️ Erreur questionnaires:', questionnaireError);
      }

      const connectionsData: AcceptedConnection[] = profiles.map(profile => {
        const request = acceptedRequests.find(req => req.receiver_id === profile.id);
        const userQuestionnaires = questionnaires?.filter(q => q.user_id === profile.id) || [];
        const questionnaire = userQuestionnaires.length > 0 ? userQuestionnaires[0] : null;
        const profilePhotos = photos?.filter(photo => photo.user_id === profile.id) || [];
        
        let finalProfileJson = questionnaire?.profile_json;
        
        const isProfileJsonEmpty = !finalProfileJson || 
          (typeof finalProfileJson === 'object' && Object.keys(finalProfileJson).length === 0);
        
        if (isProfileJsonEmpty && questionnaire?.generated_profile) {
          finalProfileJson = extractJsonFromText(questionnaire.generated_profile);
        }
        
        let age = null;
        if (profile.birth_date) {
          const birthDate = new Date(profile.birth_date);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        return {
          id: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          city: profile.city,
          bio: profile.bio,
          age: age,
          gender: profile.gender,
          photos: profilePhotos,
          questionnaire_snippet: finalProfileJson,
          connected_at: request?.responded_at || request?.created_at || new Date().toISOString(),
          status: 'accepted' as const
        };
      });

      console.log('✅ Connexions acceptées chargées:', connectionsData.length);
      setAcceptedConnections(connectionsData);

    } catch (err: any) {
      console.error('❌ Erreur chargement connexions acceptées:', err);
    }
  }, [user]);

  // Load discovery profiles (existing logic)
  const loadDiscoveryProfiles = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await discoveryService.getDiscoveryProfiles({ ...filters, offset: 0 });
      if (ac.signal.aborted) return;
      
      setDiscoveryProfiles(res.profiles);
      setHasMore(res.has_more);
    } catch (e: any) {
      if (!ac.signal.aborted) setError(e?.message ?? "Erreur de chargement");
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [filters]);

  // Load more discovery profiles
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await discoveryService.getDiscoveryProfiles({ ...filters, offset: discoveryProfiles.length });
      setDiscoveryProfiles((prev) => [...prev, ...res.profiles]);
      setHasMore(res.has_more);
    } catch (e) {
      // silent; user can tap refresh
    } finally {
      setLoadingMore(false);
    }
  }, [filters, discoveryProfiles.length, hasMore, loadingMore]);

  // Load initial data
  useEffect(() => { 
    if (user) {
      loadDiscoveryProfiles();
      loadAcceptedConnections();
    }
  }, [user, loadDiscoveryProfiles, loadAcceptedConnections]);

  // 🆕 CHARGER LES STATUTS DE CONTACT POUR CHAQUE PROFIL
  const loadContactStatuses = useCallback(async () => {
    if (!user || allProfiles.length === 0) return;

    try {
      const profileIds = allProfiles.map(p => p.id);
      const newContactRequests = new Map<string, ContactRequestState>();

      // Vérifier les demandes de contact existantes
      const { data: existingRequests, error } = await supabase
        .from('contact_requests')
        .select('receiver_id, status')
        .eq('sender_id', user.id)
        .in('receiver_id', profileIds);

      if (error) {
        console.warn('⚠️ Erreur chargement contact statuses:', error);
      }

      // Initialiser les statuts pour chaque profil
      for (const profile of allProfiles) {
        const existingRequest = existingRequests?.find(req => req.receiver_id === profile.id);
        
        let status: ContactRequestState['status'] = 'idle';
        let canRequest = true;

        if ('status' in profile && profile.status === 'accepted') {
          status = 'accepted';
          canRequest = false;
        } else if (existingRequest) {
          if (existingRequest.status === 'accepted') {
            status = 'accepted';
            canRequest = false;
          } else if (existingRequest.status === 'pending') {
            status = 'requested';
            canRequest = false;
          }
        }

        newContactRequests.set(profile.id, { status, canRequest });
      }

      setContactRequests(newContactRequests);
      console.log('✅ Contact statuses chargés:', newContactRequests.size);

    } catch (err) {
      console.error('❌ Erreur chargement contact statuses:', err);
    }
  }, [user, allProfiles]);

  // Charger les statuts de contact quand les profils changent
  useEffect(() => {
    loadContactStatuses();
  }, [loadContactStatuses]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: "300px" });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  // Selected profile
  const selectedProfile: EnhancedProfile | null = useMemo(
    () => (selectedIndex == null ? null : allProfiles[selectedIndex] ?? null),
    [selectedIndex, allProfiles]
  );

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selectedIndex == null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowRight" && selectedIndex < allProfiles.length - 1) setSelectedIndex((i) => (i == null ? null : i + 1));
      if (e.key === "ArrowLeft" && selectedIndex > 0) setSelectedIndex((i) => (i == null ? null : i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex, allProfiles.length]);

  // 📖 CHARGER LE MIROIR POUR LES PROFILS ACCEPTÉS
  const loadMirrorData = useCallback(async (profileId: string) => {
    try {
      setLoadingMirror(true);
      
      console.log('📖 Chargement miroir pour:', profileId);

      const { data: questionnaireData, error: questionnaireError } = await supabase
        .from('questionnaire_responses')
        .select('generated_profile, profile_json, user_id')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaireError) {
        throw new Error(questionnaireError.code === 'PGRST116'
          ? 'Ce profil n\'a pas encore complété son questionnaire.'
          : 'Erreur lors de la récupération du questionnaire.');
      }

      let finalProfileJson = questionnaireData.profile_json;
      
      if (!finalProfileJson || Object.keys(finalProfileJson).length === 0) {
        console.log('📱 Mode simplifié détecté, extraction JSON du texte...');
        finalProfileJson = extractJsonFromText(questionnaireData.generated_profile);
      }

      setMirrorData({
        generated_profile: questionnaireData.generated_profile || '',
        profile_json: finalProfileJson || {}
      });

      console.log('✅ Miroir chargé avec succès');

    } catch (err: any) {
      console.error('❌ Erreur chargement miroir:', err);
      setMirrorData(null);
    } finally {
      setLoadingMirror(false);
    }
  }, []);

  // Charger le miroir quand on ouvre un profil accepté
  useEffect(() => {
    if (selectedProfile && 'status' in selectedProfile && selectedProfile.status === 'accepted') {
      loadMirrorData(selectedProfile.id);
    } else {
      setMirrorData(null);
    }
  }, [selectedProfile, loadMirrorData]);

  // 🆕 GESTION DES CONTACT REQUESTS
  const handleContactRequest = useCallback(async (profileId: string) => {
    const currentState = contactRequests.get(profileId);
    
    if (!currentState?.canRequest || currentState.status !== 'idle') {
      console.log('🚫 Cannot request contact:', currentState);
      return;
    }

    try {
      // Mettre à jour l'état immédiatement
      setContactRequests(prev => new Map(prev.set(profileId, { 
        status: 'requesting', 
        canRequest: false 
      })));

      console.log('💬 Demande de contact pour:', profileId);
      
      const result = await contactService.requestContact(profileId);

      if (result.success) {
        setContactRequests(prev => new Map(prev.set(profileId, { 
          status: 'requested', 
          canRequest: false 
        })));
        console.log('✅ Contact request envoyé');
        showToast('Demande envoyée ! 💬', 'success');
      } else {
        throw new Error(result.message || 'Erreur lors de l\'envoi');
      }

    } catch (error: any) {
      console.error('❌ Erreur contact request:', error);
      
      // Revenir à l'état initial en cas d'erreur
      setContactRequests(prev => new Map(prev.set(profileId, { 
        status: 'idle', 
        canRequest: true 
      })));
      
      showToast(error.message || 'Erreur lors de l\'envoi', 'error');
    }
  }, [contactRequests]);

  // 💬 CRÉATION ET REDIRECTION VERS CHAT
  const createConversation = useCallback(async (profileId: string) => {
    try {
      console.log('💬 Création conversation avec:', profileId);
      
      // Vérifier si une conversation existe déjà entre les deux utilisateurs
      const { data: existingConversations, error: searchError } = await supabase
        .from('conversations')
        .select('id, participants')
        .or(`participants.cs.{${user.id},participants.cs.{${profileId}}`);

      if (searchError) {
        console.warn('⚠️ Erreur recherche conversation:', searchError);
      }

      // Filtrer pour trouver une conversation directe entre les deux utilisateurs
      const existingConversation = existingConversations?.find(conv => 
        conv.participants.length === 2 && 
        conv.participants.includes(user.id) && 
        conv.participants.includes(profileId)
      );

      if (existingConversation) {
        console.log('✅ Conversation existante trouvée:', existingConversation.id);
        navigate(`/chat/${existingConversation.id}`);
        return;
      }

      // Créer nouvelle conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          participants: [user.id, profileId],
          type: 'direct'
        })
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      console.log('✅ Nouvelle conversation créée:', newConversation.id);
      navigate(`/chat/${newConversation.id}`);

    } catch (error: any) {
      console.error('❌ Erreur création conversation:', error);
      
      // Fallback : utiliser un ID de conversation basé sur les deux user IDs
      const conversationId = [user.id, profileId].sort().join('_');
      console.log('🔄 Fallback vers conversation ID:', conversationId);
      navigate(`/chat/${conversationId}`);
    }
  }, [user, navigate]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const bgColor = type === 'success' 
      ? 'rgba(16, 185, 129, 0.9)' 
      : 'rgba(239, 68, 68, 0.9)';

    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed; top: 32px; right: 32px;
        background: ${bgColor}; backdrop-filter: blur(12px);
        color: white; padding: 12px 20px; border-radius: 8px;
        font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
        z-index: 9999; opacity: 0; transform: translateY(-10px);
        transition: all 0.3s ease;
      ">
        ${message}
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.firstElementChild!.style.opacity = '1';
      toast.firstElementChild!.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.firstElementChild!.style.opacity = '0';
      toast.firstElementChild!.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // toCardProps
  const toCardProps = useCallback((p: EnhancedProfile) => {
    const profile = { 
      id: p.id, 
      name: p.name, 
      bio: p.bio, 
      city: p.city, 
      avatar_url: p.avatar_url 
    };
    
    let questionnaireData = null;
    
    if ('questionnaire_snippet' in p && p.questionnaire_snippet) {
      questionnaireData = p.questionnaire_snippet;
    } else if ('questionnaire' in p && p.questionnaire) {
      questionnaireData = p.questionnaire;
    } else if ('profile_json' in p && p.profile_json) {
      questionnaireData = p.profile_json;
    }
    
    const questionnaire = {
      answers: { 
        age: p.age || ('age' in p ? p.age : undefined), 
        gender: p.gender || ('gender' in p ? p.gender : undefined)
      },
      profile_json: questionnaireData
    };
    
    const photos = (p.photos ?? []).map((ph: any, i: number) => ({
      id: ph.id ?? `photo_${i}`,
      photo_url: ph.photo_url ?? ph.url,
      is_main: ph.is_main ?? i === 0,
      photo_order: ph.photo_order ?? i,
    }));
    
    return { profile, questionnaire, photos };
  }, []);

  // Actions
  const requestMirror = useCallback(async (p: DiscoveryProfile) => {
    setDiscoveryProfiles((prev) => prev.map((x) => x.id === p.id
      ? { ...x, interaction_status: { ...x.interaction_status, mirror_request_status: "pending", can_request_mirror: false } }
      : x
    ));
    try {
      const res = await discoveryService.requestMirrorAccess(p.id);
      if (!res?.success) throw new Error(res?.message || "Échec de la demande");
    } catch (e) {
      setDiscoveryProfiles((prev) => prev.map((x) => x.id === p.id
        ? { ...x, interaction_status: { ...x.interaction_status, mirror_request_status: undefined, can_request_mirror: true } }
        : x
      ));
    }
  }, []);

  const viewMirror = useCallback((p: EnhancedProfile) => {
    navigate(`/miroir/${p.id}`);
  }, [navigate]);

  // Analyses du miroir
  const getAnalysisSections = (profileJson: any) => {
    const sections = [
      { key: 'strength_signals', title: 'Forces Dominantes', icon: Star, color: 'text-amber-500' },
      { key: 'weakness_signals', title: 'Zones Sensibles', icon: CloudRain, color: 'text-slate-400' },
      { key: 'unconscious_patterns', title: 'Patterns Inconscients', icon: Brain, color: 'text-purple-500' },
      { key: 'ideal_partner_traits', title: 'Partenaire Idéal', icon: Heart, color: 'text-rose-500' },
      { key: 'relationnal_risks', title: 'Risques Relationnels', icon: Target, color: 'text-orange-500' }
    ];

    return sections
      .map(section => ({
        ...section,
        data: profileJson[section.key]
      }))
      .filter(section => section.data && (Array.isArray(section.data) ? section.data.length > 0 : true));
  };

  // UI helpers
  function MirrorBadge({ p }: { p: EnhancedProfile }) {
    const s = getMirrorState(p);
    const Icon = s.icon;
    const colors = {
      green: "bg-emerald-500 shadow-emerald-500/30",
      purple: "bg-purple-500 shadow-purple-500/30", 
      yellow: "bg-amber-500 shadow-amber-500/30",
      red: "bg-red-500 shadow-red-500/30",
      blue: "bg-blue-500 shadow-blue-500/30"
    };
    
    return (
      <div className={`absolute top-6 right-6 w-8 h-8 rounded-full ${colors[s.color]} flex items-center justify-center shadow-lg animate-pulse z-30`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    );
  }

  function StatusBadge({ p }: { p: EnhancedProfile }) {
    // Badge pour connexions acceptées
    if ('status' in p && p.status === 'accepted') {
      return (
        <div className="absolute top-4 left-4 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full z-30 animate-pulse">
          CONNEXION
        </div>
      );
    }
    
    // Badge pour demandes de contact
    const contactState = contactRequests.get(p.id);
    if (contactState?.status === 'requested') {
      return (
        <div className="absolute top-4 left-4 px-2 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full z-30">
          DEMANDÉ
        </div>
      );
    }
    
    // Badge pour accès miroir en attente
    const s = getMirrorState(p);
    if (s.key === 'pending') {
      return (
        <div className="absolute top-4 left-4 px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold rounded-full z-30">
          EN ATTENTE
        </div>
      );
    }
    
    return null;
  }

  function CompatibilityBadge({ score }: { score?: number }) {
    if (!score) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); setShowCompatibilityInfo(true); }}
          className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform z-30 border-2 border-white/30"
        >
          <span className="text-white font-bold">?</span>
        </button>
      );
    }
    
    return (
      <div 
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-xl border-2 border-white/30 z-30"
      >
        <span className="text-white font-bold text-sm">{score}%</span>
      </div>
    );
  }

  function GridCard({ p, idx }: { p: EnhancedProfile; idx: number }) {
    const cardProps = toCardProps(p);
    
    return (
      <div
        className="group relative cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1"
        onClick={() => { setSelectedIndex(idx); }}
      >
        <MirrorBadge p={p} />
        <StatusBadge p={p} />
        <CompatibilityBadge />
        <AffiniaCard {...cardProps} className="w-full" />
      </div>
    );
  }

  // Enhanced styles
  const css = `
    .affinia-modal { 
      position: fixed; 
      inset: 0; 
      z-index: 9999; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 2rem; 
      background: rgba(0,0,0,0.95); 
      backdrop-filter: blur(20px);
      animation: modalIn 0.3s ease-out;
    }
    
    @keyframes modalIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .modal-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      animation: cardIn 0.4s ease-out;
    }
    
    @keyframes cardIn {
      from { transform: scale(0.9) translateY(20px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }

    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.6); border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168, 85, 247, 0.8); }
  `;

  if (!user) return null;

  return (
    <div className={`min-h-screen ${design.getBgClasses("primary")} relative pt-20`}>
      <style>{css}</style>
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />

      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-md">
              <p className="text-red-300 font-medium mb-4">{error}</p>
              <button onClick={loadDiscoveryProfiles} className="px-6 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">
                Réessayer
              </button>
            </div>
          </div>
        ) : loading && allProfiles.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-80 h-[500px] rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 justify-items-center">
              {allProfiles.map((p, i) => (
                <GridCard key={p.id} p={p} idx={i} />
              ))}
            </div>
            <div ref={sentinelRef} className="h-16 flex items-center justify-center">
              {loadingMore && <Loader className="w-5 h-5 animate-spin text-purple-300" />}
              {!hasMore && allProfiles.length > 0 && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 rounded-2xl text-purple-300">
                    <Sparkles className="w-5 h-5" />
                    <span>Tu as exploré tous les profils disponibles ✨</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Enhanced floating actions */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-30">
        <button 
          onClick={() => setFiltersOpen(!filtersOpen)} 
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform border-2 border-white/20 backdrop-blur-sm"
        >
          <Filter className="w-7 h-7 text-white" />
        </button>
        <button 
          onClick={() => {
            loadDiscoveryProfiles();
            loadAcceptedConnections();
          }} 
          disabled={loading} 
          className="w-16 h-16 rounded-full bg-slate-800/80 backdrop-blur-sm border-2 border-purple-400/30 flex items-center justify-center shadow-xl hover:scale-110 transition-transform disabled:opacity-50 hover:bg-slate-700/80"
        >
          <RefreshCw className={`w-7 h-7 text-white ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 🔄 MODAL ADAPTATIF SELON LE TYPE DE PROFIL */}
      {selectedProfile && (
        <div className="affinia-modal" onClick={() => setSelectedIndex(null)}>
          {/* Close button */}
          <button 
            onClick={() => setSelectedIndex(null)} 
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Navigation controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedIndex((i) => (i == null ? i : Math.max(0, i - 1))); }} 
              disabled={selectedIndex === 0}
              className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-colors hover:bg-black/80"
            >
              <ChevronLeft className="w-5 h-5" />
              Précédent
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedIndex((i) => (i == null ? i : Math.min(allProfiles.length - 1, i + 1))); }} 
              disabled={selectedIndex === allProfiles.length - 1 && !hasMore}
              className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-colors hover:bg-black/80"
            >
              Suivant
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 🔄 CONTENU MODAL ADAPTATIF */}
          {'status' in selectedProfile && selectedProfile.status === 'accepted' ? (
            // 📖 MODAL 2 COLONNES pour profils acceptés
            <div className="modal-content w-full max-w-7xl h-full max-h-[90vh] flex gap-6 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Colonne gauche - Miroir */}
              <div className="flex-1 w-[70%] overflow-y-auto custom-scrollbar bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl">
                <div className="p-6 space-y-6">
                  {loadingMirror ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Loader className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
                        <p className="text-white">Chargement du miroir...</p>
                      </div>
                    </div>
                  ) : mirrorData ? (
                    <>
                      {/* Header du miroir */}
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">
                            Miroir de {selectedProfile.name}
                          </h2>
                          <p className="text-gray-400 text-sm">
                            Analyse psychologique complète
                          </p>
                        </div>
                      </div>

                      {/* Révélations avec découpage intelligent */}
                      {mirrorData.generated_profile && (
                        <section className="space-y-6">
                          <h3 className="text-white font-bold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            Révélations
                          </h3>
                          
                          {smartSplitParagraphs(parseEmotionalText(mirrorData.generated_profile)).map((paragraph, index) => {
                            const colorScheme = sectionColors[index % sectionColors.length];

                            return (
                              <div
                                key={index}
                                className={`
                                  relative border border-white/10 rounded-2xl p-6
                                  bg-gradient-to-br ${colorScheme.bg}
                                  transition-all duration-300 hover:border-purple-400/20
                                  group
                                `}
                              >
                                <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r from-${colorScheme.accent} to-pink-400 flex items-center justify-center`}>
                                      <span className="text-xs font-mono text-white">
                                        {String(index + 1).padStart(2, '0')}
                                      </span>
                                    </div>
                                  </div>
                                  <Sparkles className={`w-3 h-3 text-${colorScheme.accent}/60`} />
                                </div>

                                <div className="relative">
                                  <div className="text-sm leading-relaxed text-white pl-4">
                                    <span className="float-left text-4xl leading-none pr-2 font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                      {paragraph.charAt(0)}
                                    </span>
                                    <span>{paragraph.slice(1)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </section>
                      )}

                      {/* Analyses détaillées */}
                      {mirrorData.profile_json && (
                        <section className="space-y-4">
                          <h3 className="text-white font-bold flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" />
                            Analyses Détaillées
                          </h3>
                          
                          {getAnalysisSections(mirrorData.profile_json).map((section) => (
                            <div key={section.key} className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="flex items-center gap-2 mb-3">
                                <section.icon className={`w-4 h-4 ${section.color}`} />
                                <span className="text-white font-medium">{section.title}</span>
                              </div>
                              <div className="space-y-2">
                                {Array.isArray(section.data) ? (
                                  section.data.map((item, idx) => (
                                    <div key={idx} className="bg-white/5 rounded-lg p-2">
                                      <span className="text-gray-300 text-sm">
                                        {typeof item === 'string' ? item : JSON.stringify(item)}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="bg-white/5 rounded-lg p-2">
                                    <span className="text-gray-300 text-sm">
                                      {typeof section.data === 'string' ? section.data : JSON.stringify(section.data)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </section>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-white mb-2">Miroir non disponible</p>
                        <p className="text-gray-400 text-sm">Les données du miroir n'ont pas pu être chargées</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 🎯 Colonne droite - Carte + Bouton conversation */}
              <div className="w-[30%] flex-shrink-0 flex flex-col">
                <div className="flex-1">
                  <AffiniaCard {...toCardProps(selectedProfile)} className="w-full scale-90" />
                </div>
                
                {/* 💬 BOUTON CONVERSATION SOUS LA CARTE */}
                <div className="mt-4 px-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); createConversation(selectedProfile.id); }} 
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold flex items-center justify-center gap-3 hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/30 transform hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Démarrer une conversation
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // 📲 MODAL SIMPLE pour autres profils avec contact request
            <div className="modal-content relative" onClick={(e) => e.stopPropagation()}>
              {/* Badge compatibilité dans le modal */}
              <button 
                onClick={(e) => { e.stopPropagation(); setShowCompatibilityInfo(true); }}
                className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform z-40 border-2 border-white/30"
              >
                <span className="text-white font-bold">?</span>
              </button>
              
              <AffiniaCard {...toCardProps(selectedProfile)} className="w-full" />
              
              {/* Actions au centre */}
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-4">
                {(() => {
                  const contactState = contactRequests.get(selectedProfile.id);
                  const mirrorState = getMirrorState(selectedProfile);
                  
                  // Si c'est une connexion acceptée
                  if (contactState?.status === 'accepted') {
                    return (
                      <button 
                        onClick={(e) => { e.stopPropagation(); createConversation(selectedProfile.id); }} 
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold flex items-center gap-3 hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/30 transform hover:scale-105"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Démarrer une conversation
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    );
                  }
                  
                  // Bouton demande de contact selon l'état
                  let contactButton;
                  if (contactState?.status === 'requesting') {
                    contactButton = (
                      <div className="px-6 py-3 rounded-2xl bg-blue-500/20 border-2 border-blue-400/40 text-center text-blue-200 font-semibold flex items-center gap-2 animate-pulse">
                        <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                        Envoi en cours...
                      </div>
                    );
                  } else if (contactState?.status === 'requested') {
                    contactButton = (
                      <div className="px-6 py-3 rounded-2xl bg-green-500/20 border-2 border-green-400/40 text-center text-green-200 font-semibold flex items-center gap-2 animate-pulse">
                        <Heart className="w-5 h-5" />
                        Demande envoyée ✨
                      </div>
                    );
                  } else if (contactState?.canRequest) {
                    contactButton = (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleContactRequest(selectedProfile.id); }} 
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold flex items-center gap-3 hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-pink-500/30 transform hover:scale-105"
                      >
                        <Heart className="w-5 h-5" />
                        Demander un contact
                      </button>
                    );
                  }
                  
                  // Bouton miroir selon l'état
                  let mirrorButton;
                  if (mirrorState.key === "public" || mirrorState.key === "accepted") {
                    mirrorButton = (
                      <button 
                        onClick={(e) => { e.stopPropagation(); viewMirror(selectedProfile); }} 
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold flex items-center gap-3 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-purple-500/30 transform hover:scale-105"
                      >
                        <Sparkles className="w-5 h-5" />
                        {mirrorState.actionLabel}
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    );
                  } else if (mirrorState.key === "pending") {
                    mirrorButton = (
                      <div className="px-6 py-3 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 text-center text-amber-200 font-semibold flex items-center gap-2 animate-pulse">
                        <Clock className="w-5 h-5" />
                        Demande en attente...
                      </div>
                    );
                  } else if (mirrorState.key === "rejected") {
                    mirrorButton = (
                      <div className="px-6 py-3 rounded-2xl bg-red-500/20 border-2 border-red-400/40 text-center text-red-200 font-semibold flex items-center gap-2">
                        <X className="w-5 h-5" />
                        Accès non accordé
                      </div>
                    );
                  } else {
                    mirrorButton = (
                      <button 
                        onClick={(e) => { e.stopPropagation(); requestMirror(selectedProfile as DiscoveryProfile); }} 
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold flex items-center gap-3 hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 border border-cyan-400/30"
                      >
                        <Lock className="w-5 h-5" />
                        Demander l'accès au miroir
                      </button>
                    );
                  }
                  
                  return (
                    <>
                      {contactButton}
                      {mirrorButton}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Info modal */}
          {showCompatibilityInfo && (
            <div className="absolute top-6 left-6 max-w-md bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 z-50">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">🧠 Analyses Psychologiques</h4>
                  <p className="text-purple-200 text-sm leading-relaxed mb-3">
                    Ces profils contiennent de vraies analyses psychologiques complètes ! Mais le système de <strong>compatibilité automatique</strong> n'est pas encore activé.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowCompatibilityInfo(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all transform hover:scale-105"
              >
                C'est déjà génial ! 🚀
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🎯 FILTRES AMÉLIORÉS avec statut de profil */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="relative w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Personnaliser la recherche</h3>
              <button 
                onClick={() => setFiltersOpen(false)} 
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 🎯 NOUVEAU : Filtre par statut de profil */}
            <div className="mb-6">
              <label className="block mb-3">
                <span className="text-white font-medium block mb-3">Type de profil</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'all', label: 'Tous', icon: '🌍', count: allProfiles.length },
                    { value: 'new', label: 'Nouveaux', icon: '✨', count: discoveryProfiles.filter(p => !p.interaction_status?.mirror_request_status && !contactRequests.get(p.id)?.status).length },
                    { value: 'pending', label: 'En attente', icon: '⏳', count: discoveryProfiles.filter(p => p.interaction_status?.mirror_request_status === 'pending' || contactRequests.get(p.id)?.status === 'requested').length },
                    { value: 'accepted', label: 'Connexions', icon: '💚', count: acceptedConnections.length },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters(f => ({ ...f, profile_status: option.value as ProfileStatusFilter }))}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        filters.profile_status === option.value
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs opacity-75">{option.count} profils</div>
                    </button>
                  ))}
                </div>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-white font-medium mb-2 block">Âge minimum</span>
                  <input 
                    type="number" 
                    min={18} 
                    max={99} 
                    value={filters.min_age ?? 18} 
                    onChange={(e) => setFilters((f) => ({...f, min_age: parseInt(e.target.value || "18")}))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-purple-400 focus:outline-none transition-colors"
                  />
                </label>
                
                <label className="block">
                  <span className="text-white font-medium mb-2 block">Âge maximum</span>
                  <input 
                    type="number" 
                    min={18} 
                    max={99} 
                    value={filters.max_age ?? 99} 
                    onChange={(e) => setFilters((f) => ({...f, max_age: parseInt(e.target.value || "99")}))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-purple-400 focus:outline-none transition-colors"
                  />
                </label>
              </div>
              
              <div className="space-y-4">
                <label className="block">
                  <span className="text-white font-medium mb-2 block">Distance maximum: {filters.max_distance_km ?? 50} km</span>
                  <input 
                    type="range" 
                    min={1} 
                    max={100} 
                    value={filters.max_distance_km ?? 50} 
                    onChange={(e) => setFilters((f) => ({...f, max_distance_km: parseInt(e.target.value)}))}
                    className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </label>
                
                <label className="block">
                  <span className="text-white font-medium mb-2 block">Genre</span>
                  <select 
                    value={filters.gender ?? "all"} 
                    onChange={(e) => setFilters((f) => ({...f, gender: e.target.value as any}))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-purple-400 focus:outline-none transition-colors"
                  >
                    <option value="all">Tous</option>
                    <option value="male">Hommes</option>
                    <option value="female">Femmes</option>
                    <option value="other">Autres</option>
                  </select>
                </label>
                
                <label className="block">
                  <span className="text-white font-medium mb-2 block">Trier par</span>
                  <select 
                    value={filters.sort_by ?? "distance"} 
                    onChange={(e) => setFilters((f) => ({...f, sort_by: e.target.value as any}))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-purple-400 focus:outline-none transition-colors"
                  >
                    <option value="distance">Distance</option>
                    <option value="age">Âge</option>
                    <option value="newest">Plus récents</option>
                    <option value="random">Aléatoire</option>
                  </select>
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => {
                  setFilters(defaultFilters);
                  setFiltersOpen(false);
                }}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Réinitialiser
              </button>
              <button 
                onClick={() => setFiltersOpen(false)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscoveryPage;