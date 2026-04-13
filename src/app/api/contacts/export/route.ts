import { NextResponse } from 'next/server';
import { getAllContacts } from '@/lib/db';

export async function GET() {
  const contacts = await getAllContacts();

  const headers = ['Name', 'Birthday', 'Birth Year', 'Event Type', 'Event Label', 'Phone', 'Email', 'Relationship', 'Notes', 'WhatsApp Notify'];
  const rows = contacts.map((c) => [
    c.name,
    c.birthday,
    c.birth_year || '',
    c.event_type || 'birthday',
    c.event_label || 'Birthday',
    c.phone,
    c.email,
    c.relationship,
    c.notes.replace(/"/g, '""'),
    c.notify_whatsapp ? 'Yes' : 'No',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="events.csv"',
    },
  });
}
