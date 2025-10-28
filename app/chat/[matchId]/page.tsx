'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/notifications';

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
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [matchUser, setMatchUser] = useState<MatchUser | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const matchId = params?.matchId as string;

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (matchId) {
      fetchMatch();
      fetchMessages();
      
      // Request notification permission (push notifications are handled by Service Worker)
      requestNotificationPermission();
      
      // Poll for new messages every 3 seconds to update UI
      const interval = setInterval(() => {
        fetchMessages();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [matchId, isAuthenticated, authLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMatch = async () => {
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
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?matchId=${matchId}`);
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        // Update UI with new messages (push notifications handled by Service Worker)
        setMessages(newMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

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
        const data = await response.json();
        setMessages([...messages, data.message]);
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
          <img
            src={matchUser.profilePhoto}
            alt={matchUser.name}
            className="h-12 w-12 rounded-full object-cover"
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
              <div className="text-center text-muted-foreground">
                <p>Start the conversation with {matchUser.name}!</p>
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
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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
