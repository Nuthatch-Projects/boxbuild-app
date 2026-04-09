import { NextResponse } from 'next/server';
import { getAllContacts, getSettings, hasReminderBeenSent, markReminderSent } from '@/lib/db';
import { getDaysUntilBirthday, getUpcomingAge, composeWhatsAppMessage } from '@/lib/utils';

export async function GET() {
  const contacts = await getAllContacts();
  const settings = await getSettings();
  const today = new Date().toISOString().split('T')[0];

  const dueReminders: {
    contact_id: string;
    contact_name: string;
    days_until: number;
    reminder_type: string;
    notify_whatsapp: boolean;
    whatsapp_message: string;
  }[] = [];

  for (const contact of contacts) {
    const daysUntil = getDaysUntilBirthday(contact.birthday);
    const reminderDays: number[] = JSON.parse(contact.reminder_days || '[0,1,7]');

    for (const days of reminderDays) {
      if (daysUntil === days) {
        const reminderType = `${days}-day`;
        if (!(await hasReminderBeenSent(contact.id, reminderType, today))) {
          const age = getUpcomingAge(contact.birthday, contact.birth_year);
          const messageTemplate =
            contact.whatsapp_message || settings.whatsapp_default_message;
          const message = composeWhatsAppMessage(messageTemplate, contact.name, age);

          dueReminders.push({
            contact_id: contact.id,
            contact_name: contact.name,
            days_until: daysUntil,
            reminder_type: reminderType,
            notify_whatsapp: contact.notify_whatsapp && daysUntil === 0,
            whatsapp_message: message,
          });

          await markReminderSent(contact.id, reminderType);
        }
      }
    }
  }

  return NextResponse.json({ reminders: dueReminders });
}
