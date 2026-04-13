import { sql } from '@vercel/postgres';
import { AppSettings, Contact, DEFAULT_SETTINGS, EventType } from './types';

export async function initializeDb(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      birthday TEXT NOT NULL,
      birth_year INTEGER,
      event_type TEXT DEFAULT 'birthday',
      event_label TEXT DEFAULT 'Birthday',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      photo_url TEXT DEFAULT '',
      relationship TEXT DEFAULT 'Other',
      notes TEXT DEFAULT '',
      notify_whatsapp BOOLEAN DEFAULT FALSE,
      whatsapp_message TEXT DEFAULT '',
      reminder_days TEXT DEFAULT '[0,1,7]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Add event_type and event_label columns if they don't exist (migration for existing DBs)
  await sql`
    DO $$ BEGIN
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'birthday';
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS event_label TEXT DEFAULT 'Birthday';
    EXCEPTION WHEN others THEN NULL;
    END $$
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sent_reminders (
      id SERIAL PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      reminder_type TEXT NOT NULL,
      sent_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      endpoint TEXT NOT NULL UNIQUE,
      keys_p256dh TEXT NOT NULL,
      keys_auth TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_contacts_birthday ON contacts(birthday)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sent_reminders_contact ON sent_reminders(contact_id, sent_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions(endpoint)`;

  // Initialize default settings
  const entries = Object.entries(DEFAULT_SETTINGS) as [string, string | boolean][];
  for (const [key, value] of entries) {
    await sql`
      INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(value)})
      ON CONFLICT (key) DO NOTHING
    `;
  }
}

// Ensure DB is initialized before any operation
let initialized = false;
async function ensureInit(): Promise<void> {
  if (!initialized) {
    await initializeDb();
    initialized = true;
  }
}

function rowToContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    name: row.name as string,
    birthday: row.birthday as string,
    birth_year: row.birth_year as number | null,
    event_type: (row.event_type as EventType) || 'birthday',
    event_label: (row.event_label as string) || 'Birthday',
    phone: (row.phone as string) || '',
    email: (row.email as string) || '',
    photo_url: (row.photo_url as string) || '',
    relationship: (row.relationship as string) || 'Other',
    notes: (row.notes as string) || '',
    notify_whatsapp: Boolean(row.notify_whatsapp),
    whatsapp_message: (row.whatsapp_message as string) || '',
    reminder_days: (row.reminder_days as string) || '[0,1,7]',
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

// Contact operations
export async function getAllContacts(): Promise<Contact[]> {
  await ensureInit();
  const { rows } = await sql`SELECT * FROM contacts ORDER BY name`;
  return rows.map((row) => rowToContact(row));
}

export async function getContactById(id: string): Promise<Contact | undefined> {
  await ensureInit();
  const { rows } = await sql`SELECT * FROM contacts WHERE id = ${id}`;
  if (rows.length === 0) return undefined;
  return rowToContact(rows[0]);
}

export async function createContact(contact: Omit<Contact, 'created_at' | 'updated_at'>): Promise<Contact> {
  await ensureInit();
  await sql`
    INSERT INTO contacts (id, name, birthday, birth_year, event_type, event_label, phone, email, photo_url, relationship, notes, notify_whatsapp, whatsapp_message, reminder_days)
    VALUES (${contact.id}, ${contact.name}, ${contact.birthday}, ${contact.birth_year}, ${contact.event_type}, ${contact.event_label}, ${contact.phone}, ${contact.email}, ${contact.photo_url}, ${contact.relationship}, ${contact.notes}, ${contact.notify_whatsapp}, ${contact.whatsapp_message}, ${contact.reminder_days})
  `;
  return (await getContactById(contact.id))!;
}

