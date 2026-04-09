import { createClient, type Client, type InStatement } from '@libsql/client';
import { AppSettings, Contact, DEFAULT_SETTINGS } from './types';

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'file:data/birthdays.db';
    const authToken = process.env.TURSO_AUTH_TOKEN;

    // For local file URLs, ensure directory exists
    if (url.startsWith('file:')) {
      const fs = require('fs');
      const path = require('path');
      const filePath = url.replace('file:', '');
      const dir = path.dirname(path.resolve(process.cwd(), filePath));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    client = createClient({ url, authToken });
  }
  return client;
}

export async function initializeDb(): Promise<void> {
  const db = getClient();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      birthday TEXT NOT NULL,
      birth_year INTEGER,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      photo_url TEXT DEFAULT '',
      relationship TEXT DEFAULT 'Other',
      notes TEXT DEFAULT '',
      notify_whatsapp INTEGER DEFAULT 0,
      whatsapp_message TEXT DEFAULT '',
      reminder_days TEXT DEFAULT '[0,1,7]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sent_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id TEXT NOT NULL,
      reminder_type TEXT NOT NULL,
      sent_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL UNIQUE,
      keys_p256dh TEXT NOT NULL,
      keys_auth TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_birthday ON contacts(birthday);
    CREATE INDEX IF NOT EXISTS idx_sent_reminders_contact ON sent_reminders(contact_id, sent_at);
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
  `);

  // Initialize default settings
  const entries = Object.entries(DEFAULT_SETTINGS) as [string, string | boolean][];
  for (const [key, value] of entries) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      args: [key, JSON.stringify(value)],
    });
  }
}

// Ensure DB is initialized before any operation
let initialized = false;
async function ensureInit(): Promise<Client> {
  if (!initialized) {
    await initializeDb();
    initialized = true;
  }
  return getClient();
}

function rowToContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    name: row.name as string,
    birthday: row.birthday as string,
    birth_year: row.birth_year as number | null,
    phone: (row.phone as string) || '',
    email: (row.email as string) || '',
    photo_url: (row.photo_url as string) || '',
    relationship: (row.relationship as string) || 'Other',
    notes: (row.notes as string) || '',
    notify_whatsapp: Boolean(row.notify_whatsapp),
    whatsapp_message: (row.whatsapp_message as string) || '',
    reminder_days: (row.reminder_days as string) || '[0,1,7]',
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// Contact operations
export async function getAllContacts(): Promise<Contact[]> {
  const db = await ensureInit();
  const result = await db.execute('SELECT * FROM contacts ORDER BY name');
  return result.rows.map((row) => rowToContact(row as unknown as Record<string, unknown>));
}

export async function getContactById(id: string): Promise<Contact | undefined> {
  const db = await ensureInit();
  const result = await db.execute({ sql: 'SELECT * FROM contacts WHERE id = ?', args: [id] });
  if (result.rows.length === 0) return undefined;
  return rowToContact(result.rows[0] as unknown as Record<string, unknown>);
}

export async function createContact(contact: Omit<Contact, 'created_at' | 'updated_at'>): Promise<Contact> {
  const db = await ensureInit();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO contacts (id, name, birthday, birth_year, phone, email, photo_url, relationship, notes, notify_whatsapp, whatsapp_message, reminder_days, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      contact.id, contact.name, contact.birthday, contact.birth_year,
      contact.phone, contact.email, contact.photo_url, contact.relationship,
      contact.notes, contact.notify_whatsapp ? 1 : 0, contact.whatsapp_message,
      contact.reminder_days, now, now,
    ],
  });
  return (await getContactById(contact.id))!;
}

export async function updateContact(
  id: string,
  data: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>
): Promise<Contact | undefined> {
  const existing = await getContactById(id);
  if (!existing) return undefined;

  const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
  await (await ensureInit()).execute({
    sql: `UPDATE contacts SET name=?, birthday=?, birth_year=?, phone=?, email=?, photo_url=?, relationship=?, notes=?, notify_whatsapp=?, whatsapp_message=?, reminder_days=?, updated_at=?
     WHERE id=?`,
    args: [
      updated.name, updated.birthday, updated.birth_year, updated.phone,
      updated.email, updated.photo_url, updated.relationship, updated.notes,
      updated.notify_whatsapp ? 1 : 0, updated.whatsapp_message, updated.reminder_days,
      updated.updated_at, id,
    ],
  });
  return getContactById(id);
}

export async function deleteContact(id: string): Promise<boolean> {
  const db = await ensureInit();
  const result = await db.execute({ sql: 'DELETE FROM contacts WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}

export async function searchContacts(query: string): Promise<Contact[]> {
  const db = await ensureInit();
  const result = await db.execute({
    sql: 'SELECT * FROM contacts WHERE name LIKE ? OR notes LIKE ? ORDER BY name',
    args: [`%${query}%`, `%${query}%`],
  });
  return result.rows.map((row) => rowToContact(row as unknown as Record<string, unknown>));
}

// Settings operations
export async function getSettings(): Promise<AppSettings> {
  const db = await ensureInit();
  const result = await db.execute('SELECT key, value FROM settings');
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of result.rows) {
    try {
      (settings as Record<string, unknown>)[row.key as string] = JSON.parse(row.value as string);
    } catch {
      (settings as Record<string, unknown>)[row.key as string] = row.value;
    }
  }
  return settings;
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const db = await ensureInit();
  for (const [key, value] of Object.entries(updates)) {
    await db.execute({
      sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      args: [key, JSON.stringify(value)],
    });
  }
  return getSettings();
}

// Reminder operations
export async function hasReminderBeenSent(contactId: string, reminderType: string, date: string): Promise<boolean> {
  const db = await ensureInit();
  const result = await db.execute({
    sql: "SELECT 1 FROM sent_reminders WHERE contact_id = ? AND reminder_type = ? AND date(sent_at) = date(?)",
    args: [contactId, reminderType, date],
  });
  return result.rows.length > 0;
}

export async function markReminderSent(contactId: string, reminderType: string): Promise<void> {
  const db = await ensureInit();
  await db.execute({
    sql: 'INSERT INTO sent_reminders (contact_id, reminder_type) VALUES (?, ?)',
    args: [contactId, reminderType],
  });
}

// Push subscription operations
export async function savePushSubscription(endpoint: string, p256dh: string, auth: string): Promise<void> {
  const db = await ensureInit();
  await db.execute({
    sql: 'INSERT OR REPLACE INTO push_subscriptions (endpoint, keys_p256dh, keys_auth) VALUES (?, ?, ?)',
    args: [endpoint, p256dh, auth],
  });
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const db = await ensureInit();
  await db.execute({
    sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?',
    args: [endpoint],
  });
}

export async function getAllPushSubscriptions(): Promise<{ endpoint: string; keys_p256dh: string; keys_auth: string }[]> {
  const db = await ensureInit();
  const result = await db.execute('SELECT endpoint, keys_p256dh, keys_auth FROM push_subscriptions');
  return result.rows.map((row) => ({
    endpoint: row.endpoint as string,
    keys_p256dh: row.keys_p256dh as string,
    keys_auth: row.keys_auth as string,
  }));
}

// Bulk import
export async function bulkCreateContacts(contacts: Omit<Contact, 'created_at' | 'updated_at'>[]): Promise<number> {
  const db = await ensureInit();
  const now = new Date().toISOString();
  const stmts: InStatement[] = contacts.map((c) => ({
    sql: `INSERT OR REPLACE INTO contacts (id, name, birthday, birth_year, phone, email, photo_url, relationship, notes, notify_whatsapp, whatsapp_message, reminder_days, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      c.id, c.name, c.birthday, c.birth_year, c.phone, c.email, c.photo_url,
      c.relationship, c.notes, c.notify_whatsapp ? 1 : 0, c.whatsapp_message,
      c.reminder_days, now, now,
    ],
  }));
  await db.batch(stmts, 'write');
  return contacts.length;
}
