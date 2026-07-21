'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Error checking subscription', err);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();

      if (permissionResult !== 'granted') {
        toast.error('Notification permission denied.');
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });

      // Send to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });

      if (!res.ok) throw new Error('Failed to save subscription on server');
      
      setSubscription(sub);
      toast.success('Push notifications enabled!');
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error('Failed to subscribe to notifications.');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        
        setSubscription(null);
        toast.success('Push notifications disabled.');
      }
    } catch (err) {
      console.error('Unsubscribe error:', err);
      toast.error('Failed to unsubscribe.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
               <BellOff className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">Push Notifications</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Not supported on this device/browser</p>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
       <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${subscription ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
             <Bell className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">Push Notifications</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              {subscription ? 'Active on this device' : 'Native alerts for Vault reminders'}
            </p>
          </div>
       </div>
       <Button 
          variant={subscription ? 'outline' : 'default'} 
          onClick={subscription ? unsubscribe : subscribe}
          disabled={loading}
          className={`rounded-xl font-bold text-xs ${subscription ? 'text-red-500 hover:text-red-600 border-red-100 bg-red-50 hover:bg-red-100' : ''}`}
       >
         {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
         {subscription ? 'Disable' : 'Enable'}
       </Button>
    </div>
  );
}
