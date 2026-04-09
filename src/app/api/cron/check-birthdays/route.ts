import { NextRequest, NextResponse } from 'next/server';
import { getAllContacts, hasReminderBeenSent, markReminderSent } from '@/lib/db';
import { getDaysUntilBirthday, getUpcomingAge } from '@/lib/utils';
import { sendPushToAll, PushPayload } from '@/lib/push';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contacts = await getAllContacts();
  const today = new Date().toISOString().split('T')[0];
  const notifications: PushPayload[] = [];

  for (const contact of contacts) {
    const daysUntil = getDaysUntilBirthday(contact.birthday);
    const reminderDays: number[] = JSON.parse(contact.reminder_days || '[0,1,7]');

    for (const days of reminderDays) {
      if (daysUntil === days) {
        const reminderType = `push-${days}-day`;
        if (await hasReminderBeenSent(contact.id, reminderType, today)) {
          continue;
        }

        const age = getUpcomingAge(contact.birthday, contact.birth_year);
        let title: string;
        let body: string;

        if (days === 0) {
          title = `\uD83C\uDF82 Happy Birthday ${contact.name}!`;
          body = age !== null
            ? `${contact.name} is turning ${age} today! Don't forget to wish them!`
            : `It's ${contact.name}'s birthday today! Send them your wishes!`;
        } else if (days === 1) {
          title = `\uD83D\uDD14 Birthday Tomorrow`;
          body = age !== null
            ? `${contact.name} turns ${age} tomorrow — time to prepare!`
            : `${contact.name}'s birthday is tomorrow!`;
        } else {
          title = `\uD83D\uDCC5 Birthday in ${days} days`;
          body = age !== null
            ? `${contact.name} turns ${age} in ${days} days`
            : `${contact.name}'s birthday is in ${days} days`;
        }

        notifications.push({
          title,
          body,
          tag: `birthday-${contact.id}-${days}`,
          url: `/contacts/${contact.id}`,
          contactId: contact.id,
          requireInteraction: days === 0,
          actions: days === 0
            ? [{ action: 'send-wish', title: 'Send Birthday Wish' }]
            : [],
        });

        await markReminderSent(contact.id, reminderType);
      }
    }
  }

  // Send all push notifications
  let totalSent = 0;
  let totalFailed = 0;
  for (const payload of notifications) {
    try {
      const result = await sendPushToAll(payload);
      totalSent += result.sent;
      totalFailed += result.failed;
    } catch {
      // VAPID keys not configured — skip push but don't crash
      totalFailed++;
    }
  }

  return NextResponse.json({
    checked: contacts.length,
    reminders: notifications.length,
    push: { sent: totalSent, failed: totalFailed },
  });
}
