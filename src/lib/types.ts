export interface Contact {
  id: string;
  name: string;
  birthday: string; // YYYY-MM-DD
  birth_year: number | null;
  phone: string;
  email: string;
  photo_url: string;
  relationship: string;
  notes: string;
  notify_whatsapp: boolean;
  whatsapp_message: string;
  reminder_days: string; // JSON array like "[0,1,3,7]"
  created_at: string;
  updated_at: string;
}

export interface ContactFormData {
  name: string;
  birthday: string;
  birth_year: number | null;
  phone: string;
  email: string;
  photo_url: string;
  relationship: string;
  notes: string;
  notify_whatsapp: boolean;
  whatsapp_message: string;
  reminder_days: number[];
}

export interface AppSettings {
  whatsapp_group_link: string;
  whatsapp_default_message: string;
  notification_enabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface BirthdayEvent {
  contact: Contact;
  daysUntil: number;
  nextBirthday: Date;
  age: number | null;
  zodiacSign: string;
  zodiacEmoji: string;
}

export const RELATIONSHIP_OPTIONS = [
  'Family',
  'Friend',
  'Partner',
  'Colleague',
  'Acquaintance',
  'Other',
] as const;

export const REMINDER_OPTIONS = [
  { value: 0, label: 'On the day' },
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
  { value: 14, label: '2 weeks before' },
  { value: 30, label: '1 month before' },
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  whatsapp_group_link: '',
  whatsapp_default_message: "Hey everyone! Just a reminder that it's {name}'s birthday today! They're turning {age}. Let's wish them a wonderful day!",
  notification_enabled: true,
  theme: 'system',
};
