'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if we have success or error parameters
    if (success === 'true') {
      setStatus('success');
      setMessage('Your email has been verified successfully!');
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    } else if (error) {
      setStatus('error');
      if (error === 'missing-token') {
        setMessage('Verification token is missing');
      } else if (error === 'invalid-token') {
        setMessage('Invalid or expired verification token');
      } else {
        setMessage('An error occurred during verification');
      }
    } else {
      // No success or error param means we shouldn't be here
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [success, error, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link href="/">
              <Image src="/logo.svg" alt="nXtDate" width={64} height={64} className="h-16" priority />
            </Link>
          </div>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && 'Email verified successfully!'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-muted-foreground">Please wait while we verify your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                  Success! 🎉
                </h3>
                <p className="text-muted-foreground mb-4">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
              <Button onClick={() => router.push('/auth')} className="gradient-primary">
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                  Verification Failed
                </h3>
                <p className="text-muted-foreground mb-4">{message}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  The verification link may have expired or is invalid.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/auth')} variant="outline">
                  Back to Login
                </Button>
                <Button 
                  onClick={() => router.push('/auth?resend=true')} 
                  className="gradient-primary"
                >
                  Resend Verification Email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
        <Card className="w-full max-w-md shadow-elevated">
          <CardContent className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
