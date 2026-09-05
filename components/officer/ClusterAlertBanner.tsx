'use client';

import React from 'react';
import { AlertTriangle, Layers, CheckCircle, ArrowRight } from 'lucide-react';
import { MasterComplaint } from '@/lib/types';

interface ClusterAlertBannerProps {
  cluster: MasterComplaint | null;
  onViewCluster: (cluster: MasterComplaint) => void;
  onVerifyCluster: (cluster: MasterComplaint) => void;
}

export const ClusterAlertBanner: React.FC<ClusterAlertBannerProps> = ({
  cluster,
  onViewCluster,
  onVerifyCluster,
}) => {
  if (!cluster || cluster.complaintCount <= 1) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
      {/* Left icon & text */}
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-gray-900">
              ⚠️ {cluster.complaintCount} related complaints detected at same location ({cluster.primaryLocation.addressText.split('(')[0].trim()})
            </h4>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              Spatial Radius &le; 50m
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">
            Gemini Semantic Similarity matched multiple citizen reports to Master Ticket{' '}
            <strong className="font-mono text-gray-800">{cluster.masterTicketNumber}</strong>. Human verification needed before dispatch.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
        <button
          onClick={() => onViewCluster(cluster)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-orange-600" />
          View Cluster
        </button>

        <button
          onClick={() => onVerifyCluster(cluster)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm shadow-orange-600/30 transition-all cursor-pointer"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Verify & Assign
        </button>
      </div>
    </div>
  );
};
