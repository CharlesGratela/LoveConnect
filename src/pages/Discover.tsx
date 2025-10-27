import { useState, useEffect } from 'react';
import { mockUsers } from '@/data/mockUsers';
import SwipeCard from '@/components/discover/SwipeCard';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

const Discover = () => {
  const [users, setUsers] = useState(mockUsers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const currentUser = users[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      const matches = JSON.parse(localStorage.getItem('matches') || '[]');
      const isMatch = Math.random() > 0.5; // 50% chance of match for demo
      
      if (isMatch) {
        matches.push({
          id: currentUser.id,
          user: currentUser,
          matchedAt: new Date().toISOString(),
        });
        localStorage.setItem('matches', JSON.stringify(matches));
        
        toast.success(
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>It's a match with {currentUser.name}!</span>
          </div>,
          { duration: 3000 }
        );
      } else {
        toast.info(`Liked ${currentUser.name}`);
      }
    }

    // Move to next user
    setCurrentIndex((prev) => prev + 1);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      handleSwipe(dragOffset.x > 0 ? 'right' : 'left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragOffset]);

  if (currentIndex >= users.length) {
    return (
      <>
        <Header />
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full gradient-primary shadow-elevated animate-pulse-glow">
                <Sparkles className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">No more profiles!</h2>
            <p className="text-muted-foreground">Check back later for new matches</p>
          </div>
        </div>
      </>
    );
  }

  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) / 500;

  return (
    <>
      <Header />
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div
          className="relative w-full max-w-md aspect-[3/4]"
          onMouseMove={handleMouseMove}
        >
          {/* Next card preview */}
          {users[currentIndex + 1] && (
            <div className="absolute inset-0 scale-95 opacity-50">
              <SwipeCard
                user={users[currentIndex + 1]}
                onSwipe={() => {}}
              />
            </div>
          )}

          {/* Current card */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
              opacity,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
            }}
          >
            <SwipeCard
              user={currentUser}
              onSwipe={handleSwipe}
              isDragging={isDragging}
            />
          </div>

          {/* Swipe indicators */}
          {isDragging && Math.abs(dragOffset.x) > 50 && (
            <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none">
              {dragOffset.x > 0 ? (
                <div className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-2xl rotate-12 shadow-elevated animate-pulse-glow">
                  LIKE
                </div>
              ) : (
                <div className="px-8 py-4 rounded-full bg-destructive text-destructive-foreground font-bold text-2xl -rotate-12 shadow-elevated animate-pulse-glow">
                  NOPE
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Discover;
