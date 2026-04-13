'use client';

import Link from 'next/link';
import { MessageCircle, Clock, Star } from 'lucide-react';
import { BirthdayEvent, getEventTypeInfo, getEventTypeColor, getYearsLabel } from '@/lib/types';
import {
  formatBirthday,
  getDaysUntilText,
  getInitials,
  getRelationshipColor,
} from '@/lib/utils';

interface BirthdayCardProps {
  event: BirthdayEvent;
  compact?: boolean;
  onWhatsApp?: () => void;
}

export default function BirthdayCard({ event, compact, onWhatsApp }: BirthdayCardProps) {
  const { contact, daysUntil, age, zodiacEmoji, zodiacSign } = event;
  const isToday = daysUntil === 0;
  const isSoon = daysUntil > 0 && daysUntil <= 7;
  const eventInfo = getEventTypeInfo(contact.event_type);
  const eventColorClass = getEventTypeColor(contact.event_type);

  if (compact) {
    return (
      <Link
        href={`/contacts/${contact.id}`}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:shadow-md ${
          isToday
            ? 'bg-gradient-to-r from-pink-50 to-yellow-50 border border-pink-200 shadow-sm'
            : 'bg-white border border-gray-100 hover:border-gray-200'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            isToday
              ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {contact.photo_url ? (
            <img
              src={contact.photo_url}
              alt={contact.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            getInitials(contact.name)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {contact.name}
            {isToday && ` ${eventInfo.icon}`}
          </p>
          <p className="text-xs text-gray-500">
            {formatBirthday(contact.birthday)}
            {age !== null && ` · ${getYearsLabel(contact.event_type, age)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${eventColorClass}`}>
            {contact.event_label || eventInfo.label}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              isToday
                ? 'bg-pink-100 text-pink-700'
                : isSoon
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {getDaysUntilText(daysUntil)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-300 hover:shadow-lg ${
        isToday
          ? 'bg-gradient-to-br from-pink-50 via-purple-50 to-yellow-50 border-2 border-pink-200 shadow-md'
          : 'bg-white border border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold ${
              isToday
                ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white shadow-lg shadow-pink-200'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {contact.photo_url ? (
              <img
                src={contact.photo_url}
                alt={contact.name}
                className="w-14 h-14 rounded-2xl object-cover"
              />
            ) : (
              getInitials(contact.name)
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {contact.name}
              {isToday && ` ${eventInfo.icon}`}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <span>{eventInfo.icon}</span>
              {formatBirthday(contact.birthday)}
              {age !== null && ` · ${getYearsLabel(contact.event_type, age)}`}
            </p>
          </div>
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            isToday
              ? 'bg-pink-100 text-pink-700 animate-pulse'
              : isSoon
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {getDaysUntilText(daysUntil)}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${eventColorClass}`}>
          {contact.event_label || eventInfo.label}
        </span>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRelationshipColor(
            contact.relationship
          )}`}
        >
          {contact.relationship}
        </span>
        {contact.event_type === 'birthday' && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium flex items-center gap-1">
            <Star className="w-3 h-3" />
            {zodiacEmoji} {zodiacSign}
          </span>
        )}
        {contact.notify_whatsapp && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium">
            WhatsApp
          </span>
        )}
      </div>

      {contact.notes && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{contact.notes}</p>
      )}

      <div className="flex items-center gap-2">
        <Link
          href={`/contacts/${contact.id}`}
          className="flex-1 text-center px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          View Details
        </Link>
        {contact.notify_whatsapp && isToday && onWhatsApp && (
          <button
            onClick={onWhatsApp}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Send Wish
          </button>
        )}
        {!isToday && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            Reminder set
          </div>
        )}
      </div>
    </div>
  );
}
