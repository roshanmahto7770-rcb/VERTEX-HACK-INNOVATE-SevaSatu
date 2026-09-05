'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const ComplaintsChart: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('This Week');
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; value: number } | null>(null);

  const data = [
    { day: '10 May', value: 180 },
    { day: '11 May', value: 160 },
    { day: '12 May', value: 270 },
    { day: '13 May', value: 190 },
    { day: '14 May', value: 290 },
    { day: '15 May', value: 260 },
    { day: '16 May', value: 310 },
  ];

  // SVG Chart Dimensions
  const width = 500;
  const height = 180;
  const paddingX = 35;
  const paddingY = 20;

  const maxValue = 400;

  // Map data to SVG coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i * (width - 2 * paddingX)) / (data.length - 1);
    const y = height - paddingY - (d.value / maxValue) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  // Generate smooth cubic bezier SVG path
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
  }, '');

  // Closed path for orange gradient area fill
  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Complaints Overview</h3>
          <p className="text-[11px] text-gray-400">Daily triage inflow across all wards</p>
        </div>
        <div className="relative inline-flex items-center">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
          >
            <span>{activeFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        {/* Y-axis grid labels */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400 font-mono">
          <span>400</span>
          <span>300</span>
          <span>200</span>
          <span>100</span>
          <span>0</span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 overflow-visible"
        >
          <defs>
            {/* Orange gradient for area under curve */}
            <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EA580C" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#F97316" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFEDD5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 100, 200, 300, 400].map((val) => {
            const y = height - paddingY - (val / maxValue) * (height - 2 * paddingY);
            return (
              <line
                key={val}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#orangeGradient)" />

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#EA580C"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive Data Points */}
          {points.map((pt, i) => (
            <g key={i} className="cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                className="fill-white stroke-orange-600 stroke-2 hover:r-6 transition-all"
                onMouseEnter={() => setHoveredPoint({ day: pt.day, value: pt.value })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between pl-8 pr-4 pt-2 text-[11px] text-gray-400 font-medium">
          {data.map((d, i) => (
            <span key={i}>{d.day}</span>
          ))}
        </div>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-md font-mono shadow-md">
            {hoveredPoint.day}: {hoveredPoint.value} complaints
          </div>
        )}
      </div>
    </div>
  );
};
