'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Contact, getEventTypeInfo } from '@/lib/types';
import Link from 'next/link';

interface CalendarProps {
  contacts: Contact[];
}

export default function Calendar({ contacts }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const birthdayMap = useMemo(() => {
    const map = new Map<string, Contact[]>();
    for (const contact of contacts) {
      const bday = parseISO(contact.birthday);
      const key = `${bday.getMonth() + 1}-${bday.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(contact);
    }
    return map;
  }, [contacts]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-gray-500 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const key = `${day.getMonth() + 1}-${day.getDate()}`;
          const birthdays = birthdayMap.get(key) || [];
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);

          return (
            <div
              key={idx}
              className={`min-h-[80px] md:min-h-[100px] p-1.5 border-b border-r border-gray-50 ${
                !inMonth ? 'bg-gray-50/50' : ''
              } ${today ? 'bg-purple-50/50' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    today
                      ? 'bg-purple-600 text-white'
                      : !inMonth
                      ? 'text-gray-300'
                      : 'text-gray-600'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {birthdays.length > 0 && (
                  <span className="text-xs">{getEventTypeInfo(birthdays[0].event_type).icon}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {birthdays.slice(0, 3).map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className={`block text-[10px] md:text-xs px-1.5 py-0.5 rounded-md truncate font-medium transition-colors ${
                      today
                        ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    {contact.name}
                  </Link>
                ))}
                {birthdays.length > 3 && (
                  <span className="text-[10px] text-gray-400 px-1.5">
                    +{birthdays.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
