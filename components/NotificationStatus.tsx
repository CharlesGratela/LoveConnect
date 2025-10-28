'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, BellOff, AlertCircle } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/notifications';

export default function NotificationStatus() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setSupported(true);
    } else {
      setSupported(false);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
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
          <Button onClick={handleEnableNotifications} size="sm">
            Enable
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
        <Button onClick={handleTestNotification} variant="outline" size="sm">
          Test
        </Button>
      </div>
    </Card>
  );
}
