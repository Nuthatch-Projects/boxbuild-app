import { NextRequest, NextResponse } from 'next/server';
import { bulkCreateContacts } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!Array.isArray(body.contacts)) {
    return NextResponse.json({ error: 'Expected contacts array' }, { status: 400 });
  }

  const contacts = body.contacts.map((c: Record<string, string>) => ({
    id: uuidv4(),
    name: c.name || 'Unknown',
    birthday: c.birthday || '',
    birth_year: c.birth_year ? parseInt(c.birth_year) : null,
    phone: c.phone || '',
    email: c.email || '',
    photo_url: c.photo_url || '',
    relationship: c.relationship || 'Other',
    notes: c.notes || '',
    notify_whatsapp: c.notify_whatsapp === 'Yes' || c.notify_whatsapp === 'true',
    whatsapp_message: c.whatsapp_message || '',
    reminder_days: JSON.stringify(c.reminder_days || [0, 1, 7]),
  }));

  const validContacts = contacts.filter(
    (c: { name: string; birthday: string }) => c.name && c.birthday
  );
  const count = await bulkCreateContacts(validContacts);

  return NextResponse.json({ imported: count });
}
