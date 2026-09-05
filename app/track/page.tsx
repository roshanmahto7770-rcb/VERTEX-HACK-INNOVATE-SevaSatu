'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Building, MapPin, CheckCircle2, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { Grievance, MasterComplaint, StatusLog } from '@/lib/types';
import { MiniMap } from '@/components/common/MiniMap';

export default function TrackPage() {
  const [ticketInput, setTicketInput] = useState('#C-1248');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<{
    type: 'grievance' | 'master';
    grievance?: Grievance;
    master?: MasterComplaint | null;
    logs?: StatusLog[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setData(null);

    try {
      const formatted = ticketInput.trim().replace(/^#/, 'c-');
      const res = await fetch(`/api/grievances/track/${encodeURIComponent(formatted)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No grievance record found with this ticket number.');
      }

      setData({
        type: json.type,
        grievance: json.type === 'grievance' ? json.data : undefined,
        master: json.type === 'master' ? json.data : json.master,
        logs: json.logs || [],
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to locate grievance.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Top return link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Citizen Portal
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Citizen Grievance Redressal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
              Track Complaint Status
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter your complaint ticket number to view live field status, assigned engineer, and resolution milestones.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. #C-1248 or C-1247"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              className="flex-1 px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl shadow-md shadow-orange-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Search className="w-4 h-4" />
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Quick presets */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Try sample tickets:</span>
            <button
              type="button"
              onClick={() => setTicketInput('#C-1248')}
              className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 font-mono text-gray-700"
            >
              #C-1248
            </button>
            <button
              type="button"
              onClick={() => setTicketInput('#C-1247')}
              className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 font-mono text-gray-700"
            >
              #C-1247
            </button>
            <button
              type="button"
              onClick={() => setTicketInput('MST-2025-0841')}
              className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 font-mono text-gray-700"
            >
              MST-2025-0841
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {data && data.grievance && (
            <div className="space-y-4 bg-slate-50 border border-gray-100 rounded-2xl p-5 sm:p-6 animate-in fade-in">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-md">
                    {data.grievance.ticketNumber}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">
                    {data.grievance.issueTitle}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {data.grievance.description}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                    data.grievance.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : data.grievance.status === 'In_Progress'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {data.grievance.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100">
                  <Building className="w-4 h-4 text-orange-600" />
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">
                      Department
                    </span>
                    <span className="font-bold text-gray-800">
                      {data.grievance.department}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">
                      Location
                    </span>
                    <span className="font-bold text-gray-800">
                      {data.grievance.addressText}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── INCIDENT SITE MINI MAP ── */}
              {data.grievance.latitude && data.grievance.longitude && (
                <div className="pt-2">
                  <MiniMap
                    latitude={data.grievance.latitude}
                    longitude={data.grievance.longitude}
                    addressText={data.grievance.addressText}
                    height="h-48"
                    showNavigationButton={true}
                  />
                </div>
              )}

              {data.grievance.officerComment && (
                <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Official Field Officer Response:
                  </span>
                  <p className="text-xs font-medium text-gray-800">
                    &ldquo;{data.grievance.officerComment}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
