'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  onSubmitClick: () => void;
  onTrackClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSubmitClick, onTrackClick }) => {
  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">
            Seva<span className="text-orange-600">Setu</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="/" className="text-orange-600 font-semibold transition-colors">
            Home
          </Link>
          <a href="#how-it-works" className="hover:text-orange-600 transition-colors">
            How It Works
          </a>
          <a href="#impact" className="hover:text-orange-600 transition-colors">
            Impact
          </a>
          <a href="#departments" className="hover:text-orange-600 transition-colors">
            Departments
          </a>
          <button
            onClick={onTrackClick}
            className="hover:text-orange-600 transition-colors text-left"
          >
            Track Status
          </button>
        </nav>

        {/* Right CTA & Portal Switch */}
        <div className="flex items-center gap-3">
          <Link
            href="/officer/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-orange-600" />
            Officer Portal
          </Link>
          <button
            onClick={onTrackClick}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hidden sm:block"
          >
            Sign In
          </button>
          <button
            onClick={onSubmitClick}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm shadow-orange-600/30 transition-all transform active:scale-95"
          >
            Submit Grievance
          </button>
        </div>
      </div>
    </header>
  );
};
