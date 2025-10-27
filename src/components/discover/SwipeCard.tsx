import { useState } from 'react';
import { MockUser } from '@/data/mockUsers';
import { MapPin, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SwipeCardProps {
  user: MockUser;
  onSwipe: (direction: 'left' | 'right') => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

const SwipeCard = ({ user, onSwipe, style, isDragging }: SwipeCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="absolute inset-0 select-none"
      style={style}
    >
      <div className={`h-full w-full rounded-3xl overflow-hidden shadow-elevated transition-smooth ${
        isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
      }`}>
        <div className="relative h-full w-full gradient-card">
          {/* Profile Image */}
          <img
            src={user.profilePhoto}
            alt={user.name}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* User Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="text-4xl font-bold mb-1">
                  {user.name}, {user.age}
                </h2>
                {user.distance && (
                  <div className="flex items-center gap-1 text-white/90">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{user.distance} km away</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-white/90 mb-4 line-clamp-3">{user.bio}</p>

            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="glass text-white border-white/20"
                >
                  {interest}
                </Badge>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <Button
                size="lg"
                variant="outline"
                className="h-16 w-16 rounded-full border-2 bg-white hover:bg-white hover:scale-110 transition-smooth shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipe('left');
                }}
              >
                <X className="h-8 w-8 text-destructive" />
              </Button>

              <Button
                size="lg"
                className="h-20 w-20 rounded-full gradient-primary hover:scale-110 transition-smooth shadow-lg shadow-primary/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipe('right');
                }}
              >
                <Heart className="h-10 w-10 fill-current" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;
