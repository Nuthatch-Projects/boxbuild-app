export type EventType = 'birthday' | 'anniversary' | 'memorial' | 'graduation' | 'custom';

export interface Contact {
  id: string;
  name: string;
  birthday: string; // YYYY-MM-DD (the date field, kept as "birthday" for DB compat)
  birth_year: number | null;
  event_type: EventType;
  event_label: string; // custom label like "Wedding Anniversary", "Graduation Day"
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
  event_type: EventType;
  event_label: string;
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
  age: number | null; // years for birthday, years together for anniversary, etc.
  zodiacSign: string;
  zodiacEmoji: string;
}

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string; icon: string; defaultLabel: string }[] = [
  { value: 'birthday', label: 'Birthday', icon: '\uD83C\uDF82', defaultLabel: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary', icon: '\uD83D\uDC8D', defaultLabel: 'Anniversary' },
  { value: 'memorial', label: 'Memorial', icon: '\uD83D\uDD6F\uFE0F', defaultLabel: 'Memorial Day' },
  { value: 'graduation', label: 'Graduation', icon: '\uD83C\uDF93', defaultLabel: 'Graduation Day' },
  { value: 'custom', label: 'Custom', icon: '\uD83D\uDCC5', defaultLabel: 'Special Date' },
];

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

export function getEventTypeInfo(eventType: EventType) {
  return EVENT_TYPE_OPTIONS.find((e) => e.value === eventType) || EVENT_TYPE_OPTIONS[0];
}

export function getEventTypeColor(eventType: EventType): string {
  const colors: Record<EventType, string> = {
    birthday: 'bg-pink-100 text-pink-700',
    anniversary: 'bg-rose-100 text-rose-700',
    memorial: 'bg-slate-100 text-slate-700',
    graduation: 'bg-blue-100 text-blue-700',
    custom: 'bg-teal-100 text-teal-700',
  };
  return colors[eventType] || colors.birthday;
}

export function getYearsLabel(eventType: EventType, years: number): string {
  switch (eventType) {
    case 'birthday':
      return `Turning ${years}`;
    case 'anniversary':
      return `${years} year${years !== 1 ? 's' : ''}`;
    case 'memorial':
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    case 'graduation':
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    case 'custom':
      return `${years} year${years !== 1 ? 's' : ''}`;
    default:
      return `${years}`;
  }
}
