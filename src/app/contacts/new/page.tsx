'use client';

import { UserPlus } from 'lucide-react';
import ContactForm from '@/components/ContactForm';

export default function NewContactPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <UserPlus className="w-7 h-7 text-purple-500" />
          Add New Contact
        </h1>
        <p className="text-gray-500 mt-1">
          Add someone&apos;s birthday so you&apos;ll never forget to wish them.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
