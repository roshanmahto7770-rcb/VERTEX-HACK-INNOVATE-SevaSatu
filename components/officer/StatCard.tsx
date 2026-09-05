import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeType = 'positive',
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'negative':
        return 'text-red-500';
      case 'neutral':
        return 'text-amber-500';
      case 'positive':
      default:
        return 'text-emerald-500';
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 tracking-tight">
        {value}
      </div>
      <div className={`flex items-center gap-1 text-xs font-semibold mt-2 ${getChangeColor()}`}>
        <ArrowUpRight className="w-3.5 h-3.5" />
        <span>{change}</span>
      </div>
    </div>
  );
};
