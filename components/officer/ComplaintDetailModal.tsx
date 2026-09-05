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
  Building2,
  User,
  Phone,
  ArrowRight,
  RefreshCw,
  Wrench,
  Droplets,
  Zap,
  Trash2,
  ShieldCheck,
  Sparkles,
  XCircle,
  Check,
} from 'lucide-react';
import { Grievance, ComplaintStatus } from '@/lib/types';
import { MiniMap } from '@/components/common/MiniMap';

interface ComplaintDetailModalProps {
  complaint: Grievance | null;
  onClose: () => void;
  onStatusUpdated: (updatedComplaint: Grievance) => void;
}

const DEPARTMENTS = [
  'Public Works Department (PWD)',
  'Delhi Jal Board (DJB)',
  'Municipal Corporation of Delhi (MCD)',
  'BSES / Electricity Board',
  'Traffic Police Department',
  'Drainage & Sewerage Board',
  'Health & Sanitation Department',
  'Parks & Horticulture Department',
];

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  onStatusUpdated,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('In_Progress');
  const [selectedDept, setSelectedDept] = useState<string>('Public Works Department (PWD)');
  const [officerComment, setOfficerComment] = useState('Team is on the way for inspection.');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      setSelectedDept(complaint.department || 'Public Works Department (PWD)');
      setOfficerComment(complaint.officerComment || 'Team is on the way for inspection.');
      setUpdateSuccessMsg(null);
    }
  }, [complaint]);

  if (!complaint) return null;

  // Department helper icon & color
  const getDeptBadgeStyle = (dept: string) => {
    if (dept.includes('PWD') || dept.includes('Road') || dept.includes('Works')) {
      return {
        icon: <Wrench className="w-4 h-4 text-orange-600" />,
        bg: 'bg-orange-50 border-orange-200 text-orange-950',
        officer: 'Er. Rohit Sharma (Junior Engineer, PWD Zone 4)',
        contact: '+91 11-2338-4100',
      };
    }
    if (dept.includes('Jal') || dept.includes('Water') || dept.includes('Drainage') || dept.includes('Sewer')) {
      return {
        icon: <Droplets className="w-4 h-4 text-blue-600" />,
        bg: 'bg-blue-50 border-blue-200 text-blue-950',
        officer: 'Suresh Meena (Executive Engineer, Water & Drainage)',
        contact: '+91 11-2351-8899',
      };
    }
    if (dept.includes('Electricity') || dept.includes('BSES') || dept.includes('Power')) {
      return {
        icon: <Zap className="w-4 h-4 text-amber-600" />,
        bg: 'bg-amber-50 border-amber-200 text-amber-950',
        officer: 'Vikas Gupta (Assistant Lineman Squad Lead)',
        contact: '+91 11-2852-7711',
      };
    }
    if (dept.includes('MCD') || dept.includes('Sanitation') || dept.includes('Garbage')) {
      return {
        icon: <Trash2 className="w-4 h-4 text-emerald-600" />,
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
        officer: 'Karan Singh (Sanitation Inspector Ward 12)',
        contact: '+91 11-2741-3322',
      };
    }
    return {
      icon: <Building2 className="w-4 h-4 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-200 text-purple-950',
      officer: 'Rajiv Malhotra (Civic Redressal Officer)',
      contact: '+91 11-2301-9988',
    };
  };

  const currentDeptInfo = getDeptBadgeStyle(selectedDept || complaint.department);

  // Direct Officer Decision Handler (Accept & Assign OR Decline / Reject)
  const handleQuickDecision = async (
    targetStatus: ComplaintStatus,
    targetDept: string,
    comment: string
  ) => {
    setIsUpdating(true);
    setUpdateSuccessMsg(null);

    try {
      const targetId = complaint.masterComplaintId || complaint.id;
      const res = await fetch(`/api/officer/master-tickets/${targetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          department: targetDept,
          officerComment: comment,
          officerName: currentDeptInfo.officer,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      setSelectedStatus(targetStatus);
      setSelectedDept(targetDept);
      setOfficerComment(comment);

      setUpdateSuccessMsg(
        targetStatus === 'Assigned'
          ? `Officer Approved: Grievance authorized & assigned to ${targetDept}!`
          : `Officer Decision: Grievance marked as ${targetStatus}.`
      );

      const updated: Grievance = {
        ...complaint,
        status: targetStatus,
        department: targetDept,
        officerComment: comment,
        assignedOfficer: currentDeptInfo.officer,
      };

      onStatusUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleQuickDecision(selectedStatus, selectedDept, officerComment);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
      {/* Slide-over panel matching the bottom-right design */}
      <div className="relative w-full max-w-md bg-white sm:rounded-3xl shadow-2xl border-l sm:border border-gray-100 h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">Complaint Details</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200/80 text-gray-700 font-bold">
              {complaint.ticketNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Top ID & Severity Badge */}
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm text-gray-900">
              ID: {complaint.ticketNumber}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                complaint.severityLevel === 'Critical'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : complaint.severityLevel === 'High'
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}
            >
              {complaint.severityLevel} • Score {complaint.priorityScore}/10
            </span>
          </div>

          {/* ── AI AGENT TRIAGE PROPOSAL & OFFICER REVIEW CARD ── */}
          {complaint.status === 'Pending_Verification' ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white shadow-xl space-y-3 border border-indigo-400/40 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 shadow-inner">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300 block">
                      AI Agent Triage Proposal
                    </span>
                    <h4 className="text-xs font-bold text-white">
                      Officer Decision Required
                    </h4>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-400 text-gray-950 font-black px-2 py-0.5 rounded-full shadow-xs">
                  Review Pending
                </span>
              </div>

              {/* AI Proposed Department & Confidence */}
              <div className="p-2.5 rounded-xl bg-black/35 border border-white/10 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-indigo-200">Recommended Action:</span>
                  <span className="font-bold text-emerald-300 text-right">
                    Assign to {complaint.department}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-300">
                  <span>AI Triage Match:</span>
                  <span className="font-mono font-bold text-indigo-200">
                    {complaint.similarityScore ? `${complaint.similarityScore}%` : '96% High Accuracy'}
                  </span>
                </div>
                {complaint.severityReasoning && (
                  <p className="text-[10px] text-indigo-100/90 pt-1 border-t border-white/10 italic">
                    &ldquo;{complaint.severityReasoning}&rdquo;
                  </p>
                )}
              </div>

              {/* Action Buttons for Officer */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    handleQuickDecision(
                      'Assigned',
                      selectedDept || complaint.department,
                      `Officer Approved & Authorized: Assigned to ${selectedDept || complaint.department}.`
                    )
                  }
                  className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept & Assign</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    handleQuickDecision(
                      'Rejected',
                      selectedDept || complaint.department,
                      'Officer Decision: Declined / Rejected after review.'
                    )
                  }
                  className="py-2.5 px-3 rounded-xl bg-red-600/90 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 transition-all cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Decline / Reject</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── ASSIGNED DEPARTMENT & FIELD SQUAD CARD ── */
            <div className={`p-3.5 rounded-2xl border ${currentDeptInfo.bg} shadow-2xs space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white shadow-2xs">
                    {currentDeptInfo.icon}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-70 block">
                      Assigned Department
                    </span>
                    <h4 className="text-xs font-bold leading-tight">
                      {complaint.department || selectedDept}
                    </h4>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/90 border border-current/20 uppercase">
                  {complaint.status}
                </span>
              </div>

              {/* Officer in charge & Direct line */}
              <div className="pt-2 border-t border-black/5 flex flex-col gap-1 text-[11px]">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  <span>
                    <strong className="font-bold">Officer:</strong>{' '}
                    {complaint.assignedOfficer || currentDeptInfo.officer}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] opacity-80 pl-5">
                  <span>Direct Line: {currentDeptInfo.contact}</span>
                  <span className="font-mono">Zone Quick-Action Unit</span>
                </div>
              </div>
            </div>
          )}

          {/* Citizen Reporter Details */}
          {(complaint.citizenName || complaint.citizenPhone) && (
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Citizen Reporter
              </span>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-800">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  {complaint.citizenName || 'Verified Citizen'}
                </span>
                {complaint.citizenPhone && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-gray-600">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {complaint.citizenPhone}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Title
            </label>
            <p className="font-bold text-gray-900 text-sm">{complaint.issueTitle}</p>
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

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Incident Location & Navigation
            </label>
            <p className="text-gray-800 font-bold">{complaint.addressText}</p>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-orange-600" />
              Lat: {complaint.latitude}, Long: {complaint.longitude}
            </p>

            {/* Mini Map */}
            <div className="pt-1">
              <MiniMap
                latitude={complaint.latitude}
                longitude={complaint.longitude}
                addressText={complaint.addressText}
                height="h-44"
                showNavigationButton={true}
              />
            </div>
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
            <p className="text-gray-700 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {new Date(complaint.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          {/* Attachments thumbnails */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              Attachments / Visual Proof
            </label>
            <div className="flex gap-2">
              {(complaint.attachments && complaint.attachments.length > 0
                ? complaint.attachments
                : [
                    complaint.imageUrl ||
                      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=600&auto=format&fit=crop&q=80',
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
                Any status update or department reassignment below will automatically cascade to all linked complaints in this 50m zone.
              </p>
            </div>
          )}

          {updateSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{updateSuccessMsg}</span>
            </div>
          )}

          {/* ── STATUS & DEPARTMENT UPDATE FORM ── */}
          <form onSubmit={handleUpdateStatus} className="pt-3 border-t border-gray-100 space-y-3">
            {/* Reassign Department */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between mb-1">
                <span>Assigned Department</span>
                <span className="text-[9px] text-orange-600 font-normal">Re-assignable</span>
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Update Status */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Update Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Assigned">Assigned to Department</option>
                <option value="In_Progress">In Progress (Field Work)</option>
                <option value="Resolved">Resolved & Closed</option>
                <option value="Rejected">Rejected / Invalid</option>
              </select>
            </div>

            {/* Officer Comment */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Officer / Department Action Note
              </label>
              <textarea
                rows={2}
                value={officerComment}
                onChange={(e) => setOfficerComment(e.target.value)}
                placeholder="Add departmental update or field resolution note..."
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
                  Updating Department & Status...
                </>
              ) : (
                'Update Status & Department'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

