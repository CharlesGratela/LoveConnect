export interface MockUser {
  id: string;
  name: string;
  age: number;
  bio: string;
  profilePhoto: string;
  interests: string[];
  distance?: number;
}

export const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'Sarah',
    age: 28,
    bio: 'Adventure seeker & coffee enthusiast ☕️ Love hiking, photography, and trying new restaurants. Looking for someone who can keep up!',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    interests: ['Travel', 'Photography', 'Hiking', 'Coffee'],
    distance: 5,
  },
  {
    id: '2',
    name: 'Emma',
    age: 26,
    bio: 'Yoga instructor by day, bookworm by night 📚 Passionate about wellness and personal growth. Seeking genuine connections.',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    interests: ['Yoga', 'Reading', 'Meditation', 'Cooking'],
    distance: 3,
  },
  {
    id: '3',
    name: 'Michael',
    age: 30,
    bio: 'Software engineer with a passion for music 🎸 Weekend warrior, weekday coder. Let\'s grab drinks and talk about anything!',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
    interests: ['Music', 'Tech', 'Gaming', 'Concerts'],
    distance: 7,
  },
  {
    id: '4',
    name: 'Jessica',
    age: 27,
    bio: 'Artist & creative soul 🎨 Love painting, dancing, and spontaneous road trips. Life is too short for boring conversations!',
    profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    interests: ['Art', 'Dancing', 'Travel', 'Music'],
    distance: 4,
  },
  {
    id: '5',
    name: 'David',
    age: 29,
    bio: 'Fitness enthusiast & foodie 🏋️‍♂️🍜 Believe in balance - gym in the morning, ramen at night. Looking for a workout buddy!',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    interests: ['Fitness', 'Food', 'Travel', 'Sports'],
    distance: 6,
  },
  {
    id: '6',
    name: 'Olivia',
    age: 25,
    bio: 'Medical student with a wild side 🩺✨ Love late-night conversations, indie music, and trying new cuisines. Let\'s explore together!',
    profilePhoto: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80',
    interests: ['Medicine', 'Music', 'Food', 'Science'],
    distance: 2,
  },
  {
    id: '7',
    name: 'James',
    age: 31,
    bio: 'Entrepreneur & dog dad 🐕 Building my dreams and enjoying the journey. Love outdoor activities and good conversations over wine.',
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
    interests: ['Business', 'Dogs', 'Wine', 'Outdoors'],
    distance: 8,
  },
  {
    id: '8',
    name: 'Sophia',
    age: 24,
    bio: 'Fashion designer & vintage lover 👗 Obsessed with thrift stores, coffee shops, and sunset photos. Let\'s create beautiful memories!',
    profilePhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
    interests: ['Fashion', 'Vintage', 'Photography', 'Coffee'],
    distance: 5,
  },
];