export async function updateContact(
  id: string,
  data: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>
): Promise<Contact | undefined> {
  const existing = await getContactById(id);
  if (!existing) return undefined;

  const updated = { ...existing, ...data };
  await sql`
    UPDATE contacts SET
      name = ${updated.name},
      birthday = ${updated.birthday},
      birth_year = ${updated.birth_year},
      event_type = ${updated.event_type},
      event_label = ${updated.event_label},
      phone = ${updated.phone},
      email = ${updated.email},
      photo_url = ${updated.photo_url},
      relationship = ${updated.relationship},
      notes = ${updated.notes},
      notify_whatsapp = ${updated.notify_whatsapp},
      whatsapp_message = ${updated.whatsapp_message},
      reminder_days = ${updated.reminder_days},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  return getContactById(id);
}

export async function deleteContact(id: string): Promise<boolean> {
  await ensureInit();
  const result = await sql`DELETE FROM contacts WHERE id = ${id}`;
  return (result.rowCount ?? 0) > 0;
}

export async function searchContacts(query: string): Promise<Contact[]> {
  await ensureInit();
  const pattern = `%${query}%`;
  const { rows } = await sql`
    SELECT * FROM contacts WHERE name ILIKE ${pattern} OR notes ILIKE ${pattern} ORDER BY name
  `;
  return rows.map((row) => rowToContact(row));
}

// Settings operations
export async function getSettings(): Promise<AppSettings> {
  await ensureInit();
  const { rows } = await sql`SELECT key, value FROM settings`;
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    try {
      (settings as Record<string, unknown>)[row.key as string] = JSON.parse(row.value as string);
    } catch {
      (settings as Record<string, unknown>)[row.key as string] = row.value;
    }
  }
  return settings;
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  await ensureInit();
  for (const [key, value] of Object.entries(updates)) {
    await sql`
      INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(value)})
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}
    `;
  }
  return getSettings();
}

// Reminder operations
export async function hasReminderBeenSent(contactId: string, reminderType: string, date: string): Promise<boolean> {
  await ensureInit();
  const { rows } = await sql`
    SELECT 1 FROM sent_reminders
    WHERE contact_id = ${contactId}
      AND reminder_type = ${reminderType}
      AND DATE(sent_at) = DATE(${date}::timestamptz)
  `;
  return rows.length > 0;
}

export async function markReminderSent(contactId: string, reminderType: string): Promise<void> {
  await ensureInit();
  await sql`INSERT INTO sent_reminders (contact_id, reminder_type) VALUES (${contactId}, ${reminderType})`;
}

// Push subscription operations
export async function savePushSubscription(endpoint: string, p256dh: string, auth: string): Promise<void> {
  await ensureInit();
  await sql`
    INSERT INTO push_subscriptions (endpoint, keys_p256dh, keys_auth) VALUES (${endpoint}, ${p256dh}, ${auth})
    ON CONFLICT (endpoint) DO UPDATE SET keys_p256dh = ${p256dh}, keys_auth = ${auth}
  `;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await ensureInit();
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
}

export async function getAllPushSubscriptions(): Promise<{ endpoint: string; keys_p256dh: string; keys_auth: string }[]> {
  await ensureInit();
  const { rows } = await sql`SELECT endpoint, keys_p256dh, keys_auth FROM push_subscriptions`;
  return rows.map((row) => ({
    endpoint: row.endpoint as string,
    keys_p256dh: row.keys_p256dh as string,
    keys_auth: row.keys_auth as string,
  }));
}

// Bulk import
export async function bulkCreateContacts(contacts: Omit<Contact, 'created_at' | 'updated_at'>[]): Promise<number> {
  await ensureInit();
  let count = 0;
  for (const c of contacts) {
    await sql`
      INSERT INTO contacts (id, name, birthday, birth_year, event_type, event_label, phone, email, photo_url, relationship, notes, notify_whatsapp, whatsapp_message, reminder_days)
      VALUES (${c.id}, ${c.name}, ${c.birthday}, ${c.birth_year}, ${c.event_type}, ${c.event_label}, ${c.phone}, ${c.email}, ${c.photo_url}, ${c.relationship}, ${c.notes}, ${c.notify_whatsapp}, ${c.whatsapp_message}, ${c.reminder_days})
      ON CONFLICT (id) DO UPDATE SET
        name = ${c.name}, birthday = ${c.birthday}, birth_year = ${c.birth_year},
        event_type = ${c.event_type}, event_label = ${c.event_label},
        phone = ${c.phone}, email = ${c.email}, photo_url = ${c.photo_url},
        relationship = ${c.relationship}, notes = ${c.notes},
        notify_whatsapp = ${c.notify_whatsapp}, whatsapp_message = ${c.whatsapp_message},
        reminder_days = ${c.reminder_days}, updated_at = NOW()
    `;
    count++;
  }
  return count;
}
