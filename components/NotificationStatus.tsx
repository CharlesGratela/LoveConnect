'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, BellOff, AlertCircle, RefreshCw } from 'lucide-react';
import { requestNotificationPermission, subscribeToPushNotifications } from '@/lib/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function NotificationStatus() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setSupported(true);
    } else {
      setSupported(false);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setSubscribing(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      
      if (result === 'granted' && user?.id) {
        await subscribeToPushNotifications(user.id);
        toast.success('Push notifications enabled!');
      }
    } catch (error) {
      console.error('[NotificationStatus] Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setSubscribing(false);
    }
  };

  const handleResubscribe = async () => {
    if (!user?.id) {
      toast.error('Please login first');
      return;
    }

    setSubscribing(true);
    try {
      await subscribeToPushNotifications(user.id);
      toast.success('Resubscribed to push notifications!');
    } catch (error) {
      console.error('[NotificationStatus] Error resubscribing:', error);
      toast.error('Failed to resubscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const handleTestNotification = () => {
    if (Notification.permission === 'granted') {
        console.log('[Notifications] Sending test notification');
      new Notification('Test Notification 🔔', {
        body: 'Notifications are working correctly!',
        icon: '/favicon.svg',
      });
    }
  };

  if (!supported) {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Notifications Not Supported</p>
            <p className="text-sm text-muted-foreground">Your browser doesn&apos;t support notifications</p>
          </div>
        </div>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">Notifications Blocked</p>
            <p className="text-sm text-muted-foreground">
              Please enable notifications in your browser settings (click 🔒 in address bar)
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (permission === 'default') {
    return (
      <Card className="p-4 bg-yellow-500/10 border-yellow-500">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <p className="font-semibold">Enable Notifications</p>
            <p className="text-sm text-muted-foreground">
              Get notified about matches, likes, and messages
            </p>
          </div>
          <Button onClick={handleEnableNotifications} size="sm" disabled={subscribing}>
            {subscribing ? 'Enabling...' : 'Enable'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-green-500/10 border-green-500">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-green-600" />
        <div className="flex-1">
          <p className="font-semibold text-green-600">Notifications Enabled ✓</p>
          <p className="text-sm text-muted-foreground">
            You&apos;ll receive notifications for matches, likes, and messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleResubscribe} 
            variant="outline" 
            size="sm"
            disabled={subscribing}
            title="Resubscribe to push notifications"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleTestNotification} variant="outline" size="sm">
            Test
          </Button>
        </div>
      </div>
    </Card>
  );
}
