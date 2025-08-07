-- 🔧 CORRECTION DATABASE AFFINIA
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'utilisateur existant
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = '62e41e07-5f92-486a-b768-5c271b7f87b9';

-- 2. Créer le profil manuellement (TRIGGER DÉFAILLANT)
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    xp,
    level,
    credits,
    mirror_visibility,
    max_distance,
    relationship_type,
    interested_in_genders,
    min_age,
    max_age,
    show_me_on_affinia,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.user_metadata->>'name', u.user_metadata->>'full_name', split_part(u.email, '@', 1)) as full_name,
    u.user_metadata->>'avatar_url' as avatar_url,
    0 as xp,
    1 as level,
    1000 as credits,
    'on_request' as mirror_visibility,
    50 as max_distance,
    '["serious"]'::jsonb as relationship_type,
    '["all"]'::jsonb as interested_in_genders,
    18 as min_age,
    35 as max_age,
    true as show_me_on_affinia,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
WHERE u.id = '62e41e07-5f92-486a-b768-5c271b7f87b9'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 3. Assigner les quêtes niveau 1 (TRIGGER DÉFAILLANT)
INSERT INTO public.user_quests (user_id, quest_id, created_at)
SELECT 
    '62e41e07-5f92-486a-b768-5c271b7f87b9' as user_id,
    q.id as quest_id,
    NOW() as created_at
FROM public.quests q
WHERE q.is_active = true 
  AND q.required_level <= 1
  AND NOT EXISTS (
      SELECT 1 FROM public.user_quests uq 
      WHERE uq.user_id = '62e41e07-5f92-486a-b768-5c271b7f87b9' 
        AND uq.quest_id = q.id
  );

-- 4. Vérifier les corrections
SELECT 'PROFIL CRÉÉ' as status, * FROM public.profiles WHERE id = '62e41e07-5f92-486a-b768-5c271b7f87b9';
SELECT 'QUÊTES ASSIGNÉES' as status, COUNT(*) as total FROM public.user_quests WHERE user_id = '62e41e07-5f92-486a-b768-5c271b7f87b9';
