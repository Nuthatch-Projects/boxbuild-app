'use client';

import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { Contact } from '@/lib/types';
import Calendar from '@/components/Calendar';

export default function CalendarPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contacts')
      .then((r) => r.json())
      .then((data) => {
        setContacts(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-7 h-7 text-purple-500" />
          Birthday Calendar
        </h1>
        <p className="text-gray-500 mt-1">
          See all birthdays at a glance across the year.
        </p>
      </div>

      <Calendar contacts={contacts} />
    </div>
  );
}
