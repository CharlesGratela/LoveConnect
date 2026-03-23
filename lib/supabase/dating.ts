import type { SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { calculateDistance } from '@/lib/geolocation';

export interface SupabaseProfile {
  id: string;
  email: string | null;
  name: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  gender_preference: 'male' | 'female' | 'both' | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DiscoverFilters {
  minAge?: number;
  maxAge?: number;
  maxDistance?: number;
}

export async function getAuthenticatedSupabaseUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

export async function getCurrentUserProfile(
  supabase: SupabaseClient,
  authUser: SupabaseAuthUser
) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, name, age, gender, gender_preference, bio, avatar_url, interests, latitude, longitude'
    )
    .eq('id', authUser.id)
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseProfile;
}

export async function getRecommendedProfiles(params: {
  supabase: SupabaseClient;
  currentUser: SupabaseProfile;
  limit?: number;
  filters?: DiscoverFilters;
}) {
  const { supabase, currentUser, limit = 20, filters } = params;

  const [swipesResult, matchesResult, profilesResult] = await Promise.all([
    supabase
      .from('swipes')
      .select('to_user_id')
      .eq('from_user_id', currentUser.id),
    supabase
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
      .eq('is_active', true),
    supabase
      .from('profiles')
      .select(
        'id, email, name, age, gender, gender_preference, bio, avatar_url, interests, latitude, longitude'
      ),
  ]);

  if (swipesResult.error) {
    throw swipesResult.error;
  }

  if (matchesResult.error) {
    throw matchesResult.error;
  }

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  const swipedIds = new Set((swipesResult.data || []).map((item) => item.to_user_id));
  const matchedIds = new Set(
    (matchesResult.data || []).map((match) =>
      match.user1_id === currentUser.id ? match.user2_id : match.user1_id
    )
  );

  const candidates = (profilesResult.data || [])
    .filter((profile) => profile.id !== currentUser.id)
    .filter((profile) => !swipedIds.has(profile.id))
    .filter((profile) => !matchedIds.has(profile.id))
    .filter((profile) => {
      if (filters?.minAge && profile.age !== null && profile.age < filters.minAge) {
        return false;
      }

      if (filters?.maxAge && profile.age !== null && profile.age > filters.maxAge) {
        return false;
      }

      return true;
    })
    .filter((profile) => {
      if (
        currentUser.gender_preference &&
        currentUser.gender_preference !== 'both' &&
        profile.gender !== currentUser.gender_preference
      ) {
        return false;
      }

      if (!currentUser.gender) {
        return true;
      }

      return (
        profile.gender_preference === 'both' ||
        profile.gender_preference === currentUser.gender
      );
    })
    .map((profile) => {
      let distance: number | undefined;

      if (
        typeof currentUser.latitude === 'number' &&
        typeof currentUser.longitude === 'number' &&
        typeof profile.latitude === 'number' &&
        typeof profile.longitude === 'number'
      ) {
        distance = calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          profile.latitude,
          profile.longitude
        );
      }

      return {
        ...profile,
        distance,
      };
    })
    .filter((profile) => {
      if (!filters?.maxDistance) {
        return true;
      }

      if (typeof profile.distance !== 'number') {
        return false;
      }

      return profile.distance <= filters.maxDistance;
    })
    .sort((a, b) => {
      if (typeof a.distance === 'number' && typeof b.distance === 'number') {
        return a.distance - b.distance;
      }

      return 0;
    })
    .slice(0, limit)
    .map((profile) => ({
      id: profile.id,
      name: profile.name || 'Unknown',
      age: profile.age || 18,
      bio: profile.bio || '',
      profilePhoto: profile.avatar_url || '/favicon.svg',
      interests: profile.interests || [],
      distance: profile.distance,
    }));

  return candidates;
}
