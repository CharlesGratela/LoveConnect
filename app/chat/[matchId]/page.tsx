'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import Image from 'next/image';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

interface MatchUser {
  id: string;
  name: string;
  age: number;
  profilePhoto: string;
  bio?: string;
  interests?: string[];
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, authProvider } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [matchUser, setMatchUser] = useState<MatchUser | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const starterPrompts = getConversationStarters(matchUser);

  const matchId = params?.matchId as string;

  const fetchMatch = useCallback(async () => {
    try {
      const response = await fetch('/api/matches');
      if (response.ok) {
        const data = await response.json();
        const match = data.matches.find((m: any) => m.id === matchId);
        if (match) {
          setMatchUser(match.user);
        }
      }
    } catch (error) {
      console.error('Error fetching match:', error);
    }
  }, [matchId]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages?matchId=${matchId}`);
      if (response.ok) {
        const data = await response.json();
        const nextMessages = data.messages || [];
        setMessages(nextMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [matchId]);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (matchId) {
      const loadInitialData = async () => {
        await Promise.all([fetchMatch(), fetchMessages()]);
        setLoading(false);
      };
      void loadInitialData();

      if (authProvider !== 'supabase') {
        const interval = setInterval(() => {
          void fetchMessages();
        }, 3000);

        return () => clearInterval(interval);
      }
    }
  }, [matchId, isAuthenticated, authLoading, router, fetchMatch, fetchMessages, authProvider]);

  useEffect(() => {
    if (
      authLoading ||
      authProvider !== 'supabase' ||
      !isAuthenticated ||
      !matchId ||
      !user?.id
    ) {
      return;
    }

    const supabase = createSupabaseClient();
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const incomingMessage = mapRealtimeMessage(payload.new);

          setMessages((current) => {
            if (current.some((message) => message.id === incomingMessage.id)) {
              return current;
            }

            return [...current, incomingMessage];
          });

          if (incomingMessage.receiverId === user.id) {
            await markMessagesRead(supabase, matchId, user.id);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authLoading, authProvider, isAuthenticated, matchId, user?.id]);

  useEffect(() => {
    if (
      authLoading ||
      authProvider !== 'supabase' ||
      !isAuthenticated ||
      !matchId ||
      !user?.id
    ) {
      return;
    }

    const supabase = createSupabaseClient();
    void markMessagesRead(supabase, matchId, user.id);
  }, [authLoading, authProvider, isAuthenticated, matchId, user?.id, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !matchUser) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          receiverId: matchUser.id,
          text: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
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

  if (!matchUser) {
    return (
      <>
        <Header />
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Match not found</h2>
            <Button onClick={() => router.push('/matches')}>
              Back to Matches
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container max-w-4xl flex flex-col h-[calc(100vh-4rem)]">
        {/* Chat Header */}
        <div className="flex items-center gap-4 py-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/matches')}
          >
            <ArrowLeft />
          </Button>
          <Image
            src={matchUser.profilePhoto}
            alt={matchUser.name}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          <div>
            <h2 className="font-semibold">
              {matchUser.name}, {matchUser.age}
            </h2>
            <p className="text-sm text-muted-foreground">Active now</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="max-w-md text-center text-muted-foreground space-y-4">
                <p>Start the conversation with {matchUser.name}!</p>
                {starterPrompts.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {starterPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewMessage(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'gradient-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="py-4 border-t">
          {messages.length > 0 && starterPrompts.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {starterPrompts.slice(0, 2).map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim()} className="gradient-primary">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function mapRealtimeMessage(record: Record<string, unknown>): Message {
  return {
    id: String(record.id),
    senderId: String(record.sender_id),
    receiverId: String(record.receiver_id),
    text: String(record.text || ''),
    timestamp: String(record.created_at),
  };
}

async function markMessagesRead(
  supabase: ReturnType<typeof createSupabaseClient>,
  matchId: string,
  userId: string
) {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .eq('receiver_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Error marking messages as read:', error);
  }
}

function getConversationStarters(matchUser: MatchUser | null) {
  if (!matchUser) {
    return [];
  }

  const prompts: string[] = [];
  const interests = matchUser.interests || [];

  if (interests.length > 0) {
    prompts.push(`I saw you're into ${interests[0]}. What got you into it?`);
  }

  if (interests.length > 1) {
    prompts.push(
      `You seem fun. Which do you enjoy more lately: ${interests
        .slice(0, 2)
        .join(' or ')}?`
    );
  }

  prompts.push("What's something you're genuinely excited about right now?");

  if (matchUser.bio) {
    prompts.push("What kind of first date sounds fun to you?");
  }

  return prompts.slice(0, 3);
}
