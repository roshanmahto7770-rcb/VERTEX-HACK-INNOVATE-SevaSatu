'use client';

import React from 'react';
import { Sparkles, TrendingUp, MapPin } from 'lucide-react';

export const PriorityDistribution: React.FC = () => {
  const priorities = [
    { label: 'Critical (9-10)', percentage: 18, color: '#EF4444' },
    { label: 'High (7-8)', percentage: 32, color: '#F97316' },
    { label: 'Medium (4-6)', percentage: 30, color: '#F59E0B' },
    { label: 'Low (1-3)', percentage: 20, color: '#10B981' },
  ];

  // SVG Donut Circle parameters
  const size = 150;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Priority Distribution Donut Card */}
      <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
        <div className="mb-2">
          <h3 className="text-sm font-bold text-gray-900">Priority Distribution</h3>
          <p className="text-[11px] text-gray-400">Severity rating categorization</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto">
          {/* Donut Chart */}
          <div className="relative w-34 h-34 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
              {priorities.map((item, idx) => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                cumulativePercent += item.percentage;

                return (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-gray-900 leading-none">100%</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Triage</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 flex-1 w-full">
            {priorities.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600 font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-gray-900">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights Card */}
      <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">AI Insights</h3>
              <p className="text-[11px] text-gray-400">Automated spatial & trend intelligence</p>
            </div>
          </div>
        </div>

        <div className="space-y-3.5 my-auto">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-gray-100">
            <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 leading-relaxed">
              Most complaints are from <strong className="font-bold text-gray-900">MG Road</strong>,{' '}
              <strong className="font-bold text-gray-900">Lajpat Nagar</strong>, and{' '}
              <strong className="font-bold text-gray-900">Tilak Nagar</strong> areas.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-50/50 border border-orange-100/60">
            <TrendingUp className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 leading-relaxed">
              Road damage complaints increased by <strong className="font-bold text-orange-700">25% this week</strong> due to post-monsoon asphalt wear.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-start">
          <button
            type="button"
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
          >
            View Full Report
          </button>
        </div>
      </div>
    </div>
  );
};
