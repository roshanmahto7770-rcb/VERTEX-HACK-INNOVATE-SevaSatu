'use client';

import React from 'react';
import { ChevronDown, ArrowRight, Layers } from 'lucide-react';
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

  // Format date nicely
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ' ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '16 May 2025 10:30 AM';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
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
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Submitted On</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {complaints.map((item) => (
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

                <td className="px-5 py-3.5 text-gray-500">
                  {item.addressText.split(',')[0]}
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
            ))}
          </tbody>
        </table>
      </div>

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
