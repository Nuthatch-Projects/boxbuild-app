'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, Filter, Grid3X3, List, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Contact } from '@/lib/types';
import { toBirthdayEvent } from '@/lib/utils';
import BirthdayCard from '@/components/BirthdayCard';
import SearchBar from '@/components/SearchBar';
import EmptyState from '@/components/EmptyState';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [filterRelationship, setFilterRelationship] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'birthday'>('birthday');

  useEffect(() => {
    fetch('/api/contacts')
      .then((r) => r.json())
      .then((data) => {
        setContacts(data);
        setLoading(false);
      });
  }, []);

  const events = useMemo(() => {
    let filtered = contacts;
    if (filterRelationship !== 'all') {
      filtered = filtered.filter((c) => c.relationship === filterRelationship);
    }
    const mapped = filtered.map(toBirthdayEvent);
    if (sortBy === 'birthday') {
      mapped.sort((a, b) => a.daysUntil - b.daysUntil);
    } else {
      mapped.sort((a, b) => a.contact.name.localeCompare(b.contact.name));
    }
    return mapped;
  }, [contacts, filterRelationship, sortBy]);

  const relationships = useMemo(() => {
    const set = new Set(contacts.map((c) => c.relationship));
    return Array.from(set).sort();
  }, [contacts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-500" />
            Contacts
          </h1>
          <p className="text-gray-500 mt-1">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar />
          <Link
            href="/contacts/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-200 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </Link>
        </div>
      </div>

      {contacts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterRelationship}
                onChange={(e) => setFilterRelationship(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Relationships</option>
                {relationships.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'name' | 'birthday')
              }
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="birthday">Sort by Birthday</option>
              <option value="name">Sort by Name</option>
            </select>

            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 ml-auto">
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  view === 'list'
                    ? 'bg-white shadow-sm text-purple-600'
                    : 'text-gray-400'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  view === 'grid'
                    ? 'bg-white shadow-sm text-purple-600'
                    : 'text-gray-400'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contact list */}
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event, i) => (
                <div
                  key={event.contact.id}
                  className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}
                >
                  <BirthdayCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event, i) => (
                <div
                  key={event.contact.id}
                  className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}
                >
                  <BirthdayCard event={event} compact />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
