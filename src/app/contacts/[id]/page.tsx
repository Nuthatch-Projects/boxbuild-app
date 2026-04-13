'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Phone,
  Mail,
  Star,
  MessageCircle,
  Calendar,
  Bell,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Contact, AppSettings, getEventTypeInfo, getEventTypeColor, getYearsLabel } from '@/lib/types';
import { toBirthdayEvent, formatFullBirthday, getInitials, getDaysUntilText, getRelationshipColor, getAge } from '@/lib/utils';
import ContactForm from '@/components/ContactForm';
import WhatsAppComposer from '@/components/WhatsAppComposer';
import ConfettiEffect from '@/components/ConfettiEffect';

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/contacts/${id}`).then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]).then(([contactData, settingsData]) => {
      setContact(contactData);
      setSettings(settingsData);
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    setDeleting(true);
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    router.push('/contacts');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6 md:p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Contact not found</h1>
        <Link href="/contacts" className="text-purple-600 hover:underline mt-2 inline-block">
          Back to contacts
        </Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <div className="mb-8">
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to details
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Edit3 className="w-7 h-7 text-purple-500" />
            Edit {contact.name}
          </h1>
        </div>
        <ContactForm contact={contact} />
      </div>
    );
  }

  const event = toBirthdayEvent(contact);
  const isToday = event.daysUntil === 0;
  const currentAge = getAge(contact.birthday, contact.birth_year);
  const reminderDays: number[] = JSON.parse(contact.reminder_days || '[0,1,7]');
  const eventInfo = getEventTypeInfo(contact.event_type);
  const eventColorClass = getEventTypeColor(contact.event_type);

  const dateLabel = contact.event_type === 'birthday' ? 'Birthday' :
                    contact.event_type === 'anniversary' ? 'Anniversary Date' :
                    contact.event_label || eventInfo.label;

  const ageLabel = contact.event_type === 'birthday'
    ? (currentAge !== null ? `${currentAge} years old` : null)
    : (currentAge !== null ? getYearsLabel(contact.event_type, currentAge) : null);

  const countdownExtra = event.age !== null
    ? ` (${getYearsLabel(contact.event_type, event.age)})`
    : '';

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <ConfettiEffect active={isToday} />

      {/* Back button */}
      <Link
        href="/contacts"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to contacts
      </Link>

      {/* Profile header */}
      <div
        className={`rounded-2xl p-6 md:p-8 mb-6 ${
          isToday
            ? 'bg-gradient-to-br from-pink-50 via-purple-50 to-yellow-50 border-2 border-pink-200 birthday-glow'
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div
            className={`w-24 h-24 rounded-3xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${
              isToday
                ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white shadow-lg shadow-pink-200'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {contact.photo_url ? (
              <img
                src={contact.photo_url}
                alt={contact.name}
                className="w-24 h-24 rounded-3xl object-cover"
              />
            ) : (
              getInitials(contact.name)
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {contact.name}
                  {isToday && ` ${eventInfo.icon}`}
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${eventColorClass}`}>
                    {eventInfo.icon} {contact.event_label || eventInfo.label}
                  </span>
                  <span
                    className={`text-sm px-3 py-1 rounded-full font-medium ${getRelationshipColor(
                      contact.relationship
                    )}`}
                  >
                    {contact.relationship}
                  </span>
                  {contact.event_type === 'birthday' && (
                    <span className="text-sm px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {event.zodiacEmoji} {event.zodiacSign}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-2.5 hover:bg-red-50 rounded-xl transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                  <span className="text-lg">{eventInfo.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{dateLabel}</p>
                  <p className="font-semibold text-gray-900">
                    {formatFullBirthday(contact.birthday, contact.birth_year)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Countdown</p>
                  <p className="font-semibold text-gray-900">
                    {getDaysUntilText(event.daysUntil)}
                    {countdownExtra}
                  </p>
                </div>
              </div>

              {ageLabel && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {contact.event_type === 'birthday' ? 'Current Age' : 'Duration'}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {ageLabel}
                    </p>
                  </div>
                </div>
              )}

              {contact.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-900">{contact.phone}</p>
                  </div>
                </div>
              )}

              {contact.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">{contact.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {contact.notes && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-2">Notes</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}

      {/* Reminders */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-amber-500" />
          Reminders
        </h3>
        <div className="flex flex-wrap gap-2">
          {reminderDays.map((day) => (
            <span
              key={day}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
            >
              {day === 0
                ? 'On the day'
                : day === 1
                ? '1 day before'
                : `${day} days before`}
            </span>
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      {contact.notify_whatsapp && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-green-500" />
            WhatsApp Notification
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            A message will be composed for your family WhatsApp group on{' '}
            {contact.name}&apos;s {(contact.event_label || eventInfo.label).toLowerCase()}.
          </p>
          <button
            onClick={() => setShowWhatsApp(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Preview &amp; Send Message
          </button>
        </div>
      )}

      {showWhatsApp && settings && (
        <WhatsAppComposer
          contact={contact}
          settings={settings}
          onClose={() => setShowWhatsApp(false)}
        />
      )}
    </div>
  );
}
