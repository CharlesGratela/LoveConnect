'use client';
import { useState } from 'react';
import { MapPin, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  profilePhoto: string;
  interests: string[];
  distance?: number;
}
interface SwipeCardProps {
  user: User;
  onSwipe: (direction: 'left' | 'right') => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
}
const SwipeCard = ({ user, onSwipe, style, isDragging }: SwipeCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <div
      className="absolute inset-0 select-none"
      style={{...style, minHeight: '100%'}}
    >
      <div className={`h-full w-full rounded-3xl overflow-hidden shadow-elevated transition-smooth ${
        isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
      }`}>
        <div className="relative h-full w-full gradient-card bg-gray-200">
          {/* Profile Image */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          <img
            src={user.profilePhoto}
            alt={user.name}
            className={`h-full w-full object-cover object-center transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ maxHeight: '100%' }}
            onLoad={() => {
              setImageLoaded(true);
            }}
            onError={(e) => {
              console.error('[SwipeCard] Image failed to load for:', user.name);
              console.error('[SwipeCard] Image src:', user.profilePhoto?.substring(0, 100));
              setImageLoaded(true); // Show card anyway
            }}
            draggable={false}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          {/* User Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-end justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold mb-0.5">
                  {user.name}, {user.age}
                </h2>
                {user.distance !== undefined && (
                  <div className="flex items-center gap-1 text-white/90">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="text-xs">{Math.round(user.distance)} km away</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-white/90 text-xs mb-2 line-clamp-2">{user.bio}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {user.interests.slice(0, 4).map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="glass text-white border-white/20 text-xs py-0 px-2"
                >
                  {interest}
                </Badge>
              ))}
              {user.interests.length > 4 && (
                <Badge variant="secondary" className="glass text-white border-white/20 text-xs py-0 px-2">
                  +{user.interests.length - 4}
                </Badge>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-12 rounded-full border-2 bg-white hover:bg-white hover:scale-110 transition-smooth shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipe('left');
                }}
              >
                <X className="h-6 w-6 text-destructive" />
              </Button>
              <Button
                size="lg"
                className="h-14 w-14 rounded-full gradient-primary hover:scale-110 transition-smooth shadow-lg shadow-primary/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipe('right');
                }}
              >
                <Heart className="h-7 w-7 fill-current" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SwipeCard;
