import { NextRequest, NextResponse } from 'next/server';
import { getAllContacts, createContact, searchContacts } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (query) {
    const contacts = searchContacts(query);
    return NextResponse.json(contacts);
  }

  const contacts = getAllContacts();
  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.birthday) {
    return NextResponse.json({ error: 'Name and birthday are required' }, { status: 400 });
  }

  const contact = createContact({
    id: uuidv4(),
    name: body.name,
    birthday: body.birthday,
    birth_year: body.birth_year || null,
    phone: body.phone || '',
    email: body.email || '',
    photo_url: body.photo_url || '',
    relationship: body.relationship || 'Other',
    notes: body.notes || '',
    notify_whatsapp: body.notify_whatsapp || false,
    whatsapp_message: body.whatsapp_message || '',
    reminder_days: JSON.stringify(body.reminder_days || [0, 1, 7]),
  });

  return NextResponse.json(contact, { status: 201 });
}
