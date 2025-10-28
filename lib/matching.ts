import OpenAI from 'openai';
import User from '@/models/User';
import Like from '@/models/Like';
import Match from '@/models/Match';
import mongoose from 'mongoose';
import { calculateDistance } from './geolocation';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
interface UserProfile {
  userId: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
}
/**
 * Generate embedding for user profile using OpenAI
 */
export async function generateUserEmbedding(profile: UserProfile): Promise<number[]> {
  const profileText = `Name: ${profile.name}, Age: ${profile.age}, Bio: ${profile.bio}, Interests: ${profile.interests.join(', ')}`;
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: profileText,
  });
  return response.data[0].embedding;
}
/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
/**
 * Get recommended users using AI embeddings and collaborative filtering
 */
export async function getRecommendedUsers(
  currentUserId: string,
  limit: number = 10,
  filters?: { minAge?: number; maxAge?: number; maxDistance?: number }
): Promise<any[]> {
  try {
    console.log('[Matching] Starting search for user:', currentUserId);
    console.log('[Matching] Filters:', filters);
    
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    console.log('[Matching] Current user:', {
      name: currentUser.name,
      location: currentUser.location?.coordinates || 'No location',
      gender: currentUser.gender,
      genderPreference: currentUser.genderPreference,
    });

    // Get users already liked or matched
    const likedUsers = await Like.find({ fromUserId: currentUserId }).select('toUserId');
    const likedUserIds = likedUsers.map((like) => like.toUserId.toString());
    console.log('[Matching] Already liked:', likedUserIds.length);
    
    // Get all matched users
    const matches = await Match.find({
      $or: [
        { user1Id: currentUserId },
        { user2Id: currentUserId },
      ],
    });
    const matchedUserIds = matches.map((match) => {
      const matchedId = match.user1Id.toString() === currentUserId 
        ? match.user2Id.toString() 
        : match.user1Id.toString();
      return matchedId;
    });
    console.log('[Matching] Already matched:', matchedUserIds.length);
    
    // Exclude already interacted users
    const excludedIds = [...likedUserIds, ...matchedUserIds, currentUserId];
    console.log('[Matching] Total excluded:', excludedIds.length);
    
    // Build query with age filter
    const query: any = {
      _id: { $nin: excludedIds.map(id => new mongoose.Types.ObjectId(id)) },
    };
    if (filters?.minAge) {
      query.age = query.age || {};
      query.age.$gte = filters.minAge;
    }
    if (filters?.maxAge) {
      query.age = query.age || {};
      query.age.$lte = filters.maxAge;
    }
    // Gender preference filter
    if (currentUser.genderPreference && currentUser.genderPreference !== 'both') {
      query.gender = currentUser.genderPreference;
      console.log('[Matching] Filter by gender:', currentUser.genderPreference);
    }
    // Filter by users interested in currentUser's gender
    if (currentUser.gender) {
      query.$or = [
        { genderPreference: currentUser.gender },
        { genderPreference: 'both' }
      ];
      console.log('[Matching] Filter by users interested in:', currentUser.gender);
    }

    console.log('[Matching] MongoDB query:', JSON.stringify(query, null, 2));
    
    // Get candidate users
    const candidates = await User.find(query).limit(50); // Get more candidates for better filtering
    console.log('[Matching] Found', candidates.length, 'candidates before distance filter');
    
    if (candidates.length === 0) {
      console.log('[Matching] No candidates found with current filters');
      return [];
    }
    // Filter by distance if location is available
    let filteredCandidates = candidates;
    if (filters?.maxDistance && currentUser.location?.coordinates) {
      const [currentLon, currentLat] = currentUser.location.coordinates;
      console.log('[Matching] Applying distance filter: max', filters.maxDistance, 'km from', [currentLat, currentLon]);
      
      filteredCandidates = candidates.filter(candidate => {
        if (!candidate.location?.coordinates) {
          console.log('[Matching] Candidate', candidate.name, 'has no location');
          return false;
        }
        const [candLon, candLat] = candidate.location.coordinates;
        const distance = calculateDistance(currentLat, currentLon, candLat, candLon);
        console.log('[Matching] Distance to', candidate.name, ':', distance.toFixed(2), 'km');
        return distance <= filters.maxDistance!;
      });
      
      console.log('[Matching] After distance filter:', filteredCandidates.length, 'candidates');
      
      if (filteredCandidates.length === 0) {
        console.log('[Matching] No candidates within', filters.maxDistance, 'km. Try increasing max distance.');
        return [];
      }
    } else {
      console.log('[Matching] No distance filter applied');
    }
    // Generate embedding for current user
    const currentUserProfile: UserProfile = {
      userId: (currentUser._id as mongoose.Types.ObjectId).toString(),
      name: currentUser.name,
      age: currentUser.age,
      bio: currentUser.bio,
      interests: currentUser.interests,
    };
    const currentUserEmbedding = await generateUserEmbedding(currentUserProfile);
    console.log('[Matching] Generated embeddings for current user');
    
    // Calculate similarity scores for all candidates
    const scoredCandidates = await Promise.all(
      filteredCandidates.map(async (candidate) => {
        const candidateProfile: UserProfile = {
          userId: (candidate._id as mongoose.Types.ObjectId).toString(),
          name: candidate.name,
          age: candidate.age,
          bio: candidate.bio,
          interests: candidate.interests,
        };
        const candidateEmbedding = await generateUserEmbedding(candidateProfile);
        const similarity = cosineSimilarity(currentUserEmbedding, candidateEmbedding);
        // Apply collaborative filtering bonus
        const collaborativeScore = await getCollaborativeFilteringScore(
          currentUserId,
          (candidate._id as mongoose.Types.ObjectId).toString()
        );
        // Combined score: 70% AI similarity + 30% collaborative filtering
        const finalScore = similarity * 0.7 + collaborativeScore * 0.3;
        return {
          user: candidate,
          score: finalScore,
        };
      })
    );
    // Sort by score and return top matches
    scoredCandidates.sort((a, b) => b.score - a.score);
    console.log('[Matching] Top 5 matches:', scoredCandidates.slice(0, 5).map(c => ({
      name: c.user.name,
      score: c.score.toFixed(3)
    })));
    
    const results = scoredCandidates.slice(0, limit).map((item) => {
      let distance;
      if (currentUser.location?.coordinates && item.user.location?.coordinates) {
        const [currentLon, currentLat] = currentUser.location.coordinates;
        const [candLon, candLat] = item.user.location.coordinates;
        distance = calculateDistance(currentLat, currentLon, candLat, candLon);
      }
      return {
        id: (item.user._id as mongoose.Types.ObjectId).toString(),
        name: item.user.name,
        age: item.user.age,
        bio: item.user.bio,
        profilePhoto: item.user.profilePhoto,
        interests: item.user.interests,
        distance,
      };
    });
    
    console.log('[Matching] Returning', results.length, 'matches');
    return results;
  } catch (error) {
    console.error('[Matching] Error:', error);
    throw error;
  }
}
/**
 * Collaborative filtering: Find similar users based on like patterns
 */
