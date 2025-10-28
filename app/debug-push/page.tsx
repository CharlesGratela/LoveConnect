'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function PushDebugPage() {
  const [swStatus, setSwStatus] = useState<string>('Checking...');
  const [swRegistration, setSwRegistration] = useState<any>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();

  useEffect(() => {
    checkServiceWorker();
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const checkServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      setSwStatus('❌ Not Supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        setSwRegistration(registration);
        if (registration.active) {
          setSwStatus('✅ Active');
        } else if (registration.installing) {
          setSwStatus('⚙️ Installing');
        } else if (registration.waiting) {
          setSwStatus('⏳ Waiting');
        }

        // Check for subscription
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
      } else {
        setSwStatus('❌ Not Registered');
      }
    } catch (error) {
      console.error('Error checking service worker:', error);
      setSwStatus('❌ Error');
    }
  };

  const testServiceWorkerMessage = () => {
    if (swRegistration?.active) {
      swRegistration.active.postMessage({
        type: 'TEST_NOTIFICATION',
        title: 'Test from App',
        body: 'This is a test message'
      });
      toast.info('Message sent to Service Worker');
    }
  };

  const unregisterServiceWorker = async () => {
    if (swRegistration) {
      await swRegistration.unregister();
      toast.success('Service Worker unregistered. Refresh page.');
      checkServiceWorker();
    }
  };

  const manuallyTriggerNotification = async () => {
    if (!swRegistration) {
      toast.error('Service Worker not registered');
      return;
    }

    try {
      await swRegistration.showNotification('Manual Test 🔔', {
        body: 'This notification was triggered manually from the debug page',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'manual-test',
        requireInteraction: false,
      });
      toast.success('Manual notification triggered!');
    } catch (error) {
      console.error('Error showing notification:', error);
      toast.error('Failed to show notification: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Push Notification Debug</h1>

        {/* User Info */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">User Info</h2>
          {user ? (
            <div>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          ) : (
            <p className="text-red-500">Not logged in</p>
          )}
        </Card>

        {/* Service Worker Status */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">Service Worker Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <strong>Status:</strong>
              <Badge variant={swStatus.includes('✅') ? 'default' : 'destructive'}>
                {swStatus}
              </Badge>
            </div>
            {swRegistration && (
              <>
                <p><strong>Scope:</strong> {swRegistration.scope}</p>
                <p><strong>Update Available:</strong> {swRegistration.waiting ? 'Yes' : 'No'}</p>
              </>
            )}
            <div className="flex gap-2 mt-4">
              <Button onClick={checkServiceWorker} size="sm">
                Refresh Status
              </Button>
              <Button onClick={unregisterServiceWorker} size="sm" variant="destructive">
                Unregister SW
              </Button>
            </div>
          </div>
        </Card>

        {/* Notification Permission */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">Notification Permission</h2>
          <div className="flex items-center gap-2">
            <strong>Permission:</strong>
            <Badge variant={
              notificationPermission === 'granted' ? 'default' : 
              notificationPermission === 'denied' ? 'destructive' : 
              'secondary'
            }>
              {notificationPermission}
            </Badge>
          </div>
          {notificationPermission !== 'granted' && (
            <Button 
              onClick={() => {
                Notification.requestPermission().then(perm => {
                  setNotificationPermission(perm);
                  toast.success('Permission: ' + perm);
                });
              }}
              className="mt-3"
              size="sm"
            >
              Request Permission
            </Button>
          )}
        </Card>

        {/* Push Subscription */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">Push Subscription</h2>
          {subscription ? (
            <div className="space-y-2">
              <p className="text-green-600 font-semibold">✅ Subscribed</p>
              <p className="text-xs break-all"><strong>Endpoint:</strong> {subscription.endpoint}</p>
              <details className="text-xs">
                <summary className="cursor-pointer font-semibold">Keys</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify({
                    p256dh: subscription.getKey('p256dh'),
                    auth: subscription.getKey('auth')
                  }, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-red-500">❌ Not subscribed</p>
          )}
        </Card>

        {/* Test Actions */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">Test Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={testServiceWorkerMessage} disabled={!swRegistration}>
              Send Message to SW
            </Button>
            <Button onClick={manuallyTriggerNotification} disabled={!swRegistration}>
              Manual Notification
            </Button>
            <Button 
              onClick={() => {
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  new Notification('Browser Notification Test 🔔', {
                    body: 'This is a direct browser notification (not from SW)',
                    icon: '/favicon.svg'
                  });
                  toast.success('Direct notification sent');
                } else {
                  toast.error('Permission not granted');
                }
              }}
            >
              Direct Browser Notification
            </Button>
          </div>
        </Card>

        {/* Console Instructions */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950">
          <h2 className="text-xl font-semibold mb-3">🔍 Debugging Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open browser DevTools (F12)</li>
            <li>Go to <strong>Application</strong> tab → <strong>Service Workers</strong></li>
            <li>Check if service worker is running</li>
            <li>Go to <strong>Console</strong> tab</li>
            <li>Look for <code>[Service Worker]</code> logs when push arrives</li>
            <li>Try clicking &quot;Manual Notification&quot; button above</li>
            <li>If manual works but push doesn&apos;t, issue is with server payload</li>
            <li>If manual doesn&apos;t work, issue is with Service Worker registration</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
