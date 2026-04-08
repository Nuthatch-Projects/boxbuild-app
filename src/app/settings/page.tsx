'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  MessageCircle,
  Bell,
  Upload,
  Download,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      setImportStatus('File is empty or invalid');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, '').toLowerCase());
    const contacts = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]+)/g)?.map((v) => v.replace(/^"|"$/g, '').trim()) || [];
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        const key = h === 'birth year' ? 'birth_year' :
                    h === 'whatsapp notify' ? 'notify_whatsapp' :
                    h === 'photo url' ? 'photo_url' : h;
        row[key] = values[idx] || '';
      });
      if (row.name && row.birthday) {
        contacts.push(row);
      }
    }

    if (contacts.length === 0) {
      setImportStatus('No valid contacts found in file');
      return;
    }

    const res = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts }),
    });

    if (res.ok) {
      const data = await res.json();
      setImportStatus(`Successfully imported ${data.imported} contact(s)!`);
    } else {
      setImportStatus('Import failed. Please check the file format.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportStatus(null), 4000);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSettings({ ...settings, notification_enabled: true });
        new Notification('BirthdayBuzz', {
          body: 'Notifications are now enabled!',
          icon: '/favicon.ico',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-purple-500" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Configure your birthday reminder preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* WhatsApp Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            WhatsApp Integration
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Family WhatsApp Group Link
            </label>
            <input
              type="text"
              value={settings.whatsapp_group_link}
              onChange={(e) =>
                setSettings({ ...settings, whatsapp_group_link: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="https://chat.whatsapp.com/..."
            />
            <p className="text-xs text-gray-400 mt-1">
              Optional: paste your WhatsApp group invite link for quick access.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Default Birthday Message Template
            </label>
            <textarea
              value={settings.whatsapp_default_message}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  whatsapp_default_message: e.target.value,
                })
              }
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">
              Available placeholders: {'{name}'}, {'{age}'}
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            Browser Notifications
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Enable Birthday Notifications
              </p>
              <p className="text-xs text-gray-500">
                Get notified when someone&apos;s birthday is coming up.
              </p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-200 transition-colors"
            >
              {typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
                ? 'Enabled'
                : 'Enable'}
            </button>
          </div>
        </div>

        {/* Import/Export */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Import & Export
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="csv-import"
              />
              <label
                htmlFor="csv-import"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors cursor-pointer w-full"
              >
                <Upload className="w-4 h-4" />
                Import from CSV
              </label>
            </div>
            <a
              href="/api/contacts/export"
              download
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </a>
          </div>

          {importStatus && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                importStatus.includes('Successfully')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {importStatus.includes('Successfully') ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {importStatus}
            </div>
          )}

          <p className="text-xs text-gray-400">
            CSV format: Name, Birthday (YYYY-MM-DD), Birth Year, Phone, Email,
            Relationship, Notes, WhatsApp Notify (Yes/No)
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-200"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
