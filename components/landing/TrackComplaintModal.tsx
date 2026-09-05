'use client';

import React, { useState } from 'react';
import { X, Search, CheckCircle2, Clock, AlertCircle, MapPin, Building, ShieldCheck } from 'lucide-react';
import { Grievance, MasterComplaint, StatusLog } from '@/lib/types';

interface TrackComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrackComplaintModal: React.FC<TrackComplaintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [ticketInput, setTicketInput] = useState('#C-1248');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<{
    type: 'grievance' | 'master';
    grievance?: Grievance;
    master?: MasterComplaint | null;
    logs?: StatusLog[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                Track Grievance Status
              </h3>
              <p className="text-xs text-gray-500">
                Real-time updates, officer comments & resolution progress
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Ticket ID (e.g., #C-1248 or C-1247)"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                className="w-full pl-4 pr-10 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {/* Quick buttons */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Try sample:</span>
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
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {data && data.grievance && (
            <div className="space-y-4 bg-slate-50 border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-md">
                    {data.grievance.ticketNumber}
                  </span>
                  <h4 className="text-base font-bold text-gray-900 mt-1">
                    {data.grievance.issueTitle}
                  </h4>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
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

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>{data.grievance.department}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{data.grievance.addressText}</span>
                </div>
              </div>

              {data.master && (
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-900">
                  <span className="font-bold block">
                    Part of Master Cluster: {data.master.masterTicketNumber}
                  </span>
                  <span className="text-[11px] text-purple-700">
                    Combined with {data.master.complaintCount} related complaints in the 50m radius.
                  </span>
                </div>
              )}

              {data.grievance.officerComment && (
                <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Latest Field Officer Update:
                  </span>
                  <p className="text-xs font-medium text-gray-800">
                    &ldquo;{data.grievance.officerComment}&rdquo;
                  </p>
                </div>
              )}

              {/* Status Timeline */}
              <div className="pt-2 border-t border-gray-200/80 space-y-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Activity Audit Trail
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-xs text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Submitted and AI Triaged via Gemini 2.5 Flash</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-600">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                    <span>Assigned to {data.grievance.department}</span>
                  </div>
                  {data.grievance.status === 'In_Progress' && (
                    <div className="flex items-center gap-2.5 text-xs text-amber-700 font-semibold">
                      <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                      <span>Repair Team Dispatched on Site</span>
                    </div>
                  )}
                  {data.grievance.status === 'Resolved' && (
                    <div className="flex items-center gap-2.5 text-xs text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Civic hazard successfully resolved and verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
