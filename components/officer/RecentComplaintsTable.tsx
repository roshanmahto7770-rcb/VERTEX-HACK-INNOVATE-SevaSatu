'use client';

import React, { useState } from 'react';
import { ChevronDown, ArrowRight, Layers, MapPin, Users, Phone, Clock, X, ExternalLink } from 'lucide-react';
import { Grievance } from '@/lib/types';

interface RecentComplaintsTableProps {
  complaints: Grievance[];
  onViewComplaint: (complaint: Grievance) => void;
  selectedDepartment: string;
  onSelectDepartment: (dept: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onViewAllClick?: () => void;
}

export const RecentComplaintsTable: React.FC<RecentComplaintsTableProps> = ({
  complaints,
  onViewComplaint,
  selectedDepartment,
  onSelectDepartment,
  sortBy,
  onSortChange,
  onViewAllClick,
}) => {
  // State for active location flyout modal/popover
  const [activeLocationGrievance, setActiveLocationGrievance] = useState<Grievance | null>(null);
  const [hoveredGrievanceId, setHoveredGrievanceId] = useState<string | null>(null);

  const getPriorityBadge = (score: number, level: string) => {
    if (score >= 9) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border border-red-200 bg-red-50 text-red-600">
          {score} Critical
        </span>
      );
    }
    if (score >= 7) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border border-orange-200 bg-orange-50 text-orange-600">
          {score} High
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border border-amber-200 bg-amber-50 text-amber-600">
        {score} Medium
      </span>
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'In_Progress':
        return <span className="text-amber-600 font-medium">In Progress</span>;
      case 'Resolved':
        return <span className="text-emerald-600 font-medium">Resolved</span>;
      case 'Linked_To_Master':
        return <span className="text-purple-600 font-medium">Clustered</span>;
      case 'Assigned':
      default:
        return <span className="text-gray-700 font-medium">Assigned</span>;
    }
  };

  // Helper to find all complaints originating from the same spot / cluster
  const getSameLocationComplaints = (target: Grievance) => {
    return complaints.filter((g) => {
      if (g.id === target.id) return true;
      if (target.masterComplaintId && g.masterComplaintId && g.masterComplaintId === target.masterComplaintId) {
        return true;
      }
      if (
        target.latitude &&
        target.longitude &&
        g.latitude &&
        g.longitude &&
        Math.abs(target.latitude - g.latitude) < 0.0008 &&
        Math.abs(target.longitude - g.longitude) < 0.0008
      ) {
        return true;
      }
      return false;
    });
  };

  // Format date nicely
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return (
        d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
        ' ' +
        d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch {
      return '16 May 2025 10:30 AM';
    }
  };

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-xs overflow-visible">
      {/* Table Header & Controls */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Recent Complaints</h3>
          <p className="text-[11px] text-gray-400">Triaged grievances pending resolution</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Department dropdown */}
          <select
            value={selectedDepartment}
            onChange={(e) => onSelectDepartment(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="All Departments">All Departments</option>
            <option value="PWD">PWD</option>
            <option value="Drainage">Drainage</option>
            <option value="Electricity">Electricity</option>
            <option value="Garbage">Garbage</option>
            <option value="Water Supply">Water Supply</option>
          </select>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="priority">Sort: Priority (High - Low)</option>
            <option value="date">Sort: Newest First</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Location & Cluster</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Submitted On</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {complaints.map((item) => {
              const locationMatches = getSameLocationComplaints(item);
              const hasMultipleReports = locationMatches.length > 1;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-orange-50/30 transition-colors group cursor-pointer"
                  onClick={() => onViewComplaint(item)}
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                    {item.ticketNumber}
                  </td>

                  <td className="px-5 py-3.5 font-semibold text-gray-900 max-w-[200px] truncate">
                    <div className="flex items-center gap-1.5">
                      <span>{item.issueTitle}</span>
                      {item.masterComplaintId && (
                        <span title="Clustered Duplicate" className="inline-flex">
                          <Layers className="w-3.5 h-3.5 text-purple-600" />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-gray-600 font-medium">
                    {item.category}
                  </td>

                  {/* Location Column with Same-Spot Hover & Click Popover */}
                  <td className="px-5 py-3.5 text-gray-600 relative">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[130px]">
                        {item.addressText.split(',')[0]}
                      </span>

                      {/* Same Location Icon & Badge */}
                      {hasMultipleReports ? (
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLocationGrievance(item);
                            }}
                            onMouseEnter={() => setHoveredGrievanceId(item.id)}
                            onMouseLeave={() => setHoveredGrievanceId(null)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 shadow-2xs transition-all hover:scale-105 cursor-pointer"
                            title="Click to view all citizens who reported from this spot"
                          >
                            <MapPin className="w-3 h-3 text-purple-600 fill-purple-200 animate-pulse" />
                            <span>{locationMatches.length}</span>
                          </button>

                          {/* Hover Tooltip Card */}
                          {hoveredGrievanceId === item.id && !activeLocationGrievance && (
                            <div 
                              className="absolute z-40 left-0 bottom-full mb-2 w-64 bg-gray-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-100 border border-gray-700"
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 border-b border-gray-700 pb-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-purple-400" />
                                  {locationMatches.length} Grievances at this spot
                                </span>
                                <span className="text-[9px] bg-purple-900/80 text-purple-200 px-1.5 py-0.5 rounded">
                                  Click to view all
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-300">
                                Citizens who complained:
                              </p>
                              <ul className="text-[10px] space-y-0.5 text-gray-200 font-medium">
                                {locationMatches.slice(0, 3).map((m) => (
                                  <li key={m.id} className="truncate">
                                    • {m.citizenName || 'Citizen'} ({m.ticketNumber})
                                  </li>
                                ))}
                                {locationMatches.length > 3 && (
                                  <li className="text-purple-300 text-[9px] italic">
                                    + {locationMatches.length - 3} more citizen reports...
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span title="Single report at this location" className="text-gray-400">
                          <MapPin className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    {getPriorityBadge(item.priorityScore, item.severityLevel)}
                  </td>

                  <td className="px-5 py-3.5">
                    {getStatusText(item.status)}
                  </td>

                  <td className="px-5 py-3.5 text-gray-500 text-[11px]">
                    {formatDate(item.createdAt)}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewComplaint(item);
                      }}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-orange-600 hover:text-white text-gray-700 border border-gray-200 hover:border-orange-600 transition-all cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── LOCATION CLUSTER POPUP MODAL / FLYOUT ── */}
      {activeLocationGrievance && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Same-Location Complaints ({getSameLocationComplaints(activeLocationGrievance).length} Reports)
                  </h4>
                  <p className="text-[11px] text-purple-700 font-medium">
                    {activeLocationGrievance.addressText}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveLocationGrievance(null)}
                className="w-7 h-7 rounded-full bg-gray-200/70 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of All Citizens who reported this spot */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs text-purple-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Users className="w-4 h-4 text-purple-600" />
                  {getSameLocationComplaints(activeLocationGrievance).length} Citizens flagged this exact hazard
                </span>
                <span className="text-[10px] font-mono text-purple-600">
                  GPS: {activeLocationGrievance.latitude}, {activeLocationGrievance.longitude}
                </span>
              </div>

              {getSameLocationComplaints(activeLocationGrievance).map((sibling) => (
                <div
                  key={sibling.id}
                  onClick={() => {
                    setActiveLocationGrievance(null);
                    onViewComplaint(sibling);
                  }}
                  className="p-3.5 rounded-2xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-purple-700 group-hover:text-purple-900 flex items-center gap-1">
                      {sibling.ticketNumber}
                      {sibling.id === activeLocationGrievance.id && (
                        <span className="text-[9px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-sans font-semibold">
                          Selected
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(sibling.createdAt)}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-gray-900 group-hover:text-purple-950">
                    {sibling.issueTitle}
                  </h5>

                  <p className="text-[11px] text-gray-600 line-clamp-2">
                    {sibling.description}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-100">
                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                      👤 {sibling.citizenName || 'Citizen Reporter'}
                      {sibling.citizenPhone && (
                        <span className="text-gray-400 font-normal">({sibling.citizenPhone})</span>
                      )}
                    </span>
                    <span className="text-purple-600 font-semibold flex items-center gap-1 group-hover:underline">
                      Inspect Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Spatial Radius &lt;= 50m Clustered Zone
              </span>
              <button
                type="button"
                onClick={() => setActiveLocationGrievance(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Link */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-center sm:justify-start px-5">
        <button
          onClick={onViewAllClick}
          className="text-xs font-bold text-gray-600 hover:text-orange-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>View All Complaints</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
