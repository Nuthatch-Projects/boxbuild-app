'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';

export default function PushSubscription() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setSupported(true);
    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(!!subscription);
    } catch {
      // Push not available
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured');
        setLoading(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      });

      const json = subscription.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      setSubscribed(true);
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (error) {
      console.error('Unsubscribe failed:', error);
    }
    setLoading(false);
  };

  if (!supported) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <BellRing className="w-5 h-5 text-amber-500" />
        Push Notifications
      </h3>

      <p className="text-sm text-gray-600">
        Get notified about upcoming birthdays even when the app is closed.
        {permission === 'denied' && (
          <span className="block text-red-600 mt-1">
            Notifications are blocked. Please enable them in your browser settings.
          </span>
        )}
      </p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">
            {subscribed ? 'Push notifications enabled' : 'Push notifications disabled'}
          </p>
          <p className="text-xs text-gray-500">
            {subscribed
              ? "You'll receive birthday reminders automatically"
              : 'Enable to never miss a birthday'}
          </p>
        </div>

        <button
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading || permission === 'denied'}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
            subscribed
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : subscribed ? (
            <BellOff className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          {loading ? 'Working...' : subscribed ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
