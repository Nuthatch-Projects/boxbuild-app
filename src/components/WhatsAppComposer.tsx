'use client';

import { useState } from 'react';
import { MessageCircle, Send, Copy, Check, X, ExternalLink } from 'lucide-react';
import { Contact, AppSettings } from '@/lib/types';
import { composeWhatsAppMessage, getUpcomingAge, buildWhatsAppUrl } from '@/lib/utils';

interface WhatsAppComposerProps {
  contact: Contact;
  settings: AppSettings;
  onClose: () => void;
}

export default function WhatsAppComposer({
  contact,
  settings,
  onClose,
}: WhatsAppComposerProps) {
  const age = getUpcomingAge(contact.birthday, contact.birth_year);
  const template = contact.whatsapp_message || settings.whatsapp_default_message;
  const [message, setMessage] = useState(
    composeWhatsAppMessage(template, contact.name, age)
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendDirect = () => {
    const url = buildWhatsAppUrl(contact.phone, message);
    window.open(url, '_blank');
  };

  const handleSendToGroup = () => {
    // For groups, we can't directly send, so open WhatsApp with pre-filled message
    const url = buildWhatsAppUrl('', message);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-white" />
            <div>
              <h3 className="font-bold text-white">WhatsApp Birthday Wish</h3>
              <p className="text-green-100 text-sm">For {contact.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Message editor */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </>
              )}
            </button>

            {contact.phone && (
              <button
                onClick={handleSendDirect}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all"
              >
                <Send className="w-4 h-4" />
                Send directly to {contact.name}
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={handleSendToGroup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Open WhatsApp to Share in Group
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            This will open WhatsApp Web/App with the message pre-filled. You can
            then choose the group or contact to send it to.
          </p>
        </div>
      </div>
    </div>
  );
}