async function getCollaborativeFilteringScore(
  userId: string,
  candidateId: string
): Promise<number> {
  try {
    // Find users who liked the same profiles as current user
    const currentUserLikes = await Like.find({ fromUserId: userId }).select('toUserId');
    const currentUserLikedIds = currentUserLikes.map((like) => like.toUserId.toString());
    if (currentUserLikedIds.length === 0) return 0.5; // Neutral score if no likes yet
    // Find users who also liked those profiles (similar taste)
    const similarUsers = await Like.find({
      toUserId: { $in: currentUserLikedIds },
      fromUserId: { $ne: userId },
    }).select('fromUserId');
    const similarUserIds = [...new Set(similarUsers.map((like) => like.fromUserId.toString()))];
    if (similarUserIds.length === 0) return 0.5;
    // Check if similar users liked the candidate
    const candidateLikes = await Like.countDocuments({
      fromUserId: { $in: similarUserIds },
      toUserId: candidateId,
    });
    // Normalize score between 0 and 1
    const score = candidateLikes / similarUserIds.length;
    return score;
  } catch (error) {
    console.error('Collaborative filtering error:', error);
    return 0.5; // Return neutral score on error
  }
}
/**
 * Batch generate embeddings for multiple users (for initialization)
 */
export async function batchGenerateEmbeddings(userIds: string[]) {
  const users = await User.find({ _id: { $in: userIds } });
  const embeddings = await Promise.all(
    users.map(async (user) => {
      const profile: UserProfile = {
        userId: (user._id as mongoose.Types.ObjectId).toString(),
        name: user.name,
        age: user.age,
        bio: user.bio,
        interests: user.interests,
      };
      return {
        userId: (user._id as mongoose.Types.ObjectId).toString(),
        embedding: await generateUserEmbedding(profile),
      };
    })
  );
  return embeddings;
}
