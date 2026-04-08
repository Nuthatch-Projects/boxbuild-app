'use client';

import { useEffect, useCallback } from 'react';

interface Reminder {
  contact_id: string;
  contact_name: string;
  days_until: number;
  reminder_type: string;
  notify_whatsapp: boolean;
  whatsapp_message: string;
}

export default function NotificationManager() {
  const checkReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders');
      if (!res.ok) return;

      const data = await res.json();
      const reminders: Reminder[] = data.reminders || [];

      for (const reminder of reminders) {
        if (Notification.permission === 'granted') {
          const title =
            reminder.days_until === 0
              ? `\uD83C\uDF82 It's ${reminder.contact_name}'s birthday today!`
              : `\uD83D\uDD14 ${reminder.contact_name}'s birthday is in ${reminder.days_until} day${reminder.days_until > 1 ? 's' : ''}`;

          new Notification(title, {
            body:
              reminder.days_until === 0
                ? "Don't forget to wish them!"
                : 'Time to prepare a gift or message!',
            icon: '/favicon.ico',
            tag: `birthday-${reminder.contact_id}-${reminder.reminder_type}`,
          });
        }
      }
    } catch {
      // Silently fail - reminders are best-effort
    }
  }, []);

  useEffect(() => {
    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // Check reminders on load
    checkReminders();

    // Check every 30 minutes
    const interval = setInterval(checkReminders, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkReminders]);

  return null;
}
