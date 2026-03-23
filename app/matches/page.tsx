'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart, HeartCrack } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

interface Match {
  id: string;
  user: {
    id: string;
    name: string;
    profilePhoto: string;
    age: number;
  };
  matchedAt: string;
  unreadCount?: number;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading, user, authProvider } = useAuth();
  const router = useRouter();

  const fetchMatches = useCallback(async () => {
    try {
      const response = await fetch('/api/matches');
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    void fetchMatches();
  }, [isAuthenticated, authLoading, router, fetchMatches]);

  useEffect(() => {
    if (
      authLoading ||
      authProvider !== 'supabase' ||
      !isAuthenticated ||
      !user?.id
    ) {
      return;
    }

    const supabase = createSupabaseClient();
    const channel = supabase
      .channel(`matches:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          const record =
            payload.eventType === 'DELETE' ? payload.old : payload.new;

          const user1Id = String(record.user1_id || '');
          const user2Id = String(record.user2_id || '');

          if (user1Id === user.id || user2Id === user.id) {
            await fetchMatches();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authLoading, authProvider, isAuthenticated, user?.id, fetchMatches]);

  const handleUnmatch = async (matchId: string, userName: string) => {
    try {
      const response = await fetch(`/api/matches?matchId=${matchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMatches(matches.filter((m) => m.id !== matchId));
        toast.success(`Unmatched with ${userName}`);
      }
    } catch (error) {
      toast.error('Failed to unmatch');
    }
  };

  const handleChat = (matchId: string) => {
    router.push(`/chat/${matchId}`);
  };

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  if (matches.length === 0) {
    return (
      <>
        <Header />
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">No matches yet</h2>
            <p className="text-muted-foreground mb-6">
              Start swiping to find your perfect match!
            </p>
            <Button onClick={() => router.push('/discover')}>
              Start Discovering
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Your Matches</h1>
          <p className="text-muted-foreground">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match, index) => (
            <Card
              key={match.id}
              className="overflow-hidden shadow-card hover:shadow-elevated transition-smooth animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative aspect-square">
                <Image
                  src={match.user.profilePhoto}
                  alt={match.user.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-2xl font-bold">
                    {match.user.name}, {match.user.age}
                  </h3>
                  <p className="text-sm text-white/80">
                    Matched {new Date(match.matchedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gradient-primary"
                    onClick={() => handleChat(match.id)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat
                    {match.unreadCount ? (
                      <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
                        {match.unreadCount}
                      </span>
                    ) : null}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleUnmatch(match.id, match.user.name)}
                    className="hover:text-destructive hover:border-destructive"
                  >
                    <HeartCrack className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
