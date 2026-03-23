import crypto from 'crypto';
import OpenAI from 'openai';
import { calculateDistance } from '@/lib/geolocation';
import { createAdminClient } from '@/lib/supabase/admin';
import type { DiscoverFilters, SupabaseProfile } from '@/lib/supabase/dating';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface UserEmbeddingRow {
  user_id: string;
  profile_hash: string;
  embedding: number[];
}

interface CandidateProfile extends SupabaseProfile {
  distance?: number;
}

interface SwipeRow {
  to_user_id: string;
}

interface MatchRow {
  user1_id: string;
  user2_id: string;
}

interface BlockRow {
  blocker_id: string;
  blocked_id: string;
}

interface ScoredCandidate {
  profile: CandidateProfile;
  distance: number | undefined;
  score: number;
}

export async function getAiRecommendedProfiles(params: {
  currentUser: SupabaseProfile;
  filters?: DiscoverFilters;
  limit?: number;
}) {
  const { currentUser, filters, limit = 20 } = params;
  const admin = createAdminClient();

  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for AI matching in Supabase mode');
  }

  const [swipesResult, matchesResult, profilesResult, blocksResult] = await Promise.all([
    admin
      .from('swipes')
      .select('to_user_id')
      .eq('from_user_id', currentUser.id),
    admin
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
      .eq('is_active', true),
    admin
      .from('profiles')
      .select(
        'id, email, name, age, gender, gender_preference, bio, avatar_url, interests, latitude, longitude'
      ),
    admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${currentUser.id},blocked_id.eq.${currentUser.id}`),
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

  if (blocksResult.error) {
    throw blocksResult.error;
  }

  const swipedIds = new Set(
    ((swipesResult.data || []) as SwipeRow[]).map((item) => item.to_user_id)
  );
  const matchedIds = new Set(
    ((matchesResult.data || []) as MatchRow[]).map((match) =>
      match.user1_id === currentUser.id ? match.user2_id : match.user1_id
    )
  );
  const blockedIds = new Set(
    ((blocksResult.data || []) as BlockRow[]).map((block) =>
      block.blocker_id === currentUser.id ? block.blocked_id : block.blocker_id
    )
  );

  const filteredCandidates = ((profilesResult.data || []) as SupabaseProfile[])
    .filter((profile) => profile.id !== currentUser.id)
    .filter((profile) => !swipedIds.has(profile.id))
    .filter((profile) => !matchedIds.has(profile.id))
    .filter((profile) => !blockedIds.has(profile.id))
    .filter((profile) => isWithinAgeRange(profile, filters))
    .filter((profile) => matchesGenderPreferences(currentUser, profile))
    .map((profile) => ({
      ...profile,
      distance: getDistance(currentUser, profile),
    }))
    .filter((profile) => {
      if (!filters?.maxDistance) {
        return true;
      }

      if (typeof profile.distance !== 'number') {
        return false;
      }

      return profile.distance <= filters.maxDistance;
    })
    .slice(0, 80) as CandidateProfile[];

  if (filteredCandidates.length === 0) {
    return [];
  }

  const embeddings = await ensureEmbeddings([currentUser, ...filteredCandidates]);
  const currentUserEmbedding = embeddings.get(currentUser.id);

  if (!currentUserEmbedding) {
    throw new Error('Current user embedding was not generated');
  }

  const scoredCandidates = await Promise.all(
    filteredCandidates.map(async (candidate) => {
      const candidateEmbedding = embeddings.get(candidate.id);

      if (!candidateEmbedding) {
        return null;
      }

      const similarity = cosineSimilarity(currentUserEmbedding.embedding, candidateEmbedding.embedding);
      const collaborativeScore = await getCollaborativeFilteringScore(currentUser.id, candidate.id);
      const finalScore = similarity * 0.7 + collaborativeScore * 0.3;

      return {
        profile: candidate,
        distance: candidate.distance,
        score: finalScore,
      } satisfies ScoredCandidate;
    })
  );

  return scoredCandidates
    .filter((candidate): candidate is ScoredCandidate => candidate !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((candidate) => ({
      id: candidate.profile.id,
      name: candidate.profile.name || 'Unknown',
      age: candidate.profile.age || 18,
      bio: candidate.profile.bio || '',
      profilePhoto: candidate.profile.avatar_url || '/favicon.svg',
      interests: candidate.profile.interests || [],
      distance: candidate.distance,
      compatibilityScore: Number(candidate.score.toFixed(3)),
      compatibilityReasons: buildCompatibilityReasons(currentUser, candidate.profile),
    }));
}

async function ensureEmbeddings(profiles: SupabaseProfile[]) {
  const admin = createAdminClient();

  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for embeddings');
  }

  const profileHashes = new Map(
    profiles.map((profile) => [profile.id, createProfileHash(profile)])
  );
  const profileIds = profiles.map((profile) => profile.id);

  const { data: existingRows, error } = await admin
    .from('user_embeddings')
    .select('user_id, profile_hash, embedding')
    .in('user_id', profileIds);

  if (error) {
    throw error;
  }

  const existingMap = new Map(
    ((existingRows || []) as Array<{
      user_id: string;
      profile_hash: string;
      embedding: unknown;
    }>).map((row) => [
      row.user_id,
      {
        user_id: row.user_id,
        profile_hash: row.profile_hash,
        embedding: Array.isArray(row.embedding) ? row.embedding.map(Number) : [],
      } satisfies UserEmbeddingRow,
    ])
  );

  const embeddings = new Map<string, UserEmbeddingRow>();
  const staleProfiles: SupabaseProfile[] = [];

  for (const profile of profiles) {
    const currentHash = profileHashes.get(profile.id);
    const existing = existingMap.get(profile.id);

    if (existing && existing.profile_hash === currentHash && existing.embedding.length > 0) {
      embeddings.set(profile.id, existing);
      continue;
    }

    staleProfiles.push(profile);
  }

  if (staleProfiles.length > 0) {
    const generated = await Promise.all(
      staleProfiles.map(async (profile) => {
        const embedding = await generateUserEmbedding(profile);
        const row = {
          user_id: profile.id,
          profile_hash: profileHashes.get(profile.id) || '',
          embedding,
        };

        const { error: upsertError } = await admin
          .from('user_embeddings')
          .upsert(row as never);

        if (upsertError) {
          throw upsertError;
        }

        return row;
      })
    );

    generated.forEach((row) => embeddings.set(row.user_id, row));
  }

  return embeddings;
}

async function generateUserEmbedding(profile: SupabaseProfile): Promise<number[]> {
  const profileText = [
    `Name: ${profile.name || ''}`,
    `Age: ${profile.age || ''}`,
    `Bio: ${profile.bio || ''}`,
    `Interests: ${(profile.interests || []).join(', ')}`,
    `Gender: ${profile.gender || ''}`,
    `Preference: ${profile.gender_preference || ''}`,
  ].join(', ');

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: profileText,
  });

  return response.data[0].embedding;
}

async function getCollaborativeFilteringScore(userId: string, candidateId: string) {
  const admin = createAdminClient();

  if (!admin) {
    return 0.5;
  }

  const { data: currentUserLikes, error: likesError } = await admin
    .from('swipes')
    .select('to_user_id')
    .eq('from_user_id', userId)
    .eq('action', 'like');

  if (likesError) {
    console.error('Collaborative filtering error:', likesError);
    return 0.5;
  }

  const likedIds = ((currentUserLikes || []) as SwipeRow[]).map((like) => like.to_user_id);

  if (likedIds.length === 0) {
    return 0.5;
  }

  const { data: similarUsers, error: similarUsersError } = await admin
    .from('swipes')
    .select('from_user_id')
    .in('to_user_id', likedIds)
    .neq('from_user_id', userId)
    .eq('action', 'like');

  if (similarUsersError) {
    console.error('Collaborative filtering error:', similarUsersError);
    return 0.5;
  }

  const similarUserIds = [
    ...new Set(
      ((similarUsers || []) as Array<{ from_user_id: string }>).map(
        (like) => like.from_user_id
      )
    ),
  ];

  if (similarUserIds.length === 0) {
    return 0.5;
  }

  const { count, error: candidateLikesError } = await admin
    .from('swipes')
    .select('*', { count: 'exact', head: true })
    .in('from_user_id', similarUserIds)
    .eq('to_user_id', candidateId)
    .eq('action', 'like');

  if (candidateLikesError) {
    console.error('Collaborative filtering error:', candidateLikesError);
    return 0.5;
  }

  return (count || 0) / similarUserIds.length;
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  const dotProduct = vecA.reduce((sum, value, index) => sum + value * (vecB[index] || 0), 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, value) => sum + value * value, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

function createProfileHash(profile: SupabaseProfile) {
  const payload = JSON.stringify({
    name: profile.name || '',
    age: profile.age || '',
    bio: profile.bio || '',
    interests: profile.interests || [],
    gender: profile.gender || '',
    genderPreference: profile.gender_preference || '',
  });

  return crypto.createHash('sha256').update(payload).digest('hex');
}

function isWithinAgeRange(profile: SupabaseProfile, filters?: DiscoverFilters) {
  if (filters?.minAge && profile.age !== null && profile.age < filters.minAge) {
    return false;
  }

  if (filters?.maxAge && profile.age !== null && profile.age > filters.maxAge) {
    return false;
  }

  return true;
}

function matchesGenderPreferences(currentUser: SupabaseProfile, profile: SupabaseProfile) {
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
}

function getDistance(currentUser: SupabaseProfile, profile: SupabaseProfile) {
  if (
    typeof currentUser.latitude !== 'number' ||
    typeof currentUser.longitude !== 'number' ||
    typeof profile.latitude !== 'number' ||
    typeof profile.longitude !== 'number'
  ) {
    return undefined;
  }

  return calculateDistance(
    currentUser.latitude,
    currentUser.longitude,
    profile.latitude,
    profile.longitude
  );
}

function buildCompatibilityReasons(
  currentUser: SupabaseProfile,
  candidate: SupabaseProfile
) {
  const currentInterests = new Set(currentUser.interests || []);
  const sharedInterests = (candidate.interests || []).filter((interest) =>
    currentInterests.has(interest)
  );
  const reasons: string[] = [];

  if (sharedInterests.length > 0) {
    reasons.push(`Shared interests: ${sharedInterests.slice(0, 2).join(', ')}`);
  }

  if (
    typeof currentUser.latitude === 'number' &&
    typeof currentUser.longitude === 'number' &&
    typeof candidate.latitude === 'number' &&
    typeof candidate.longitude === 'number'
  ) {
    const distance = calculateDistance(
      currentUser.latitude,
      currentUser.longitude,
      candidate.latitude,
      candidate.longitude
    );

    if (distance <= 25) {
      reasons.push('Close by and easy to meet');
    }
  }

  if (reasons.length === 0) {
    reasons.push('AI picked this profile based on your overall vibe');
  }

  return reasons;
}
