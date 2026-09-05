'use client';

import React from 'react';

export const CategoriesDonut: React.FC = () => {
  const categories = [
    { label: 'Road Damage', percentage: 42, color: '#F97316' },
    { label: 'Drainage', percentage: 22, color: '#06B6D4' },
    { label: 'Street Light', percentage: 15, color: '#3B82F6' },
    { label: 'Garbage', percentage: 12, color: '#F59E0B' },
    { label: 'Others', percentage: 9, color: '#94A3B8' },
  ];

  // SVG Donut Circle parameters
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-gray-900">Top Categories</h3>
        <p className="text-[11px] text-gray-400">Departmental grievance breakdown</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
            {categories.map((cat, idx) => {
              const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += cat.percentage;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={cat.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-85"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-black text-gray-900 leading-none">1,248</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 flex-1 w-full">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-gray-600 font-medium">{cat.label}</span>
              </div>
              <span className="font-bold text-gray-900">{cat.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
