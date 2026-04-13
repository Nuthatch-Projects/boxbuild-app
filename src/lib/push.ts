import webpush from 'web-push';
import { getAllPushSubscriptions, removePushSubscription } from './db';

function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:hello@datecue.app';

  if (!publicKey || !privateKey) {
    throw new Error(
      'VAPID keys not configured. Run: npx web-push generate-vapid-keys'
    );
  }

  return { publicKey, privateKey, subject };
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  contactId?: string;
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  const { publicKey, privateKey, subject } = getVapidKeys();

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const subscriptions = await getAllPushSubscriptions();
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys_p256dh,
            auth: sub.keys_auth,
          },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Subscription expired or invalid — remove it
        await removePushSubscription(sub.endpoint);
      }
      failed++;
    }
  }

  return { sent, failed };
}
