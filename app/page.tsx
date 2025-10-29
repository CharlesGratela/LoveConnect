'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Image from 'next/image';

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
          <Image src="/logo.svg" alt="nXtDate" width={128} height={128} className="h-32 animate-pulse-glow" priority />
        </div>
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
