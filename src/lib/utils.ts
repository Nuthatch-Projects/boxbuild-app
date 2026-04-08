import { format, differenceInYears, differenceInDays, addYears, isPast, isToday, parseISO } from 'date-fns';
import { Contact, BirthdayEvent } from './types';
import { getZodiacSign } from './zodiac';

export function getNextBirthday(birthday: string): Date {
  const now = new Date();
  const bday = parseISO(birthday);
  const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());

  if (isPast(thisYear) && !isToday(thisYear)) {
    return addYears(thisYear, 1);
  }

  return thisYear;
}

export function getDaysUntilBirthday(birthday: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextBday = getNextBirthday(birthday);
  return differenceInDays(nextBday, today);
}

export function getAge(birthday: string, birthYear: number | null): number | null {
  if (!birthYear) return null;
  const bday = parseISO(birthday);
  const withYear = new Date(birthYear, bday.getMonth(), bday.getDate());
  return differenceInYears(new Date(), withYear);
}

export function getUpcomingAge(birthday: string, birthYear: number | null): number | null {
  if (!birthYear) return null;
  const nextBday = getNextBirthday(birthday);
  return nextBday.getFullYear() - birthYear;
}

export function toBirthdayEvent(contact: Contact): BirthdayEvent {
  const bday = parseISO(contact.birthday);
  const month = bday.getMonth() + 1;
  const day = bday.getDate();
  const zodiac = getZodiacSign(month, day);

  return {
    contact,
    daysUntil: getDaysUntilBirthday(contact.birthday),
    nextBirthday: getNextBirthday(contact.birthday),
    age: getUpcomingAge(contact.birthday, contact.birth_year),
    zodiacSign: zodiac.sign,
    zodiacEmoji: zodiac.emoji,
  };
}

export function formatBirthday(birthday: string): string {
  return format(parseISO(birthday), 'MMMM d');
}

export function formatFullBirthday(birthday: string, birthYear: number | null): string {
  if (birthYear) {
    const bday = parseISO(birthday);
    const withYear = new Date(birthYear, bday.getMonth(), bday.getDate());
    return format(withYear, 'MMMM d, yyyy');
  }
  return format(parseISO(birthday), 'MMMM d');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getDaysUntilText(days: number): string {
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `In ${months} month${months > 1 ? 's' : ''}`;
  }
  return `In ${days} days`;
}

export function getRelationshipColor(relationship: string): string {
  const colors: Record<string, string> = {
    Family: 'bg-purple-100 text-purple-800',
    Friend: 'bg-blue-100 text-blue-800',
    Partner: 'bg-pink-100 text-pink-800',
    Colleague: 'bg-green-100 text-green-800',
    Acquaintance: 'bg-yellow-100 text-yellow-800',
    Other: 'bg-gray-100 text-gray-800',
  };
  return colors[relationship] || colors.Other;
}

export function composeWhatsAppMessage(
  template: string,
  name: string,
  age: number | null
): string {
  let message = template.replace(/{name}/g, name);
  if (age !== null) {
    message = message.replace(/{age}/g, age.toString());
  } else {
    message = message.replace(/\s*They're turning {age}\.\s*/g, ' ');
    message = message.replace(/{age}/g, '');
  }
  return message;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  if (phone) {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleaned}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function buildWhatsAppGroupUrl(groupLink: string, message: string): string {
  // If user has a group invite link, we can't pre-fill messages to groups easily
  // Instead we use the web.whatsapp.com approach or just copy to clipboard
  const encoded = encodeURIComponent(message);
  return `https://wa.me/?text=${encoded}`;
}
