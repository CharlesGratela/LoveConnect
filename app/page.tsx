'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/discover');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <div className="text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full gradient-primary shadow-elevated animate-pulse-glow">
            <Heart className="h-12 w-12 text-primary-foreground fill-current" />
          </div>
        </div>
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          LoveConnect
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
          Discover meaningful connections powered by AI matching
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => router.push('/auth')} className="gradient-primary">
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
