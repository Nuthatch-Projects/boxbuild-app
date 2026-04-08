'use client';

import { useState, useEffect, useMemo } from 'react';
import { Cake, Users, CalendarDays, Gift, PartyPopper, Clock, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Contact, AppSettings } from '@/lib/types';
import { toBirthdayEvent } from '@/lib/utils';
import BirthdayCard from '@/components/BirthdayCard';
import ConfettiEffect from '@/components/ConfettiEffect';
import WhatsAppComposer from '@/components/WhatsAppComposer';
import SearchBar from '@/components/SearchBar';
import EmptyState from '@/components/EmptyState';

export default function Dashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsAppContact, setWhatsAppContact] = useState<Contact | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/contacts').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]).then(([contactsData, settingsData]) => {
      setContacts(contactsData);
      setSettings(settingsData);
      setLoading(false);
    });
  }, []);

  const events = useMemo(
    () =>
      contacts
        .map(toBirthdayEvent)
        .sort((a, b) => a.daysUntil - b.daysUntil),
    [contacts]
  );

  const todayBirthdays = events.filter((e) => e.daysUntil === 0);
  const thisWeek = events.filter((e) => e.daysUntil > 0 && e.daysUntil <= 7);
  const thisMonth = events.filter((e) => e.daysUntil > 7 && e.daysUntil <= 30);
  const hasTodayBirthdays = todayBirthdays.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to <span className="gradient-text">BirthdayBuzz</span>
          </h1>
          <p className="text-gray-500 mt-1">
            Your personal birthday reminder assistant
          </p>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <ConfettiEffect active={hasTodayBirthdays} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {hasTodayBirthdays ? (
              <>
                <span className="gradient-text">Happy Birthday</span> Day!
              </>
            ) : (
              <span className="gradient-text">Dashboard</span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">
            {hasTodayBirthdays
              ? `${todayBirthdays.length} birthday${todayBirthdays.length > 1 ? 's' : ''} today!`
              : events.length > 0
              ? `Next birthday: ${events[0].contact.name} in ${events[0].daysUntil} day${events[0].daysUntil > 1 ? 's' : ''}`
              : 'No upcoming birthdays'}
          </p>
        </div>
        <SearchBar />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
          <p className="text-xs text-gray-500">Total Contacts</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
              <Cake className="w-5 h-5 text-pink-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {todayBirthdays.length}
          </p>
          <p className="text-xs text-gray-500">Today</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{thisWeek.length}</p>
          <p className="text-xs text-gray-500">This Week</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{thisMonth.length}</p>
          <p className="text-xs text-gray-500">This Month</p>
        </div>
      </div>

      {/* Today's Birthdays */}
      {hasTodayBirthdays && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <PartyPopper className="w-5 h-5 text-pink-500" />
            <h2 className="text-xl font-bold text-gray-900">
              Today&apos;s Birthdays
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayBirthdays.map((event, i) => (
              <div
                key={event.contact.id}
                className={`animate-slide-up stagger-${i + 1} birthday-glow rounded-2xl`}
              >
                <BirthdayCard
                  event={event}
                  onWhatsApp={() => setWhatsAppContact(event.contact)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* This Week */}
      {thisWeek.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900">This Week</h2>
          </div>
          <div className="space-y-2">
            {thisWeek.map((event, i) => (
              <div
                key={event.contact.id}
                className={`animate-slide-up stagger-${i + 1}`}
              >
                <BirthdayCard event={event} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* This Month */}
      {thisMonth.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">
              Coming Up This Month
            </h2>
          </div>
          <div className="space-y-2">
            {thisMonth.map((event, i) => (
              <div
                key={event.contact.id}
                className={`animate-slide-up stagger-${i + 1}`}
              >
                <BirthdayCard event={event} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Upcoming */}
      {events.filter((e) => e.daysUntil > 30).length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">All Upcoming</h2>
            <Link
              href="/calendar"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View Calendar
            </Link>
          </div>
          <div className="space-y-2">
            {events
              .filter((e) => e.daysUntil > 30)
              .slice(0, 10)
              .map((event) => (
                <BirthdayCard
                  key={event.contact.id}
                  event={event}
                  compact
                />
              ))}
          </div>
        </div>
      )}

      {/* Quick add FAB */}
      <Link
        href="/contacts/new"
        className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-300 hover:shadow-xl hover:scale-105 transition-all z-40"
      >
        <UserPlus className="w-6 h-6" />
      </Link>

      {/* WhatsApp Composer Modal */}
      {whatsAppContact && settings && (
        <WhatsAppComposer
          contact={whatsAppContact}
          settings={settings}
          onClose={() => setWhatsAppContact(null)}
        />
      )}
    </div>
  );
}
