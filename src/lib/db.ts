import Database from 'better-sqlite3';
import path from 'path';
import { Contact, AppSettings, DEFAULT_SETTINGS } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'birthdays.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_contacts_birthday ON contacts(birthday);
    CREATE INDEX IF NOT EXISTS idx_sent_reminders_contact ON sent_reminders(contact_id, sent_at);
  `);

  // Initialize default settings
  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  const entries = Object.entries(DEFAULT_SETTINGS) as [string, string | boolean][];
  for (const [key, value] of entries) {
    stmt.run(key, JSON.stringify(value));
  }
}

// Contact operations
export function getAllContacts(): Contact[] {
  const rows = getDb().prepare('SELECT * FROM contacts ORDER BY name').all() as Contact[];
  return rows.map((row) => ({
    ...row,
    notify_whatsapp: Boolean(row.notify_whatsapp),
  }));
}

export function getContactById(id: string): Contact | undefined {
  const row = getDb().prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact | undefined;
  if (row) {
    return { ...row, notify_whatsapp: Boolean(row.notify_whatsapp) };
  }
  return undefined;
}

export function createContact(contact: Omit<Contact, 'created_at' | 'updated_at'>): Contact {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO contacts (id, name, birthday, birth_year, phone, email, photo_url, relationship, notes, notify_whatsapp, whatsapp_message, reminder_days, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      contact.id,
      contact.name,
      contact.birthday,
      contact.birth_year,
      contact.phone,
      contact.email,
      contact.photo_url,
      contact.relationship,
      contact.notes,
      contact.notify_whatsapp ? 1 : 0,
      contact.whatsapp_message,
      contact.reminder_days,
      now,
      now
    );
  return getContactById(contact.id)!;
}

export function updateContact(
  id: string,
  data: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>
): Contact | undefined {
  const existing = getContactById(id);
  if (!existing) return undefined;

  const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
  getDb()
    .prepare(
      `UPDATE contacts SET name=?, birthday=?, birth_year=?, phone=?, email=?, photo_url=?, relationship=?, notes=?, notify_whatsapp=?, whatsapp_message=?, reminder_days=?, updated_at=?
     WHERE id=?`
    )
    .run(
      updated.name,
      updated.birthday,
      updated.birth_year,
      updated.phone,
      updated.email,
      updated.photo_url,
      updated.relationship,
      updated.notes,
      updated.notify_whatsapp ? 1 : 0,
      updated.whatsapp_message,
      updated.reminder_days,
      updated.updated_at,
      id
    );
  return getContactById(id);
}

export function deleteContact(id: string): boolean {
  const result = getDb().prepare('DELETE FROM contacts WHERE id = ?').run(id);
  return result.changes > 0;
}

export function searchContacts(query: string): Contact[] {
  const rows = getDb()
    .prepare('SELECT * FROM contacts WHERE name LIKE ? OR notes LIKE ? ORDER BY name')
    .all(`%${query}%`, `%${query}%`) as Contact[];
  return rows.map((row) => ({
    ...row,
    notify_whatsapp: Boolean(row.notify_whatsapp),
  }));
}

// Settings operations
export function getSettings(): AppSettings {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as {
    key: string;
    value: string;
  }[];
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    try {
      (settings as Record<string, unknown>)[row.key] = JSON.parse(row.value);
    } catch {
      (settings as Record<string, unknown>)[row.key] = row.value;
    }
  }
  return settings;
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const stmt = getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(updates)) {
    stmt.run(key, JSON.stringify(value));
  }
  return getSettings();
}

// Reminder operations
export function hasReminderBeenSent(contactId: string, reminderType: string, date: string): boolean {
  const row = getDb()
    .prepare(
      "SELECT 1 FROM sent_reminders WHERE contact_id = ? AND reminder_type = ? AND date(sent_at) = date(?)"
    )
    .get(contactId, reminderType, date);
  return !!row;
}

export function markReminderSent(contactId: string, reminderType: string): void {
  getDb()
    .prepare('INSERT INTO sent_reminders (contact_id, reminder_type) VALUES (?, ?)')
    .run(contactId, reminderType);
}

// Bulk import
export function bulkCreateContacts(contacts: Omit<Contact, 'created_at' | 'updated_at'>[]): number {
  const now = new Date().toISOString();
  const stmt = getDb().prepare(
    `INSERT OR REPLACE INTO contacts (id, name, birthday, birth_year, phone, email, photo_url, relationship, notes, notify_whatsapp, whatsapp_message, reminder_days, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertMany = getDb().transaction((items: typeof contacts) => {
    let count = 0;
    for (const c of items) {
      stmt.run(
        c.id, c.name, c.birthday, c.birth_year, c.phone, c.email, c.photo_url,
        c.relationship, c.notes, c.notify_whatsapp ? 1 : 0, c.whatsapp_message,
        c.reminder_days, now, now
      );
      count++;
    }
    return count;
  });

  return insertMany(contacts);
}
