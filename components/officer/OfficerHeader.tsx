'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Bell, ExternalLink } from 'lucide-react';

interface OfficerHeaderProps {
  onMenuToggle: () => void;
  title?: string;
  onNotificationsClick?: () => void;
}

export const OfficerHeader: React.FC<OfficerHeaderProps> = ({
  onMenuToggle,
  title = 'Dashboard',
  onNotificationsClick,
}) => {
  return (
    <header className="w-full h-18 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Portal Toggle */}
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-orange-600 bg-gray-50 hover:bg-orange-50/50 rounded-xl border border-gray-200 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Citizen Portal
        </Link>

        {/* Notifications Icon with Badge 3 */}
        <button
          onClick={onNotificationsClick}
          className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            3
          </span>
        </button>

        {/* Profile Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="Rohit Sharma"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};
