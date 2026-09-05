'use client';

import React, { useState } from 'react';
import {
  X,
  Layers,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Clock,
  Sparkles,
  Split,
  Building,
  Loader2,
} from 'lucide-react';
import { MasterComplaint, Grievance } from '@/lib/types';

interface ClusterVerificationModalProps {
  cluster: MasterComplaint | null;
  linkedComplaints: Grievance[];
  isOpen: boolean;
  onClose: () => void;
  onClusterVerified: (master: MasterComplaint) => void;
  onUnlinkChild?: (childId: string) => void;
}

export const ClusterVerificationModal: React.FC<ClusterVerificationModalProps> = ({
  cluster,
  linkedComplaints,
  isOpen,
  onClose,
  onClusterVerified,
  onUnlinkChild,
}) => {
  const [selectedDept, setSelectedDept] = useState(
    cluster?.department || 'Public Works Department (PWD)'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen || !cluster) return null;

  const handleVerifyCluster = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/officer/clusters/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterComplaintId: cluster.id,
          verified: true,
          departmentOverride: selectedDept,
          officerName: 'Rohit Sharma (PWD Officer)',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccessNotice('Cluster verified! Assigned to PWD and synced to field units.');
      onClusterVerified(data.master);
    } catch (err: any) {
      alert(err.message || 'Error verifying cluster');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlink = async (childId: string) => {
    try {
      const res = await fetch('/api/officer/clusters/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterComplaintId: cluster.id,
          unlinkGrievanceId: childId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && onUnlinkChild) {
        onUnlinkChild(childId);
      }
    } catch (err: any) {
      alert(err.message || 'Error unlinking');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  Human-in-the-Loop Cluster Verification
                </h3>
                <span className="font-mono text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                  {cluster.masterTicketNumber}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Spatial Radius &le; 50m • Gemini Semantic Similarity &ge; 80%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Master Summary Card */}
          <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-900 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                Master Cluster Target
              </span>
              <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                Priority: {cluster.priorityScore}/10 ({cluster.severityLevel})
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-900 leading-snug">
              {cluster.aiSummary}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-gray-600 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                {cluster.primaryLocation.addressText}
              </span>
              <span>•</span>
              <span>{cluster.complaintCount} Linked Submissions</span>
            </div>
          </div>

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Linked Complaints Side-by-Side Comparison */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Linked Submissions in this Cluster ({linkedComplaints.length})
            </h4>

            <div className="space-y-3">
              {linkedComplaints.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    {item.imageUrl && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                        <img
                          src={item.imageUrl}
                          alt="Grievance thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900">
                          {item.ticketNumber}
                        </span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                          {item.similarityScore || 94}% AI Match
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Language: {item.detectedLanguage}
                        </span>
                      </div>
                      <h5 className="font-semibold text-gray-800 mt-0.5">
                        {item.issueTitle}
                      </h5>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {idx > 0 && (
                    <button
                      onClick={() => handleUnlink(item.id)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-lg flex items-center gap-1 transition-colors self-end sm:self-auto shrink-0"
                    >
                      <Split className="w-3.5 h-3.5" />
                      Unlink (False Positive)
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Department Assignment Override */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-orange-600" />
              Department Assignment
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="Public Works Department (PWD)">Public Works Department (PWD)</option>
              <option value="Drainage & Sewerage Board">Drainage & Sewerage Board</option>
              <option value="Electricity & Street Lighting Board">Electricity & Street Lighting Board</option>
              <option value="Municipal Solid Waste Management">Municipal Solid Waste Management</option>
              <option value="Water Supply & Jal Board">Water Supply & Jal Board</option>
            </select>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100"
            >
              Close
            </button>

            <button
              onClick={handleVerifyCluster}
              disabled={isProcessing}
              className="px-6 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl shadow-md shadow-orange-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying Cluster...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Confirm Cluster & Dispatch
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
