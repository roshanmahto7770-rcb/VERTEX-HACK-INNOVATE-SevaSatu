'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { Grievance, ComplaintStatus } from '@/lib/types';

interface ComplaintDetailModalProps {
  complaint: Grievance | null;
  onClose: () => void;
  onStatusUpdated: (updatedComplaint: Grievance) => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  onStatusUpdated,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('In_Progress');
  const [officerComment, setOfficerComment] = useState('Team is on the way for inspection.');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      setOfficerComment(complaint.officerComment || 'Team is on the way for inspection.');
      setUpdateSuccessMsg(null);
    }
  }, [complaint]);

  if (!complaint) return null;

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSuccessMsg(null);

    try {
      // Determine endpoint: if linked to master, patch master or individual
      const targetId = complaint.masterComplaintId || complaint.id;
      const res = await fetch(`/api/officer/master-tickets/${targetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          officerComment,
          officerName: 'Rohit Sharma (PWD Officer)',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      setUpdateSuccessMsg(
        complaint.masterComplaintId
          ? `Status updated to ${selectedStatus}! Cascaded to all linked cluster complaints.`
          : `Grievance status updated to ${selectedStatus}.`
      );

      const updated = {
        ...complaint,
        status: selectedStatus,
        officerComment,
      };

      onStatusUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
      {/* Slide-over panel matching the bottom-right screenshot */}
      <div className="relative w-full max-w-md bg-white sm:rounded-3xl shadow-2xl border-l sm:border border-gray-100 h-full sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <h3 className="text-base font-bold text-gray-900">Complaint Details</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Top ID & Badge */}
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm text-gray-900">
              ID: {complaint.ticketNumber}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200">
              {complaint.severityLevel}
            </span>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Title
            </label>
            <p className="font-bold text-gray-900 text-sm">{complaint.issueTitle}</p>
          </div>

          {/* Location */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Location
            </label>
            <p className="text-gray-700 font-medium">{complaint.addressText}</p>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              Lat: {complaint.latitude}, Long: {complaint.longitude}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Category
            </label>
            <span className="inline-block font-semibold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
              {complaint.category}
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Description
            </label>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
              {complaint.description}
            </p>
          </div>

          {/* Submitted On */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Submitted On
            </label>
            <p className="text-gray-700 font-medium">16 May 2025, 10:30 AM</p>
          </div>

          {/* Attachments thumbnails */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              Attachments
            </label>
            <div className="flex gap-2">
              {(complaint.attachments && complaint.attachments.length > 0
                ? complaint.attachments
                : [
                    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1584463699039-448a60ff960a?w=600&auto=format&fit=crop&q=80',
                  ]
              ).map((src, idx) => (
                <div
                  key={idx}
                  className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                >
                  <img
                    src={src}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Master Cluster Notice */}
          {complaint.masterComplaintId && (
            <div className="p-3 bg-purple-50 border border-purple-200/70 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Linked Master Cluster</span>
              </div>
              <p className="text-[11px] text-purple-700 leading-tight">
                Any status update below will automatically cascade to all 3 linked complaints in this 50m zone.
              </p>
            </div>
          )}

          {updateSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{updateSuccessMsg}</span>
            </div>
          )}

          {/* Status Update Form */}
          <form onSubmit={handleUpdateStatus} className="pt-2 border-t border-gray-100 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Update Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Assigned">Assigned</option>
                <option value="In_Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Officer Comment
              </label>
              <textarea
                rows={2}
                value={officerComment}
                onChange={(e) => setOfficerComment(e.target.value)}
                placeholder="Add departmental update or resolution note..."
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating Status...
                </>
              ) : (
                'Update Status'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
