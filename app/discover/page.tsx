'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SwipeCard from '@/components/discover/SwipeCard';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sparkles, SlidersHorizontal, X } from 'lucide-react';
import { requestNotificationPermission, showMatchNotification } from '@/lib/notifications';
interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  profilePhoto: string;
  interests: string[];
  distance?: number;
}
export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [ageRange, setAgeRange] = useState([18, 100]);
  const [maxDistance, setMaxDistance] = useState(20000); // km - worldwide by default
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to load before redirecting
    if (authLoading) {
      return;
    }
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    fetchUsers();
    // Request notification permission
    requestNotificationPermission();
  }, [isAuthenticated, authLoading, router, ageRange, maxDistance]);
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        minAge: ageRange[0].toString(),
        maxAge: ageRange[1].toString(),
        maxDistance: maxDistance.toString(),
      });
      
      console.log('[Discover] Fetching users with filters:', { 
        ageRange, 
        maxDistance: maxDistance >= 20000 ? 'Worldwide' : `${maxDistance}km` 
      });
      
      const response = await fetch(`/api/discover?${params}`, {
        credentials: 'include',
      });
      
      console.log('[Discover] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Discover] Received', data.users?.length || 0, 'users');
        
        if (data.users && data.users.length > 0) {
          console.log('[Discover] First user:', data.users[0]?.name, 'Distance:', data.users[0]?.distance);
        } else {
          toast.info('No matches found. Try adjusting your filters.');
        }
        setUsers(data.users || []);
        setCurrentIndex(0);
      } else {
        const errorData = await response.json();
        console.error('[Discover] Error response:', errorData);
        toast.error('Failed to load users: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('[Discover] Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  const resetFilters = () => {
    setAgeRange([18, 100]);
    setMaxDistance(20000); // Reset to worldwide
  };
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= users.length) return;
    const currentUser = users[currentIndex];
    const action = direction === 'right' ? 'like' : 'dislike';
    try {
      const response = await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: currentUser.id,
          action,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.matched) {
          console.log('[Discover] Match detected with:', currentUser.name);
          
          // Show toast notification
          toast.success(
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>It&apos;s a match with {currentUser.name}!</span>
            </div>,
            { duration: 3000 }
          );
          // Show browser push notification
          showMatchNotification(currentUser.name, currentUser.profilePhoto);
        } else if (action === 'like') {
          toast.info(`Liked ${currentUser.name}`);
        }
      }
    } catch (error) {
      console.error('Swipe error:', error);
    }
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
  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <>
        <Header />
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      </>
    );
  }
  if (loading) {
    return (
      <>
        <Header />
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profiles...</p>
          </div>
        </div>
      </>
    );
  }
  if (currentIndex >= users.length || users.length === 0) {
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
  const currentUser = users[currentIndex];
  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) / 500;
  return (
    <>
      <Header />
      <div className="container min-h-[calc(100vh-4rem)] p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Discover</h1>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
        {showFilters && (
          <Card className="p-4 mb-4 animate-slide-up shadow-lg border-2">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Age Range: {ageRange[0]} - {ageRange[1]}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
                <Slider
                  value={ageRange}
                  onValueChange={setAgeRange}
                  min={18}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Max Distance: {maxDistance >= 20000 ? 'Worldwide' : `${maxDistance} km`}</Label>
                </div>
                <Slider
                  value={[maxDistance]}
                  onValueChange={(value) => setMaxDistance(value[0])}
                  min={1}
                  max={20000}
                  step={maxDistance < 1000 ? 10 : 100}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 km</span>
                  <span>Worldwide</span>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMaxDistance(50)}
                    className="text-xs"
                  >
                    50km
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMaxDistance(100)}
                    className="text-xs"
                  >
                    100km
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMaxDistance(500)}
                    className="text-xs"
                  >
                    500km
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMaxDistance(20000)}
                    className="text-xs"
                  >
                    Worldwide
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => {
                    fetchUsers();
                    setShowFilters(false);
                  }}
                  className="flex-1"
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetFilters();
                    setShowFilters(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
        <div className="flex items-center justify-center py-8">
          <div
            className="relative w-full max-w-sm h-[550px]"
            onMouseMove={handleMouseMove}
          >
            {/* Next card preview */}
            {users[currentIndex + 1] && (
              <div className="absolute inset-0 scale-95 opacity-50 z-0">
                <SwipeCard
                  user={users[currentIndex + 1]}
                  onSwipe={() => {}}
                />
              </div>
            )}
            {/* Current card */}
            <div
              className="absolute inset-0 z-10"
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
      </div>
    </>
  );
}
