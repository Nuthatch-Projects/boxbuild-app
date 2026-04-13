'use client';

import Link from 'next/link';
import { UserPlus, CalendarDays } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = 'No dates tracked yet',
  description = "Add your first contact to start tracking important dates. You'll never forget one again!",
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <CalendarDays className="w-10 h-10 text-purple-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">{description}</p>
      <Link
        href="/contacts/new"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-200"
      >
        <UserPlus className="w-5 h-5" />
        Add Your First Contact
      </Link>
    </div>
  );
}
