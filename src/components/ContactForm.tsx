'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  X,
  User,
  Calendar,
  Phone,
  Mail,
  Tag,
  FileText,
  MessageCircle,
  Bell,
  Image,
  Sparkles,
} from 'lucide-react';
import { Contact, ContactFormData, RELATIONSHIP_OPTIONS, REMINDER_OPTIONS, EVENT_TYPE_OPTIONS, EventType, getEventTypeInfo } from '@/lib/types';

interface ContactFormProps {
  contact?: Contact;
  onSave?: (data: ContactFormData) => void;
}

export default function ContactForm({ contact, onSave }: ContactFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ContactFormData>({
    name: contact?.name || '',
    birthday: contact?.birthday || '',
    birth_year: contact?.birth_year || null,
    event_type: contact?.event_type || 'birthday',
    event_label: contact?.event_label || 'Birthday',
    phone: contact?.phone || '',
    email: contact?.email || '',
    photo_url: contact?.photo_url || '',
    relationship: contact?.relationship || 'Other',
    notes: contact?.notes || '',
    notify_whatsapp: contact?.notify_whatsapp || false,
    whatsapp_message: contact?.whatsapp_message || '',
    reminder_days: contact?.reminder_days
      ? JSON.parse(contact.reminder_days)
      : [0, 1, 3],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (onSave) {
        onSave(form);
        return;
      }

      const url = contact
        ? `/api/contacts/${contact.id}`
        : '/api/contacts';
      const method = contact ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/contacts/${data.id}`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      reminder_days: prev.reminder_days.includes(day)
        ? prev.reminder_days.filter((d) => d !== day)
        : [...prev.reminder_days, day].sort((a, b) => a - b),
    }));
  };

  const handleEventTypeChange = (eventType: EventType) => {
    const info = getEventTypeInfo(eventType);
    setForm({
      ...form,
      event_type: eventType,
      event_label: eventType === 'custom' ? form.event_label : info.defaultLabel,
    });
  };

  const selectedEventInfo = getEventTypeInfo(form.event_type);
  const dateLabel = form.event_type === 'birthday' ? 'Date of Birth' :
                    form.event_type === 'anniversary' ? 'Anniversary Date' :
                    form.event_type === 'custom' ? 'Date' :
                    `${form.event_label} Date`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Event Type */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          What are you tracking?
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleEventTypeChange(opt.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm font-medium transition-all ${
                form.event_type === opt.value
                  ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
        {(form.event_type === 'custom' || form.event_type === 'anniversary') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Custom Label
            </label>
            <input
              type="text"
              value={form.event_label}
              onChange={(e) => setForm({ ...form, event_label: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder={form.event_type === 'anniversary' ? 'e.g. Wedding Anniversary' : 'e.g. First Day at Work'}
            />
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-500" />
          {form.event_type === 'anniversary' ? 'Details' : 'Person Details'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {form.event_type === 'anniversary' ? 'Name / Couple *' : 'Full Name *'}
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder={form.event_type === 'anniversary' ? 'e.g. Mom & Dad' : 'e.g. Jane Doe'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {dateLabel} *
            </label>
            <input
              type="date"
              required
              value={form.birthday}
              onChange={(e) => {
                const val = e.target.value;
                setForm({
                  ...form,
                  birthday: val,
                  birth_year: val ? parseInt(val.split('-')[0]) : null,
                });
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Tag className="w-3.5 h-3.5 inline mr-1" />
              Relationship
            </label>
            <select
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 bg-white"
            >
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1" />
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Mail className="w-3.5 h-3.5 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="jane@example.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Image className="w-3.5 h-3.5 inline mr-1" />
              Photo URL
            </label>
            <input
              type="url"
              value={form.photo_url}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
              placeholder="Gift ideas, preferences, etc."
            />
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          Reminders
        </h3>
        <p className="text-sm text-gray-500">
          Choose when you want to be reminded about this {selectedEventInfo.label.toLowerCase()}.
        </p>
        <div className="flex flex-wrap gap-2">
          {REMINDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleReminderDay(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                form.reminder_days.includes(opt.value)
                  ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-500" />
          WhatsApp Notification
        </h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={form.notify_whatsapp}
              onChange={(e) =>
                setForm({ ...form, notify_whatsapp: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
            <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            Notify family WhatsApp group on the day
          </span>
        </label>

        {form.notify_whatsapp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Custom Message (optional)
            </label>
            <textarea
              value={form.whatsapp_message}
              onChange={(e) =>
                setForm({ ...form, whatsapp_message: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
              placeholder="Leave empty to use the default message. Use {name} and {age} as placeholders."
            />
            <p className="text-xs text-gray-400 mt-1">
              Available placeholders: {'{name}'}, {'{age}'}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-200"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : contact ? 'Update' : `Add ${selectedEventInfo.label}`}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
